import { describe, expect, it } from "vitest";
import { hashPassword, normalizeEmail, toPublicUser, verifyPassword, type UserRow } from "@/lib/auth";

describe("password hashing", () => {
  it("verifies the correct password and rejects a wrong one", () => {
    const stored = hashPassword("correct horse battery staple");
    expect(verifyPassword("correct horse battery staple", stored)).toBe(true);
    expect(verifyPassword("correct horse battery stapl", stored)).toBe(false);
    expect(verifyPassword("", stored)).toBe(false);
  });

  it("never stores the password itself and salts every hash", () => {
    const password = "secret-pass-123";
    const first = hashPassword(password);
    const second = hashPassword(password);
    expect(first).not.toContain(password);
    expect(first.startsWith("scrypt$")).toBe(true);
    expect(first).not.toBe(second);
    expect(verifyPassword(password, first)).toBe(true);
    expect(verifyPassword(password, second)).toBe(true);
  });

  it("rejects malformed stored values instead of throwing", () => {
    expect(verifyPassword("anything", "")).toBe(false);
    expect(verifyPassword("anything", "plain-text")).toBe(false);
    expect(verifyPassword("anything", "scrypt$onlyonetpart")).toBe(false);
  });
});

describe("email normalisation", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
  });
});

describe("public user shape", () => {
  it("carries the stored plan and status, with safe defaults for older rows", () => {
    const row: UserRow = {
      id: "9",
      email: "pro@example.com",
      name: "Pro",
      locale: "en",
      role: "user",
      plan: "pro",
      status: "suspended",
      created_at: new Date("2026-02-02T00:00:00.000Z"),
    };
    const user = toPublicUser(row);
    expect(user.plan).toBe("pro");
    expect(user.status).toBe("suspended");
    expect(toPublicUser({ ...row, plan: undefined, status: undefined }).plan).toBe("free");
    expect(toPublicUser({ ...row, plan: undefined, status: undefined }).status).toBe("active");
  });

  it("never exposes the password hash", () => {
    const row: UserRow = {
      id: "7",
      email: "user@example.com",
      name: "Nour",
      locale: "ar",
      role: "user",
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      password_hash: "scrypt$abc$def",
    };
    const user = toPublicUser(row);
    expect(user).toEqual({
      id: 7,
      email: "user@example.com",
      name: "Nour",
      locale: "ar",
      role: "user",
      plan: "free",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(JSON.stringify(user)).not.toContain("scrypt");
  });
});
