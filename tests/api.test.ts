import { describe, expect, it } from "vitest";
import { cleanNumber, isEmail, readJson } from "@/lib/api";

const request = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/test/", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("readJson", () => {
  it("parses a normal body", async () => {
    const result = await readJson<{ name: string }>(request({ name: "Nour" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.name).toBe("Nour");
  });

  it("rejects a body over the limit using the real byte length", async () => {
    const result = await readJson(request({ big: "x".repeat(2000) }), 512);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("payload_too_large");
  });

  it("rejects early when Content-Length already exceeds the limit", async () => {
    const payload = JSON.stringify({ big: "x".repeat(2000) });
    const result = await readJson(
      request(payload, { "content-length": String(payload.length) }),
      512,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("payload_too_large");
  });

  it("reports malformed and empty bodies as invalid", async () => {
    const broken = await readJson(request("{not json"));
    expect(broken.ok).toBe(false);
    if (!broken.ok) expect(broken.error).toBe("invalid_body");

    const empty = await readJson(request(""));
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error).toBe("invalid_body");
  });
});

describe("cleanNumber", () => {
  it("keeps valid values and clamps them", () => {
    expect(cleanNumber(1234)).toBe(1234);
    expect(cleanNumber("1500")).toBe(1500);
    expect(cleanNumber(99999, 1000)).toBe(1000);
  });

  it("refuses negatives, NaN and infinite values", () => {
    expect(cleanNumber(-5)).toBe(0);
    expect(cleanNumber("nonsense")).toBe(0);
    expect(cleanNumber(Number.POSITIVE_INFINITY)).toBe(0);
    expect(cleanNumber(undefined)).toBe(0);
    expect(cleanNumber(null)).toBe(0);
  });
});

describe("isEmail", () => {
  it("accepts real addresses and rejects the rest", () => {
    expect(isEmail("user@example.com")).toBe(true);
    expect(isEmail("first.last+tag@sub.example.co")).toBe(true);
    expect(isEmail("no-at-sign")).toBe(false);
    expect(isEmail("missing@tld")).toBe(false);
    expect(isEmail("space in@example.com")).toBe(false);
  });
});
