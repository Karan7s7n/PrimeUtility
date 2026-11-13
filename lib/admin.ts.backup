import type { ApiScope } from "./api";
import { isAdminRole, isSuperAdminRole, type PublicUser } from "./auth";
import { one, query } from "./db";

/* ------------------------------------------------------------------ access -- */

export type AdminGuard = { scope: ApiScope; user: PublicUser } | { error: "unauthorized" | "forbidden" };

/**
 * Every admin route and page goes through this. Authorisation is decided on the
 * server from the session, never from what the browser chose to render.
 */
export function adminGuard(scope: ApiScope | null): AdminGuard {
  if (!scope?.user) return { error: "unauthorized" };
  if (!isAdminRole(scope.user.role)) return { error: "forbidden" };
  return { scope, user: scope.user };
}

export const guardStatus = (error: "unauthorized" | "forbidden") => (error === "unauthorized" ? 401 : 403);

/* ------------------------------------------------------------------- audit -- */

export interface AuditEntry {
  id: number;
  actorEmail: string | null;
  action: string;
  target: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export async function recordAdminAction(
  actor: { id: number; email: string },
  action: string,
  target: string | null,
  metadata: Record<string, unknown> | null = null,
) {
  await query(
    `INSERT INTO admin_audit (actor_id, actor_email, action, target, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [actor.id, actor.email, action, target, metadata ? JSON.stringify(metadata) : null],
  );
}

export async function listAudit(limit = 60): Promise<AuditEntry[]> {
  const rows = await query<{
    id: string;
    actor_email: string | null;
    action: string;
    target: string | null;
    metadata: unknown;
    created_at: Date;
  }>(
    `SELECT id, actor_email, action, target, metadata, created_at
       FROM admin_audit
      ORDER BY created_at DESC
      LIMIT $1`,
    [Math.min(Math.max(limit, 1), 200)],
  );

  return rows.map((row) => ({
    id: Number(row.id),
    actorEmail: row.actor_email,
    action: row.action,
    target: row.target,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: (row.created_at instanceof Date ? row.created_at : new Date(row.created_at)).toISOString(),
  }));
}

/* ---------------------------------------------------------------- overview -- */

export interface ToolUsageRow {
  toolSlug: string;
  runs: number;
  errors: number;
  avgMs: number;
  savedBytes: number;
}

export interface AdminOverview {
  usersTotal: number;
  usersNew7d: number;
  usersSuspended: number;
  sessionsActive: number;
  usersActive7d: number;
  guests7d: number;
  admins: number;
  runsToday: number;
  runs7d: number;
  runs30d: number;
  runsFailed7d: number;
  runsGuest7d: number;
  avgMs: number;
  bytesSaved: number;
  topTools: ToolUsageRow[];
  planBreakdown: { plan: string; users: number }[];
  recentSignups: {
    id: number;
    email: string;
    name: string;
    role: string;
    plan: string;
    status: string;
    createdAt: string;
  }[];
}

const iso = (value: Date | string) => (value instanceof Date ? value : new Date(value)).toISOString();

export async function adminOverview(): Promise<AdminOverview> {
  const totals = await one<{
    users_total: string;
    users_new_7d: string;
    users_suspended: string;
    sessions_active: string;
    users_active_7d: string;
    admins: string;
    runs_today: string;
    runs_7d: string;
    runs_30d: string;
    runs_failed_7d: string;
    runs_guest_7d: string;
    guests_7d: string;
    avg_ms: string;
    bytes_saved: string;
  }>(`
    SELECT
      (SELECT count(*) FROM users)::text AS users_total,
      (SELECT count(*) FROM users WHERE created_at >= now() - interval '7 days')::text AS users_new_7d,
      (SELECT count(*) FROM users WHERE status = 'suspended')::text AS users_suspended,
      (SELECT count(*) FROM users WHERE role IN ('admin', 'super_admin'))::text AS admins,
      (SELECT count(*) FROM sessions WHERE expires_at > now())::text AS sessions_active,
      (SELECT count(DISTINCT user_id) FROM tool_runs
        WHERE user_id IS NOT NULL AND created_at >= now() - interval '7 days')::text AS users_active_7d,
      (SELECT count(*) FROM tool_runs WHERE created_at >= date_trunc('day', now()))::text AS runs_today,
      (SELECT count(*) FROM tool_runs WHERE created_at >= now() - interval '7 days')::text AS runs_7d,
      (SELECT count(*) FROM tool_runs WHERE created_at >= now() - interval '30 days')::text AS runs_30d,
      (SELECT count(*) FROM tool_runs
        WHERE status = 'error' AND created_at >= now() - interval '7 days')::text AS runs_failed_7d,
      (SELECT count(*) FROM tool_runs
        WHERE user_id IS NULL AND created_at >= now() - interval '7 days')::text AS runs_guest_7d,
      (SELECT count(DISTINCT guest_id) FROM tool_runs
        WHERE guest_id IS NOT NULL AND created_at >= now() - interval '7 days')::text AS guests_7d,
      (SELECT COALESCE(AVG(duration_ms), 0) FROM tool_runs
        WHERE created_at >= now() - interval '7 days')::text AS avg_ms,
      (SELECT COALESCE(SUM(GREATEST(input_size - output_size, 0)), 0) FROM tool_runs)::text AS bytes_saved
  `);

  const [topTools, plans, signups] = await Promise.all([
    query<{ tool_slug: string; runs: string; errors: string; avg_ms: string; saved: string }>(
      `SELECT tool_slug,
              count(*)::text AS runs,
              count(*) FILTER (WHERE status = 'error')::text AS errors,
              COALESCE(AVG(duration_ms), 0)::text AS avg_ms,
              COALESCE(SUM(GREATEST(input_size - output_size, 0)), 0)::text AS saved
         FROM tool_runs
        WHERE created_at >= now() - interval '7 days'
        GROUP BY tool_slug
        ORDER BY count(*) DESC
        LIMIT 12`,
    ),
    query<{ plan: string; users: string }>(
      `SELECT plan, count(*)::text AS users FROM users GROUP BY plan ORDER BY count(*) DESC`,
    ),
    query<{
      id: string;
      email: string;
      name: string;
      role: string;
      plan: string;
      status: string;
      created_at: Date;
    }>(
      `SELECT id, email, name, role, plan, status, created_at
         FROM users ORDER BY created_at DESC LIMIT 6`,
    ),
  ]);

  const num = (value: string | undefined) => Number(value ?? 0);

  return {
    usersTotal: num(totals?.users_total),
    usersNew7d: num(totals?.users_new_7d),
    usersSuspended: num(totals?.users_suspended),
    admins: num(totals?.admins),
    sessionsActive: num(totals?.sessions_active),
    usersActive7d: num(totals?.users_active_7d),
    guests7d: num(totals?.guests_7d),
    runsToday: num(totals?.runs_today),
    runs7d: num(totals?.runs_7d),
    runs30d: num(totals?.runs_30d),
    runsFailed7d: num(totals?.runs_failed_7d),
    runsGuest7d: num(totals?.runs_guest_7d),
    avgMs: num(totals?.avg_ms),
    bytesSaved: num(totals?.bytes_saved),
    topTools: topTools.map((row) => ({
      toolSlug: row.tool_slug,
      runs: num(row.runs),
      errors: num(row.errors),
      avgMs: num(row.avg_ms),
      savedBytes: num(row.saved),
    })),
    planBreakdown: plans.map((row) => ({ plan: row.plan, users: num(row.users) })),
    recentSignups: signups.map((row) => ({
      id: Number(row.id),
      email: row.email,
      name: row.name,
      role: row.role,
      plan: row.plan,
      status: row.status,
      createdAt: iso(row.created_at),
    })),
  };
}

/* ------------------------------------------------------------------- users -- */

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  locale: string;
  role: string;
  plan: string;
  status: string;
  createdAt: string;
  lastSeenAt: string | null;
  lastRunAt: string | null;
  runs7d: number;
  runsTotal: number;
  savedBytes: number;
  sessions: number;
}

export interface UserFilters {
  q?: string;
  plan?: string;
  role?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

const clean = (value: string | undefined, allowed: readonly string[]) =>
  value && allowed.includes(value) ? value : "";

const PER_PAGE = 20;

export async function listUsers(filters: UserFilters) {
  const q = (filters.q ?? "").trim().slice(0, 120);
  const plan = clean(filters.plan, ["free", "pro", "business"]);
  const role = clean(filters.role, ["user", "admin", "super_admin"]);
  const status = clean(filters.status, ["active", "suspended"]);
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const offset = (page - 1) * PER_PAGE;

  const where = `WHERE ($1 = '' OR u.email ILIKE '%' || $1 || '%' OR u.name ILIKE '%' || $1 || '%')
                   AND ($2 = '' OR u.plan = $2)
                   AND ($3 = '' OR u.role = $3)
                   AND ($4 = '' OR u.status = $4)`;

  const [rows, total] = await Promise.all([
    query<{
      id: string;
      email: string;
      name: string;
      locale: string;
      role: string;
      plan: string;
      status: string;
      created_at: Date;
      last_seen_at: Date | null;
      last_run_at: Date | null;
      runs_7d: string;
      runs_total: string;
      saved: string;
      sessions: string;
    }>(
      `SELECT u.id, u.email, u.name, u.locale, u.role, u.plan, u.status, u.created_at, u.last_seen_at,
              (SELECT max(r.created_at) FROM tool_runs r WHERE r.user_id = u.id) AS last_run_at,
              (SELECT count(*) FROM tool_runs r
                WHERE r.user_id = u.id AND r.created_at >= now() - interval '7 days')::text AS runs_7d,
              (SELECT count(*) FROM tool_runs r WHERE r.user_id = u.id)::text AS runs_total,
              (SELECT COALESCE(SUM(GREATEST(r.input_size - r.output_size, 0)), 0)
                 FROM tool_runs r WHERE r.user_id = u.id)::text AS saved,
              (SELECT count(*) FROM sessions s WHERE s.user_id = u.id AND s.expires_at > now())::text AS sessions
         FROM users u
         ${where}
        ORDER BY u.created_at DESC
        LIMIT $5 OFFSET $6`,
      [q, plan, role, status, PER_PAGE, offset],
    ),
    one<{ total: string }>(`SELECT count(*)::text AS total FROM users u ${where}`, [q, plan, role, status]),
  ]);

  const users: AdminUser[] = rows.map((row) => ({
    id: Number(row.id),
    email: row.email,
    name: row.name,
    locale: row.locale,
    role: row.role,
    plan: row.plan,
    status: row.status,
    createdAt: iso(row.created_at),
    lastSeenAt: row.last_seen_at ? iso(row.last_seen_at) : null,
    lastRunAt: row.last_run_at ? iso(row.last_run_at) : null,
    runs7d: Number(row.runs_7d),
    runsTotal: Number(row.runs_total),
    savedBytes: Number(row.saved),
    sessions: Number(row.sessions),
  }));

  const totalCount = Number(total?.total ?? 0);
  return { users, total: totalCount, page, perPage: PER_PAGE, pages: Math.max(1, Math.ceil(totalCount / PER_PAGE)) };
}

export type UserAction =
  | { action: "set_plan"; plan: "free" | "pro" | "business" }
  | { action: "set_role"; role: "user" | "admin" | "super_admin" }
  | { action: "set_status"; status: "active" | "suspended" }
  | { action: "delete" };

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Guards that keep an admin from locking themselves or the deployment out. */
export async function applyUserAction(
  actor: PublicUser,
  targetId: number,
  input: UserAction,
): Promise<ActionResult> {
  const target = await one<{
    id: string;
    email: string;
    role: string;
    plan: string;
    status: string;
  }>("SELECT id, email, role, plan, status FROM users WHERE id = $1", [targetId]);

  if (!target) return { ok: false, error: "user_not_found" };
  const superAdmins = Number(
    (await one<{ count: string }>("SELECT count(*)::text AS count FROM users WHERE role = 'super_admin'"))?.count ?? 0,
  );

  if (input.action === "set_plan") {
    await query("UPDATE users SET plan = $2 WHERE id = $1", [targetId, input.plan]);
    await recordAdminAction(actor, "user.set_plan", target.email, { plan: input.plan });
    return { ok: true };
  }

  if (input.action === "set_role") {
    if (!isSuperAdminRole(actor.role)) return { ok: false, error: "super_admin_required" };
    if (targetId === actor.id && input.role !== "super_admin") return { ok: false, error: "cannot_demote_self" };
    if (isSuperAdminRole(target.role) && input.role !== "super_admin" && superAdmins <= 1) {
      return { ok: false, error: "last_super_admin" };
    }
    // A demoted admin keeps no elevated session: their tokens are dropped.
    await query("UPDATE users SET role = $2 WHERE id = $1", [targetId, input.role]);
    if (input.role === "user") await query("DELETE FROM sessions WHERE user_id = $1", [targetId]);
    await recordAdminAction(actor, "user.set_role", target.email, { role: input.role });
    return { ok: true };
  }

  if (input.action === "set_status") {
    if (targetId === actor.id) return { ok: false, error: "cannot_suspend_self" };
    if (isSuperAdminRole(target.role) && !isSuperAdminRole(actor.role)) return { ok: false, error: "forbidden" };
    await query("UPDATE users SET status = $2 WHERE id = $1", [targetId, input.status]);
    if (input.status === "suspended") await query("DELETE FROM sessions WHERE user_id = $1", [targetId]);
    await recordAdminAction(actor, "user.set_status", target.email, { status: input.status });
    return { ok: true };
  }

  if (!isSuperAdminRole(actor.role)) return { ok: false, error: "super_admin_required" };
  if (targetId === actor.id) return { ok: false, error: "cannot_delete_self" };
  await query("DELETE FROM users WHERE id = $1", [targetId]);
  await recordAdminAction(actor, "user.delete", target.email, { plan: target.plan });
  return { ok: true };
}

/* ------------------------------------------------------------------- tools -- */

export interface AdminTool {
  slug: string;
  category: string;
  processing: string;
  isActive: boolean;
  note: string | null;
  runs7d: number;
  runsTotal: number;
  errors: number;
  avgMs: number;
  savedBytes: number;
  lastRunAt: string | null;
}

export async function listToolUsage(): Promise<Record<string, Omit<AdminTool, "slug" | "category" | "processing" | "isActive" | "note">>> {
  const rows = await query<{
    tool_slug: string;
    runs_7d: string;
    runs_total: string;
    errors: string;
    avg_ms: string;
    saved: string;
    last_run_at: Date | null;
  }>(
    `SELECT tool_slug,
            count(*) FILTER (WHERE created_at >= now() - interval '7 days')::text AS runs_7d,
            count(*)::text AS runs_total,
            count(*) FILTER (WHERE status = 'error')::text AS errors,
            COALESCE(AVG(duration_ms), 0)::text AS avg_ms,
            COALESCE(SUM(GREATEST(input_size - output_size, 0)), 0)::text AS saved,
            max(created_at) AS last_run_at
       FROM tool_runs
      GROUP BY tool_slug`,
  );

  return Object.fromEntries(
    rows.map((row) => [
      row.tool_slug,
      {
        runs7d: Number(row.runs_7d),
        runsTotal: Number(row.runs_total),
        errors: Number(row.errors),
        avgMs: Number(row.avg_ms),
        savedBytes: Number(row.saved),
        lastRunAt: row.last_run_at ? iso(row.last_run_at) : null,
      },
    ]),
  );
}

export async function setToolActive(slug: string, isActive: boolean, note: string | null) {
  await query(
    `INSERT INTO tool_settings (slug, is_active, note, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (slug) DO UPDATE SET is_active = $2, note = $3, updated_at = now()`,
    [slug, isActive, note],
  );
}

/* ---------------------------------------------------------------- activity -- */

export async function listActivity(filters: { tool?: string; status?: string; page?: number }) {
  const tool = (filters.tool ?? "").trim().slice(0, 60);
  const status = clean(filters.status, ["ok", "error"]);
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const offset = (page - 1) * PER_PAGE;

  const where = `WHERE ($1 = '' OR r.tool_slug = $1) AND ($2 = '' OR r.status = $2)`;

  const [rows, total] = await Promise.all([
    query<{
      id: string;
      tool_slug: string;
      status: string;
      input_size: string;
      output_size: string;
      duration_ms: number;
      created_at: Date;
      email: string | null;
      name: string | null;
      guest_id: string | null;
      user_id: string | null;
    }>(
      `SELECT r.id, r.tool_slug, r.status, r.input_size, r.output_size, r.duration_ms, r.created_at,
              u.email, u.name, r.guest_id, r.user_id
         FROM tool_runs r
         LEFT JOIN users u ON u.id = r.user_id
         ${where}
        ORDER BY r.created_at DESC
        LIMIT $3 OFFSET $4`,
      [tool, status, PER_PAGE, offset],
    ),
    one<{ total: string }>(`SELECT count(*)::text AS total FROM tool_runs r ${where}`, [tool, status]),
  ]);

  const totalCount = Number(total?.total ?? 0);

  return {
    runs: rows.map((row) => ({
      id: Number(row.id),
      toolSlug: row.tool_slug,
      status: row.status,
      inputSize: Number(row.input_size),
      outputSize: Number(row.output_size),
      durationMs: Number(row.duration_ms),
      createdAt: iso(row.created_at),
      // No personal data beyond the account the run belongs to.
      account: row.email ? { id: Number(row.user_id), email: row.email, name: row.name ?? "" } : null,
      guest: row.guest_id ? row.guest_id.slice(0, 6) : null,
    })),
    total: totalCount,
    page,
    perPage: PER_PAGE,
    pages: Math.max(1, Math.ceil(totalCount / PER_PAGE)),
  };
}

/* ------------------------------------------------------- first admin claim -- */

export const adminCount = async () =>
  Number(
    (await one<{ count: string }>(
      "SELECT count(*)::text AS count FROM users WHERE role IN ('admin', 'super_admin')",
    ))?.count ?? 0,
  );

/**
 * Moves the empty admin seat to the signed-in account. It only works while the
 * deployment has no admin at all, so it cannot be used to climb later.
 */
export async function claimFirstAdmin(user: PublicUser): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE users
        SET role = 'super_admin'
      WHERE id = $1
        AND NOT EXISTS (SELECT 1 FROM users WHERE role IN ('admin', 'super_admin'))
      RETURNING id`,
    [user.id],
  );

  if (rows.length === 0) return false;
  await recordAdminAction({ id: user.id, email: user.email }, "admin.claim_first", user.email, null);
  return true;
}
