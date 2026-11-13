import { ensureSchema, query } from "./db";

/**
 * Housekeeping that keeps the tables from growing forever.
 * There is no scheduler in this environment, so it runs at most once every
 * 30 minutes, triggered by ordinary API traffic, and never blocks the request.
 */
const INTERVAL_MS = 30 * 60 * 1000;
let lastRun = 0;
let running: Promise<void> | null = null;

export async function deleteExpiredSessions(): Promise<number> {
  const rows = await query<{ id: string }>("DELETE FROM sessions WHERE expires_at < now() RETURNING id");
  return rows.length;
}

export async function deleteOldRateLimits(olderThanHours = 2): Promise<number> {
  const rows = await query<{ count: string }>(
    `WITH deleted AS (
       DELETE FROM rate_limits
        WHERE window_start < now() - ($1 || ' hours')::interval
        RETURNING 1
     )
     SELECT count(*)::text AS count FROM deleted`,
    [String(olderThanHours)],
  );
  return Number(rows[0]?.count ?? 0);
}

export function runMaintenance(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastRun < INTERVAL_MS) return Promise.resolve();
  if (running) return running;

  lastRun = now;
  running = (async () => {
    try {
      await ensureSchema();
      await deleteExpiredSessions();
      await deleteOldRateLimits();
    } catch {
      // Housekeeping must never break a request.
    } finally {
      running = null;
    }
  })();

  return running;
}
