import { NextResponse } from "next/server";
import { getGuestId, getOrCreateGuestId, getSessionUser, type PublicUser } from "./auth";
import { ensureSchema, hasDatabase } from "./db";
import { runMaintenance } from "./maintenance";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

/** Upper bound for JSON bodies accepted by our own API routes. */
export const MAX_JSON_BYTES = 1024 * 1024;

export interface ApiScope {
  user: PublicUser | null;
  userId: number | null;
  guestId: string | null;
}

/**
 * Resolves who is calling: a signed-in account, or an anonymous browser id.
 * `createGuest` is only true for actions that count as usage, so simply
 * browsing the site never stores a cookie for a visitor.
 */
export async function resolveScope(options: { createGuest?: boolean } = {}): Promise<ApiScope | null> {
  if (!hasDatabase()) return null;
  await ensureSchema();
  // Fire-and-forget housekeeping (self-throttled to every 30 minutes).
  void runMaintenance();
  const user = await getSessionUser();
  if (user) return { user, userId: user.id, guestId: null };
  const guestId = options.createGuest ? await getOrCreateGuestId() : await getGuestId();
  return { user: null, userId: null, guestId };
}

export type ReadJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: "invalid_body" | "payload_too_large" };

/**
 * Reads a JSON body with a hard size limit, checked both from Content-Length
 * and from the real byte length, before anything is parsed.
 */
export async function readJson<T>(request: Request, maxBytes: number = MAX_JSON_BYTES): Promise<ReadJsonResult<T>> {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, error: "payload_too_large" };

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, error: "invalid_body" };
  }

  if (new TextEncoder().encode(text).byteLength > maxBytes) return { ok: false, error: "payload_too_large" };
  if (!text.trim()) return { ok: false, error: "invalid_body" };

  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, error: "invalid_body" };
  }
}

/** 413 for oversized bodies, 400 for anything else malformed. */
export const jsonReadError = (error: "invalid_body" | "payload_too_large") =>
  json({ error }, error === "payload_too_large" ? 413 : 400);

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

/**
 * Clamps a client-reported number into a sane range. Values sent by the browser
 * are only used for usage statistics and history — never as billing truth.
 */
export const cleanNumber = (value: unknown, max = 1_000_000_000): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(Math.round(parsed), max);
};
