import { adminCount, adminGuard, claimFirstAdmin } from "@/lib/admin";
import { adminEmails } from "@/lib/auth";
import { json, resolveScope } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Tells the page whether the one-time claim is still available. */
export async function GET() {
  const scope = await resolveScope();
  if (!scope?.user) return json({ canClaim: false, admins: await adminCount() });
  const guard = adminGuard(scope);
  const admins = await adminCount();
  const allowed = adminEmails().includes(scope.user.email.trim().toLowerCase());

  return json({
    canClaim: allowed && "error" in guard && admins === 0,
    admins,
    role: scope.user.role,
  });
}

export async function POST() {
  const scope = await resolveScope();
  if (!scope?.user) return json({ error: "unauthorized" }, 401);

  const allowed = adminEmails().includes(scope.user.email.trim().toLowerCase());
  if (!allowed) return json({ error: "forbidden" }, 403);

  const claimed = await claimFirstAdmin(scope.user);
  if (!claimed) return json({ error: "admin_exists" }, 409);
  return json({ ok: true, role: "super_admin" });
}
