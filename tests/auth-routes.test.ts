import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword } from "@/lib/auth";

/** Call log used to prove the order of schema creation vs. table queries. */
const calls: string[] = [];
const rateLimitRows = new Map<string, number>();
let existingUser: { id: string } | null = null;
let passwordHash = hashPassword("secret-pass-123");

const cookieJar: Record<string, { value: string }> = {};

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => cookieJar[name],
    set: (name: string, value: string) => {
      if (!value) delete cookieJar[name];
      else cookieJar[name] = { value };
    },
  }),
}));

vi.mock("@/lib/db", () => ({
  hasDatabase: () => true,
  ensureSchema: vi.fn(async () => {
    calls.push("ensureSchema");
  }),
  query: vi.fn(async (text: string, params: unknown[] = []) => {
    if (text.includes("INSERT INTO users")) {
      calls.push("insert-user");
      return [
        {
          id: "42",
          email: params[0],
          name: params[1],
          locale: params[3],
          role: "user",
          created_at: new Date("2026-09-24T00:00:00.000Z"),
        },
      ];
    }
    if (text.includes("INSERT INTO sessions")) calls.push("insert-session");
    if (text.includes("DELETE FROM sessions")) calls.push("delete-sessions");
    if (text.includes("INSERT INTO tool_runs")) calls.push("insert-run");
    return [];
  }),
  one: vi.fn(async (text: string, params: unknown[] = []) => {
    if (text.includes("INSERT INTO rate_limits")) {
      const key = `${params[0]}|${params[1]}|${String(params[2])}`;
      const next = (rateLimitRows.get(key) ?? 0) + 1;
      rateLimitRows.set(key, next);
      return { count: next };
    }
    if (text.includes("DELETE FROM rate_limits")) return null;
    if (text.includes("SELECT id FROM users")) {
      calls.push("select-existing-user");
      return existingUser;
    }
    if (text.includes("FROM users WHERE email")) {
      calls.push("select-user-for-login");
      return existingUser
        ? { ...existingUser, email: "user@example.com", name: "Nour", locale: "en", role: "user", created_at: new Date(), password_hash: passwordHash }
        : null;
    }
    if (text.includes("SELECT password_hash FROM users")) {
      calls.push("select-password");
      return { password_hash: passwordHash };
    }
    if (text.includes("FROM sessions")) {
      calls.push("select-session");
      return sessionUser;
    }
    return null;
  }),
}));

let sessionUser: unknown = null;

const jsonRequest = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.5" },
    body: JSON.stringify(body),
  });


beforeEach(() => {
  // The server-side auth module checks DATABASE_URL before reading sessions.
  // This is a dummy test value; database calls are handled by vi.mock().
  vi.stubEnv(
    "DATABASE_URL",
    "postgres://test:test@localhost:5432/primeutility_test",
  );

  calls.length = 0;
  rateLimitRows.clear();
  existingUser = null;
  sessionUser = null;
  passwordHash = hashPassword("secret-pass-123");

  for (const key of Object.keys(cookieJar)) {
    delete cookieJar[key];
  }
});


describe("POST /api/auth/register", () => {
  it("creates the schema before touching the users table", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const response = await POST(
      jsonRequest("/api/auth/register", { name: "Nour", email: "New@Example.com", password: "secret-pass-123" }),
    );

    expect(response.status).toBe(201);
    const body = (await response.json()) as { user: { email: string; name: string } };
    expect(body.user.email).toBe("new@example.com");
    expect(body.user.name).toBe("Nour");

    // ensureSchema must run first, then the duplicate check, then the insert.
    expect(calls.indexOf("ensureSchema")).toBeGreaterThanOrEqual(0);
    expect(calls.indexOf("ensureSchema")).toBeLessThan(calls.indexOf("select-existing-user"));
    expect(calls.indexOf("select-existing-user")).toBeLessThan(calls.indexOf("insert-user"));
    expect(calls).toContain("insert-session");
    expect(cookieJar.tn_session?.value).toBeTruthy();
  });

  it("rejects a duplicate email", async () => {
    existingUser = { id: "1" };
    const { POST } = await import("@/app/api/auth/register/route");
    const response = await POST(jsonRequest("/api/auth/register", { name: "Nour", email: "user@example.com", password: "secret-pass-123" }));
    expect(response.status).toBe(409);
    expect(((await response.json()) as { error: string }).error).toBe("email_taken");
  });

  it("rejects weak input before any query", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const short = await POST(jsonRequest("/api/auth/register", { name: "Nour", email: "user@example.com", password: "short" }));
    expect(short.status).toBe(400);

    const badEmail = await POST(jsonRequest("/api/auth/register", { name: "Nour", email: "not-an-email", password: "secret-pass-123" }));
    expect(badEmail.status).toBe(400);
    expect(calls).not.toContain("insert-user");
  });
});

describe("POST /api/auth/login", () => {
  it("rejects a wrong password and signs in with the right one", async () => {
    existingUser = { id: "7" };
    const { POST } = await import("@/app/api/auth/login/route");

    const wrong = await POST(jsonRequest("/api/auth/login", { email: "user@example.com", password: "not-the-password" }));
    expect(wrong.status).toBe(401);

    const right = await POST(jsonRequest("/api/auth/login", { email: "user@example.com", password: "secret-pass-123" }));
    expect(right.status).toBe(200);
    expect(calls).toContain("insert-session");
    expect(cookieJar.tn_session?.value).toBeTruthy();
  });

  it("blocks brute force after five failed attempts from the same IP", async () => {
    existingUser = { id: "7" };
    const { POST } = await import("@/app/api/auth/login/route");

    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      statuses.push((await POST(jsonRequest("/api/auth/login", { email: "user@example.com", password: "wrong-one" }))).status);
    }
    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(statuses[5]).toBe(429);
  });
});

describe("POST /api/auth/password", () => {
  it("refuses when nobody is signed in", async () => {
    sessionUser = null;
    const { POST } = await import("@/app/api/auth/password/route");
    const response = await POST(jsonRequest("/api/auth/password", { currentPassword: "secret-pass-123", newPassword: "another-pass-456" }));
    expect(response.status).toBe(401);
  });

  it("rotates every session after a successful change", async () => {
    sessionUser = {
      id: 7,
      email: "user@example.com",
      name: "Nour",
      locale: "en",
      role: "user",
      createdAt: "2026-09-24T00:00:00.000Z",
    };
    cookieJar.tn_session = { value: "existing-session-token" };

    const { POST } = await import("@/app/api/auth/password/route");
    const response = await POST(
      jsonRequest("/api/auth/password", { currentPassword: "secret-pass-123", newPassword: "another-pass-456" }),
    );

    expect(response.status).toBe(200);
    const deleted = calls.indexOf("delete-sessions");
    const recreated = calls.lastIndexOf("insert-session");
    expect(deleted).toBeGreaterThanOrEqual(0);
    expect(recreated).toBeGreaterThan(deleted);
    expect(cookieJar.tn_session?.value).not.toBe("existing-session-token");
  });

  it("rejects a wrong current password", async () => {
    sessionUser = {
      id: 7,
      email: "user@example.com",
      name: "Nour",
      locale: "en",
      role: "user",
      createdAt: "2026-09-24T00:00:00.000Z",
    };
    cookieJar.tn_session = { value: "valid-session-token" };

    const { POST } = await import("@/app/api/auth/password/route");
    const response = await POST(jsonRequest("/api/auth/password", { currentPassword: "wrong", newPassword: "another-pass-456" }));
    expect(response.status).toBe(400);
    expect(calls).not.toContain("delete-sessions");
  });
});
