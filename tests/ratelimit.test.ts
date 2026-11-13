import { beforeEach, describe, expect, it, vi } from "vitest";

const queries: { text: string; params: unknown[] }[] = [];
/** Mirrors the real unique key of the table: rule + key hash + window start. */
const counters = new Map<string, number>();

vi.mock("@/lib/db", () => ({
  ensureSchema: vi.fn(async () => undefined),
  hasDatabase: () => true,
  query: vi.fn(async (text: string, params: unknown[] = []) => {
    queries.push({ text, params });
    return [];
  }),
  one: vi.fn(async (text: string, params: unknown[] = []) => {
    queries.push({ text, params });
    if (text.includes("INSERT INTO rate_limits")) {
      const key = `${params[0]}|${params[1]}|${String(params[2])}`;
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      return { count: next };
    }
    if (text.includes("DELETE FROM rate_limits")) {
      const prefix = `${params[0]}|${params[1]}|`;
      for (const existing of [...counters.keys()]) {
        if (existing.startsWith(prefix)) counters.delete(existing);
      }
      return null;
    }
    return null;
  }),
}));

const { RATE_LIMITS, clientKey, consumeRateLimit, enforceRateLimit, retryAfterFor, windowStartFor } =
  await import("@/lib/ratelimit");

beforeEach(() => {
  queries.length = 0;
  counters.clear();
});

describe("fixed windows", () => {
  it("snaps a timestamp to the start of its window", () => {
    const rule = { rule: "test", limit: 5, windowSeconds: 900 };
    const start = windowStartFor(new Date("2026-09-24T10:07:30.000Z"), rule.windowSeconds);
    expect(start.toISOString()).toBe("2026-09-24T10:00:00.000Z");

    const later = windowStartFor(new Date("2026-09-24T10:59:59.000Z"), rule.windowSeconds);
    expect(later.toISOString()).toBe("2026-09-24T10:45:00.000Z");
  });

  it("computes Retry-After in whole seconds, never zero", () => {
    const start = new Date("2026-09-24T10:00:00.000Z");
    expect(retryAfterFor(start, 900, new Date("2026-09-24T10:00:00.000Z"))).toBe(900);
    expect(retryAfterFor(start, 900, new Date("2026-09-24T10:14:59.500Z"))).toBe(1);
    expect(retryAfterFor(start, 900, new Date("2026-09-24T10:15:01.000Z"))).toBe(1);
  });
});

describe("consumeRateLimit", () => {
  const rule = { rule: "auth:test", limit: 3, windowSeconds: 900 };

  it("allows attempts up to the limit and blocks the next one", async () => {
    const first = await consumeRateLimit(rule, "key-a");
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    const second = await consumeRateLimit(rule, "key-a");
    expect(second.allowed).toBe(true);

    const third = await consumeRateLimit(rule, "key-a");
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);

    const fourth = await consumeRateLimit(rule, "key-a");
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfter).toBeGreaterThan(0);
  });

  it("counts each key separately", async () => {
    await consumeRateLimit(rule, "key-a");
    await consumeRateLimit(rule, "key-a");
    await consumeRateLimit(rule, "key-a");
    const other = await consumeRateLimit(rule, "key-b");
    expect(other.allowed).toBe(true);
    expect(other.count).toBe(1);
  });

  it("returns a 429 response with Retry-After once the limit is spent", async () => {
    const request = new Request("http://localhost/api/auth/login/", { method: "POST" });
    for (let i = 0; i < rule.limit; i += 1) {
      expect(await enforceRateLimit(rule, request)).toBeNull();
    }
    const response = await enforceRateLimit(rule, request);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);
    expect(Number(response?.headers.get("Retry-After"))).toBeGreaterThan(0);
  });
});

describe("resetRateLimit", () => {
  it("clears the counter so a successful sign-in is not punished later", async () => {
    const rule = { rule: "auth:reset", limit: 2, windowSeconds: 900 };
    await consumeRateLimit(rule, "key-r");
    await consumeRateLimit(rule, "key-r");
    expect((await consumeRateLimit(rule, "key-r")).allowed).toBe(false);

    const { resetRateLimit } = await import("@/lib/ratelimit");
    await resetRateLimit(rule, "key-r");

    const afterReset = await consumeRateLimit(rule, "key-r");
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.count).toBe(1);
  });
});

describe("clientKey", () => {
  it("hashes the forwarded IP and never returns it in the clear", () => {
    const request = new Request("http://localhost/", { headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" } });
    const key = clientKey(request);
    expect(key).toHaveLength(40);
    expect(key).not.toContain("203.0.113.9");

    const second = clientKey(new Request("http://localhost/", { headers: { "x-forwarded-for": "203.0.113.9" } }));
    expect(second).toBe(key);

    const other = clientKey(new Request("http://localhost/", { headers: { "x-real-ip": "198.51.100.4" } }));
    expect(other).not.toBe(key);
  });
});

describe("configured rules", () => {
  it("matches the documented limits", () => {
    expect(RATE_LIMITS.login).toMatchObject({ limit: 5, windowSeconds: 900 });
    expect(RATE_LIMITS.register).toMatchObject({ limit: 10, windowSeconds: 3600 });
    expect(RATE_LIMITS.password).toMatchObject({ limit: 5, windowSeconds: 900 });
  });
});
