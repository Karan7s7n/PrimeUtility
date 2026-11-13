import { adminGuard, guardStatus, listAudit } from "@/lib/admin";
import { json, resolveScope } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const scope = await resolveScope();
  const guard = adminGuard(scope);
  if ("error" in guard) return json({ error: guard.error }, guardStatus(guard.error));

  const url = new URL(request.url);
  return json({ entries: await listAudit(Number(url.searchParams.get("limit") ?? 60)) });
}
