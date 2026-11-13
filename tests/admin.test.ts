import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiScope } from "@/lib/api";
import type { PublicUser } from "@/lib/auth";

const log: string[] = [];
let target: { id: string; email: string; role: string; plan: string; status: string } | null = null;
let superAdmins = 1;
let adminsInDeploy = 0;
let claimSucceeds = true;

const one = vi.fn(async (text: string) => {
  if (text.includes("FROM users WHERE id = $1")) return target;
  if (text.includes("role = 'super_admin'")) return { count: String(superAdmins) };
  if (text.includes("role IN ('admin', 'super_admin')")) return { count: String(adminsInDeploy) };
  return null;
});

const clientQuery = vi.fn(async (text: string) => {
  if (text.includes("SELECT id, email FROM users")) {
    return { rows: [{ id: "1", email: "someone@example.com" }] };
  }
  if (text.startsWith("UPDATE users")) {
    log.push("CLAIM");
    return { rows: claimSucceeds ? [{ id: "1" }] : [] };
  }
  if (text.includes("admin_audit")) log.push("AUDIT");
  if (text.includes("pg_advisory_xact_lock")) log.push("LOCK");
  if (text === "BEGIN") log.push("BEGIN");
  if (text === "COMMIT") log.push("COMMIT");
  if (text === "ROLLBACK") log.push("ROLLBACK");
  return { rows: [] };
});

const withClient = vi.fn(async (fn: (client: { query: typeof clientQuery }) => Promise<unknown>) =>
  fn({ query: clientQuery }),
);

const query = vi.fn(async (text: string) => {
  if (text.includes("NOT EXISTS")) {
    log.push("CLAIM");
    return claimSucceeds ? [{ id: "1" }] : [];
  } else if (text.startsWith("UPDATE users")) log.push("UPDATE_USER");
  else if (text.startsWith("DELETE FROM users WHERE id")) log.push("DELETE_USER");
  else if (text.startsWith("DELETE FROM sessions")) log.push("DELETE_SESSIONS");
  else if (text.includes("admin_audit")) log.push("AUDIT");
  return [];
});

vi.mock("@/lib/db", () => ({
  hasDatabase: () => true,
  one: (...args: unknown[]) => one(...(args as [string])),
  query: (...args: unknown[]) => query(...(args as [string])),
  withClient: (fn: (client: { query: typeof clientQuery }) => Promise<unknown>) => withClient(fn),
}));

const { adminGuard, applyUserAction, claimFirstAdmin, guardStatus } = await import("@/lib/admin");
const { withoutDisabled } = await import("@/lib/tool-settings");

const user = (role: string, plan = "free", status = "active"): PublicUser => ({
  id: 1,
  email: "someone@example.com",
  name: "Someone",
  locale: "en",
  role,
  plan,
  status,
  createdAt: new Date().toISOString(),
});

const scopeFor = (account: PublicUser | null): ApiScope => ({
  user: account,
  userId: account?.id ?? null,
  guestId: account ? null : "guest-1",
});

beforeEach(() => {
  log.length = 0;
  target = { id: "9", email: "target@example.com", role: "user", plan: "free", status: "active" };
  superAdmins = 1;
  adminsInDeploy = 1;
  claimSucceeds = true;
  process.env.ADMIN_EMAILS = "someone@example.com";
  one.mockClear();
  query.mockClear();
  clientQuery.mockClear();
  withClient.mockClear();
});

describe("admin authorisation", () => {
  it("refuses anonymous callers and treats them as unauthenticated", () => {
    const guard = adminGuard(scopeFor(null));
    expect(guard).toEqual({ error: "unauthorized" });
    expect(guardStatus("unauthorized")).toBe(401);
  });

  it("refuses a signed-in account without an admin role", () => {
    const guard = adminGuard(scopeFor(user("user")));
    expect(guard).toEqual({ error: "forbidden" });
    expect(guardStatus("forbidden")).toBe(403);
  });

  it("also refuses a pro plan on its own — the plan is not a permission", () => {
    expect(adminGuard(scopeFor(user("user", "pro")))).toEqual({ error: "forbidden" });
  });

  it("accepts both admin roles and hands back the account", () => {
    const admin = adminGuard(scopeFor(user("admin")));
    const owner = adminGuard(scopeFor(user("super_admin")));
    expect("scope" in admin && admin.user.role).toBe("admin");
    expect("scope" in owner && owner.user.role).toBe("super_admin");
  });
});

describe("user actions", () => {
  const actor = user("super_admin");

  it("changes a plan and writes an audit entry", async () => {
    const result = await applyUserAction(actor, 9, { action: "set_plan", plan: "pro" });
    expect(result).toEqual({ ok: true });
    expect(log).toEqual(["UPDATE_USER", "AUDIT"]);
  });

  it("never lets an admin suspend or delete their own account", async () => {
    expect(await applyUserAction(actor, actor.id, { action: "set_status", status: "suspended" })).toEqual({
      ok: false,
      error: "cannot_suspend_self",
    });
    expect(await applyUserAction(actor, actor.id, { action: "delete" })).toEqual({
      ok: false,
      error: "cannot_delete_self",
    });
    expect(log).toHaveLength(0);
  });

  it("keeps the last super admin in place", async () => {
    target = { ...target!, role: "super_admin" };
    superAdmins = 1;
    const result = await applyUserAction(actor, 9, { action: "set_role", role: "admin" });
    expect(result).toEqual({ ok: false, error: "last_super_admin" });
    expect(log).not.toContain("UPDATE_USER");
  });

  it("allows a role change once another super admin exists", async () => {
    target = { ...target!, role: "super_admin" };
    superAdmins = 2;
    expect(await applyUserAction(actor, 9, { action: "set_role", role: "admin" })).toEqual({ ok: true });
    expect(log).toEqual(["UPDATE_USER", "AUDIT"]);
  });

  it("only a super admin may change roles or delete", async () => {
    const plainAdmin = user("admin");
    expect(await applyUserAction(plainAdmin, 9, { action: "set_role", role: "admin" })).toEqual({
      ok: false,
      error: "super_admin_required",
    });
    expect(await applyUserAction(plainAdmin, 9, { action: "delete" })).toEqual({
      ok: false,
      error: "super_admin_required",
    });
    // an admin may still change a plan or suspend an ordinary account
    expect(await applyUserAction(plainAdmin, 9, { action: "set_plan", plan: "business" })).toEqual({ ok: true });
    expect(await applyUserAction(plainAdmin, 9, { action: "set_status", status: "suspended" })).toEqual({ ok: true });
    expect(log).toContain("DELETE_SESSIONS");
  });

  it("reports a missing account instead of failing silently", async () => {
    target = null;
    expect(await applyUserAction(actor, 404, { action: "set_plan", plan: "pro" })).toEqual({
      ok: false,
      error: "user_not_found",
    });
  });
});

describe("first admin claim", () => {
  it("gives the empty seat to the signed-in account", async () => {
    claimSucceeds = true;
    expect(await claimFirstAdmin(user("user"))).toBe(true);
    expect(log).toContain("LOCK");
    expect(log).toContain("CLAIM");
    expect(log).toContain("AUDIT");
    expect(log).toContain("COMMIT");
  });

  it("fails once an admin exists, so access cannot be taken later", async () => {
    claimSucceeds = false;
    expect(await claimFirstAdmin(user("user"))).toBe(false);
    expect(log).not.toContain("AUDIT");
    expect(log).toContain("ROLLBACK");
  });

  it("rejects an account not listed in ADMIN_EMAILS", async () => {
    process.env.ADMIN_EMAILS = "another@example.com";
    expect(await claimFirstAdmin(user("user"))).toBe(false);
    expect(log).not.toContain("CLAIM");
    expect(log).not.toContain("AUDIT");
    expect(log).toContain("ROLLBACK");
  });
});

describe("switched-off tools", () => {
  const list = [{ slug: "json-formatter" }, { slug: "merge-pdf" }];

  it("filters disabled tools out of a listing", () => {
    expect(withoutDisabled(list, ["merge-pdf"])).toEqual([{ slug: "json-formatter" }]);
  });

  it("leaves the list untouched when nothing is switched off", () => {
    expect(withoutDisabled(list, [])).toBe(list);
  });
});
