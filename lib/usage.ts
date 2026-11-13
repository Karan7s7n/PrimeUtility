import { one, query, withClient } from "./db";
import { plans, planForUser, type PlanId } from "./plans";
import type { PublicUser } from "./auth";

export interface UsageScope {
  userId: number | null;
  guestId: string | null;
}

export interface UsageSummary {
  plan: PlanId;
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  totalRuns: number;
  runsLast30: number;
  bytesSaved: number;
  byTool: { toolSlug: string; runs: number; savedBytes: number }[];
}

/** Stable key for the daily counter: an account id or an anonymous browser id. */
export const scopeKey = (scope: UsageScope) =>
  scope.userId ? `user:${scope.userId}` : `guest:${scope.guestId ?? ""}`;

const scopeClause = (scope: UsageScope) =>
  scope.userId ? { where: "user_id = $1", params: [scope.userId] as unknown[] } : { where: "guest_id = $1", params: [scope.guestId ?? ""] as unknown[] };

export async function usageSummary(scope: UsageScope, user: PublicUser | null): Promise<UsageSummary> {
  const plan = planForUser(user);
  const { where, params } = scopeClause(scope);

  const [today, totals, byTool] = await Promise.all([
    // The counter is what the allowance is spent from, so clearing the history
    // cannot hand back a fresh allowance; the MAX keeps older accounts correct.
    one<{ count: string }>(
      `SELECT GREATEST(
                COALESCE((SELECT count FROM usage_daily
                           WHERE scope_key = $2 AND day = date_trunc('day', now())::date), 0),
                (SELECT count(*) FROM tool_runs WHERE ${where} AND created_at >= date_trunc('day', now()))
              )::text AS count`,
      [...params, scopeKey(scope)],
    ),
    one<{ total: string; last30: string; saved: string }>(
      `SELECT count(*)::text AS total,
              count(*) FILTER (WHERE created_at >= now() - interval '30 days')::text AS last30,
              COALESCE(SUM(GREATEST(input_size - output_size, 0)), 0)::text AS saved
         FROM tool_runs WHERE ${where}`,
      params,
    ),
    query<{ tool_slug: string; runs: string; saved: string }>(
      `SELECT tool_slug,
              count(*)::text AS runs,
              COALESCE(SUM(GREATEST(input_size - output_size, 0)), 0)::text AS saved
         FROM tool_runs
        WHERE ${where} AND created_at >= now() - interval '30 days'
        GROUP BY tool_slug
        ORDER BY count(*) DESC
        LIMIT 12`,
      params,
    ),
  ]);

  const usedToday = Number(today?.count ?? 0);
  const dailyLimit = plans[plan].dailyLimit;

  return {
    plan,
    dailyLimit,
    usedToday,
    remaining: Math.max(0, dailyLimit - usedToday),
    totalRuns: Number(totals?.total ?? 0),
    runsLast30: Number(totals?.last30 ?? 0),
    bytesSaved: Number(totals?.saved ?? 0),
    byTool: byTool.map((row) => ({
      toolSlug: row.tool_slug,
      runs: Number(row.runs),
      savedBytes: Number(row.saved),
    })),
  };
}

export interface RunRow {
  id: string;
  tool_slug: string;
  input_size: string;
  output_size: string;
  duration_ms: number;
  status: string;
  created_at: Date;
}

export async function recentRuns(scope: UsageScope, limit = 50) {
  const { where, params } = scopeClause(scope);
  const rows = await query<RunRow>(
    `SELECT id, tool_slug, input_size, output_size, duration_ms, status, created_at
       FROM tool_runs
      WHERE ${where}
      ORDER BY created_at DESC
      LIMIT $2`,
    [...params, Math.min(Math.max(limit, 1), 200)],
  );

  return rows.map((row) => ({
    id: Number(row.id),
    toolSlug: row.tool_slug,
    inputSize: Number(row.input_size),
    outputSize: Number(row.output_size),
    durationMs: Number(row.duration_ms),
    status: row.status,
    createdAt: (row.created_at instanceof Date ? row.created_at : new Date(row.created_at)).toISOString(),
  }));
}

export interface RunInput {
  toolSlug: string;
  inputSize: number;
  outputSize: number;
  durationMs: number;
  status: "ok" | "error";
}

export interface Reservation {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

/**
 * Takes one slot from today's allowance and records the run in the same
 * transaction, guarded by a per-account advisory lock. Two requests arriving at
 * the same moment can therefore never both take the last slot: the second waits
 * for the first to commit and then sees the updated count.
 */
export async function reserveRun(scope: UsageScope, limit: number, run: RunInput): Promise<Reservation> {
  const lockKey = scopeKey(scope);
  const { where, params } = scopeClause(scope);

  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [lockKey]);

      // One slot is taken from today's counter only if it is still under the
      // limit; the WHERE clause makes that decision inside the database.
      const taken = await client.query<{ count: number }>(
        `INSERT INTO usage_daily (scope_key, day, count)
         VALUES ($1, date_trunc('day', now())::date, 1)
         ON CONFLICT (scope_key, day)
         DO UPDATE SET count = usage_daily.count + 1, updated_at = now()
         WHERE usage_daily.count < $2
         RETURNING count`,
        [lockKey, limit],
      );

      if (taken.rows.length === 0) {
        const current = await client.query<{ count: string }>(
          `SELECT GREATEST(
                    COALESCE((SELECT count FROM usage_daily
                               WHERE scope_key = $2 AND day = date_trunc('day', now())::date), 0),
                    (SELECT count(*) FROM tool_runs WHERE ${where} AND created_at >= date_trunc('day', now()))
                  )::text AS count`,
          [...params, lockKey],
        );
        await client.query("COMMIT");
        const used = Number(current.rows[0]?.count ?? limit);
        return { allowed: false, used, limit, remaining: 0 };
      }

      await client.query(
        `INSERT INTO tool_runs (user_id, guest_id, tool_slug, input_size, output_size, duration_ms, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [scope.userId, scope.guestId, run.toolSlug, run.inputSize, run.outputSize, run.durationMs, run.status],
      );
      await client.query("COMMIT");

      const used = Number(taken.rows[0].count);
      return { allowed: true, used, limit, remaining: Math.max(0, limit - used) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function countToday(scope: UsageScope) {
  const { where, params } = scopeClause(scope);
  const row = await one<{ count: string }>(
    `SELECT GREATEST(
              COALESCE((SELECT count FROM usage_daily
                         WHERE scope_key = $2 AND day = date_trunc('day', now())::date), 0),
              (SELECT count(*) FROM tool_runs WHERE ${where} AND created_at >= date_trunc('day', now()))
            )::text AS count`,
    [...params, scopeKey(scope)],
  );
  return Number(row?.count ?? 0);
}
