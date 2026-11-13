import { json, jsonReadError, readJson, resolveScope } from "@/lib/api";
import { query } from "@/lib/db";
import { toPublicUser, type UserRow } from "@/lib/auth";
import { usageSummary } from "@/lib/usage";

export const dynamic = "force-dynamic";

interface ProfileBody {
  name?: string;
  locale?: string;
}

export async function PATCH(request: Request) {
  const scope = await resolveScope();
  if (!scope?.user) return json({ error: "unauthorized" }, 401);

  const body = await readJson<ProfileBody>(request);
  if (!body.ok) return jsonReadError(body.error);

  const name = (body.data.name ?? "").trim();

  if (name && name.length < 2) return json({ error: "name_too_short" }, 400);

  const rows = await query<UserRow>(
    `UPDATE users
    SET name = COALESCE(NULLIF($2, ''), name),
        locale = 'en'
  WHERE id = $1
  RETURNING id, email, name, locale, role, plan, status, created_at`,
[scope.user.id, name],
  );

  const user = toPublicUser(rows[0]);
  const usage = await usageSummary({ userId: user.id, guestId: null }, user);
  return json({ user, usage });
}
