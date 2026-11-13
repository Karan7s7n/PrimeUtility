import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { ensureSchema, one, query } from "./db";

export const SESSION_COOKIE = "tn_session";
export const GUEST_COOKIE = "tn_guest";
const SESSION_DAYS = 30;

export const ROLES = ["user", "admin", "super_admin"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["active", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface UserRow {
  id: string;
  email: string;
  name: string;
  locale: string;
  role: string;
  plan?: string;
  status?: string;
  created_at: Date;
  password_hash?: string;
}

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  locale: string;
  role: string;
  plan: string;
  status: string;
  createdAt: string;
}

/** Permission check used by every admin route and page — never by the UI alone. */
export const isAdminRole = (role?: string | null): boolean => role === "admin" || role === "super_admin";
export const isSuperAdminRole = (role?: string | null): boolean => role === "super_admin";

/**
 * Accounts listed in ADMIN_EMAILS are admins as soon as they sign in. Kept as an
 * environment value so a locked-out deployment can always be recovered without a
 * database console. The first visitor can also claim the empty admin seat.
 */
export const adminEmails = (): string[] =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

export const roleForEmail = (email: string, current: string): string =>
  adminEmails().includes(email) && !isAdminRole(current) ? "admin" : current;

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const toPublicUser = (row: UserRow): PublicUser => ({
  id: Number(row.id),
  email: row.email,
  name: row.name,
  locale: row.locale,
  role: row.role,
  plan: row.plan ?? "free",
  status: row.status ?? "active",
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
});

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const secureCookie = process.env.NODE_ENV === "production";

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await query("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)", [
    userId,
    sha256(token),
    expiresAt,
  ]);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
    expires: expiresAt,
  });
  return { token, expiresAt };
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await query("DELETE FROM sessions WHERE token_hash = $1", [sha256(token)]);
  }
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSessionUser(): Promise<PublicUser | null> {
  if (!process.env.DATABASE_URL) return null;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  await ensureSchema();
  // A suspended account loses access everywhere at once, on its next request.
  const row = await one<UserRow>(
    `SELECT u.id, u.email, u.name, u.locale, u.role, u.plan, u.status, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND u.status = 'active'`,
    [sha256(token)],
  );
  return row ? toPublicUser(row) : null;
}

/** Reads the anonymous browser id without creating one. */
export async function getGuestId(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_COOKIE)?.value ?? null;
}

/** Anonymous identifier so guest usage can be counted without an account. */
export async function getOrCreateGuestId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) return existing;
  const created = randomBytes(16).toString("base64url");
  store.set(GUEST_COOKIE, created, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  return created;
}
