import {
  createSession,
  normalizeEmail,
  roleForEmail,
  toPublicUser,
  verifyPassword,
  type UserRow,
} from "@/lib/auth";
import { isEmail, json, jsonReadError, readJson } from "@/lib/api";
import { ensureSchema, one, query } from "@/lib/db";
import { clientKey, enforceRateLimit, RATE_LIMITS, resetRateLimit } from "@/lib/ratelimit";
import { usageSummary } from "@/lib/usage";

export const dynamic = "force-dynamic";

interface LoginBody {
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(RATE_LIMITS.login, request);
  if (limited) return limited;

  await ensureSchema();

  const body = await readJson<LoginBody>(request);
  if (!body.ok) return jsonReadError(body.error);

  const email = normalizeEmail(body.data.email ?? "");
  const password = body.data.password ?? "";
  if (!isEmail(email) || !password) return json({ error: "invalid_credentials" }, 400);

  const row = await one<UserRow>(
    `SELECT id, email, name, locale, role, plan, status, created_at, password_hash FROM users WHERE email = $1`,
    [email],
  );

  if (!row?.password_hash || !verifyPassword(password, row.password_hash)) {
    return json({ error: "invalid_credentials" }, 401);
  }

  if (row.status === "suspended") return json({ error: "account_suspended" }, 403);

  await resetRateLimit(RATE_LIMITS.login, clientKey(request));

  // An admin listed in ADMIN_EMAILS is promoted on sign-in, so access can be
  // recovered from the environment even if every admin seat was removed.
  const promoted = roleForEmail(email, row.role);
  if (promoted !== row.role) {
    await query("UPDATE users SET role = $2 WHERE id = $1", [row.id, promoted]);
    row.role = promoted;
  }
  await query("UPDATE users SET last_seen_at = now() WHERE id = $1", [row.id]);

  const user = toPublicUser(row);
  await createSession(user.id);
  const usage = await usageSummary({ userId: user.id, guestId: null }, user);

  return json({ user, usage });
}
