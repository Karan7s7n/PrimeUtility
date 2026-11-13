import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { ensureSchema, one } from "./db";

/**
 * Fixed-window rate limiting backed by PostgreSQL, so it survives restarts and
 * works across instances. Raw IPs are never stored — only a salted hash.
 */
export interface RateLimitRule {
  rule: string;
  limit: number;
  windowSeconds: number;
}

export const RATE_LIMITS = {
  login: { rule: "auth:login", limit: 5, windowSeconds: 15 * 60 },
  register: { rule: "auth:register", limit: 10, windowSeconds: 60 * 60 },
  password: { rule: "auth:password", limit: 5, windowSeconds: 15 * 60 },
} satisfies Record<string, RateLimitRule>;

/** Start of the fixed window that contains `at`. */
export const windowStartFor = (at: Date, windowSeconds: number): Date => {
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(at.getTime() / windowMs) * windowMs);
};

/** Whole seconds until the window resets (at least 1). */
export const retryAfterFor = (windowStart: Date, windowSeconds: number, at: Date = new Date()): number => {
  const resetAt = windowStart.getTime() + windowSeconds * 1000;
  return Math.max(1, Math.ceil((resetAt - at.getTime()) / 1000));
};

const hashKey = (value: string) =>
  createHash("sha256")
    .update(`${process.env.RATE_LIMIT_SALT ?? "primeutility"}:${value}`)
    .digest("hex")
    .slice(0, 40);

/** Client identity for limiting: the proxy-forwarded IP, hashed. */
export const clientKey = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  const ip = first || request.headers.get("x-real-ip")?.trim() || "unknown";
  return hashKey(ip);
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  count: number;
}

/**
 * Counts one attempt against the rule and reports whether it is allowed.
 * The attempt is counted even when it is rejected, so sustained abuse keeps
 * the window closed.
 */
export async function consumeRateLimit(
  rule: RateLimitRule,
  key: string,
  at: Date = new Date(),
): Promise<RateLimitResult> {
  await ensureSchema();
  const windowStart = windowStartFor(at, rule.windowSeconds);

  const row = await one<{ count: number }>(
    `INSERT INTO rate_limits (rule, key_hash, window_start, count)
     VALUES ($1, $2, $3, 1)
     ON CONFLICT (rule, key_hash, window_start)
     DO UPDATE SET count = rate_limits.count + 1
     RETURNING count`,
    [rule.rule, key, windowStart],
  );

  const count = Number(row?.count ?? 1);
  return {
    allowed: count <= rule.limit,
    remaining: Math.max(0, rule.limit - count),
    retryAfter: retryAfterFor(windowStart, rule.windowSeconds, at),
    count,
  };
}

/**
 * Convenience wrapper for route handlers: returns a 429 response when the limit
 * is exceeded, or null when the request may continue.
 */
export async function enforceRateLimit(
  rule: RateLimitRule,
  request: Request,
): Promise<NextResponse | null> {
  const result = await consumeRateLimit(rule, clientKey(request));
  if (result.allowed) return null;

  return NextResponse.json(
    { error: "rate_limited", retryAfter: result.retryAfter },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Limit": String(rule.limit),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}

/**
 * Clears the counter for a key — called after a successful sign-in so a real
 * user is never locked out by their own successful attempts.
 */
export async function resetRateLimit(rule: RateLimitRule, key: string): Promise<void> {
  await ensureSchema();
  await one("DELETE FROM rate_limits WHERE rule = $1 AND key_hash = $2", [rule.rule, key]);
}

/** Drops rate-limit rows whose window closed long ago. */
export async function clearOldRateLimits(olderThanHours = 2): Promise<number> {
  const rows = await one<{ count: string }>(
    `WITH deleted AS (
       DELETE FROM rate_limits
        WHERE window_start < now() - ($1 || ' hours')::interval
        RETURNING 1
     )
     SELECT count(*)::text AS count FROM deleted`,
    [String(olderThanHours)],
  );
  return Number(rows?.count ?? 0);
}
