import { adminGuard, guardStatus, listToolUsage, recordAdminAction, setToolActive } from "@/lib/admin";
import { json, jsonReadError, readJson, resolveScope } from "@/lib/api";
import { toolSettings } from "@/lib/tool-settings";
import { toolSlugs, tools } from "@/lib/tools";

export const dynamic = "force-dynamic";

export async function GET() {
  const scope = await resolveScope();
  const guard = adminGuard(scope);
  if ("error" in guard) return json({ error: guard.error }, guardStatus(guard.error));

  const [settings, usage] = await Promise.all([toolSettings(), listToolUsage()]);

  const list = tools.map((tool) => ({
    slug: tool.slug,
    category: tool.category,
    processing: tool.processing,
    isActive: settings[tool.slug]?.isActive ?? true,
    note: settings[tool.slug]?.note ?? null,
    ...(usage[tool.slug] ?? { runs7d: 0, runsTotal: 0, errors: 0, avgMs: 0, savedBytes: 0, lastRunAt: null }),
  }));

  return json({ tools: list });
}

interface ToolBody {
  slug?: string;
  isActive?: boolean;
  note?: string;
}

export async function POST(request: Request) {
  const scope = await resolveScope();
  const guard = adminGuard(scope);
  if ("error" in guard) return json({ error: guard.error }, guardStatus(guard.error));

  const body = await readJson<ToolBody>(request);
  if (!body.ok) return jsonReadError(body.error);

  const slug = body.data.slug ?? "";
  if (!toolSlugs.includes(slug)) return json({ error: "unknown_tool" }, 400);
  if (typeof body.data.isActive !== "boolean") return json({ error: "invalid_state" }, 400);

  const note = (body.data.note ?? "").trim().slice(0, 200) || null;
  await setToolActive(slug, body.data.isActive, note);
  await recordAdminAction(guard.user, body.data.isActive ? "tool.enable" : "tool.disable", slug, { note });

  return json({ ok: true });
}
