import { json, resolveScope } from "@/lib/api";
import { usageSummary } from "@/lib/usage";

export const dynamic = "force-dynamic";

export async function GET() {
  const scope = await resolveScope();
  if (!scope) return json({ user: null, usage: null, database: false });

  const usage = await usageSummary(scope, scope.user);
  return json({ user: scope.user, usage, database: true });
}
