import { createSession, hashPassword, verifyPassword, type UserRow } from "@/lib/auth";
import { json, jsonReadError, readJson, resolveScope } from "@/lib/api";
import { one, query } from "@/lib/db";
import { clientKey, enforceRateLimit, RATE_LIMITS, resetRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

interface PasswordBody {
  currentPassword?: string;
  newPassword?: string;
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(RATE_LIMITS.password, request);
  if (limited) return limited;

  const scope = await resolveScope();
  if (!scope?.user) return json({ error: "unauthorized" }, 401);

  const body = await readJson<PasswordBody>(request);
  if (!body.ok) return jsonReadError(body.error);

  const current = body.data.currentPassword ?? "";
  const next = body.data.newPassword ?? "";
  if (next.length < 8) return json({ error: "password_too_short" }, 400);

  const row = await one<UserRow>("SELECT password_hash FROM users WHERE id = $1", [scope.user.id]);
  if (!row?.password_hash || !verifyPassword(current, row.password_hash)) {
    return json({ error: "wrong_password" }, 400);
  }

  await query("UPDATE users SET password_hash = $2 WHERE id = $1", [scope.user.id, hashPassword(next)]);

  await resetRateLimit(RATE_LIMITS.password, clientKey(request));

  // Changing the password invalidates every existing session, then signs the
  // current browser back in with a fresh token.
  await query("DELETE FROM sessions WHERE user_id = $1", [scope.user.id]);
  await createSession(scope.user.id);

  return json({ ok: true });
}
