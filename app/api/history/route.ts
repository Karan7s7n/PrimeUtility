import { json, resolveScope } from "@/lib/api";
import { query } from "@/lib/db";
import { recentRuns } from "@/lib/usage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const scope = await resolveScope();
  if (!scope) return json({ database: false, runs: [] }, 200);

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const runs = await recentRuns(scope, Number.isFinite(limit) ? limit : 50);
  return json({ database: true, runs });
}

export async function DELETE(request: Request) {
  const scope = await resolveScope();
  if (!scope) return json({ ok: false, database: false }, 200);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const numeric = Number(id);
    if (!Number.isFinite(numeric)) return json({ ok: false, error: "bad_id" }, 400);
    if (scope.userId) {
      await query("DELETE FROM tool_runs WHERE id = $1 AND user_id = $2", [numeric, scope.userId]);
    } else {
      await query("DELETE FROM tool_runs WHERE id = $1 AND guest_id = $2", [numeric, scope.guestId]);
    }
    return json({ ok: true });
  }

  if (scope.userId) {
    await query("DELETE FROM tool_runs WHERE user_id = $1", [scope.userId]);
  } else {
    await query("DELETE FROM tool_runs WHERE guest_id = $1", [scope.guestId]);
  }
  return json({ ok: true, cleared: true });
}
