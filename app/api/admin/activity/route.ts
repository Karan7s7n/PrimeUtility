import { adminGuard, guardStatus, listActivity } from "@/lib/admin";
import { json, resolveScope } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const scope = await resolveScope();
  const guard = adminGuard(scope);
  if ("error" in guard) return json({ error: guard.error }, guardStatus(guard.error));

  const url = new URL(request.url);
  const activity = await listActivity({
    tool: url.searchParams.get("tool") ?? "",
    status: url.searchParams.get("status") ?? "",
    page: Number(url.searchParams.get("page") ?? 1),
  });

  return json(activity);
}
