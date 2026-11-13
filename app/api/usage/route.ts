import { json, resolveScope } from "@/lib/api";
import { usageSummary } from "@/lib/usage";

export const dynamic = "force-dynamic";

export async function GET() {
  const scope = await resolveScope();
  if (!scope) return json({ database: false, usage: null }, 200);
  const usage = await usageSummary(scope, scope.user);
  return json({ database: true, user: scope.user, usage });
}
