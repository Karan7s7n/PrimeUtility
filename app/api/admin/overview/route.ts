import { adminGuard, adminOverview, guardStatus } from "@/lib/admin";
import { json, resolveScope } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const scope = await resolveScope();
  const guard = adminGuard(scope);
  if ("error" in guard) return json({ error: guard.error }, guardStatus(guard.error));

  return json({ overview: await adminOverview() });
}
