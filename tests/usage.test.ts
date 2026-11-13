import { beforeEach, describe, expect, it, vi } from "vitest";

const log: string[] = [];
let todayCount = 0;
let limit = 40;
let failOnInsert = false;

const fakeClient = {
  query: vi.fn(async (text: string, params: unknown[] = []) => {
    const sql = String(text).trim().toUpperCase();
    if (sql === "BEGIN") {
      log.push("BEGIN");
    } else if (sql === "COMMIT") {
      log.push("COMMIT");
    } else if (sql === "ROLLBACK") {
      log.push("ROLLBACK");
    } else if (text.includes("pg_advisory_xact_lock")) {
      log.push(`LOCK(${params[0]})`);
    } else if (text.includes("INSERT INTO usage_daily")) {
      limit = Number(params[1]);
      const next = todayCount + 1;
      if (next > limit) {
        log.push("COUNTER-REFUSED");
        return { rows: [] };
      }
      todayCount = next;
      log.push(`COUNTER(${next})`);
      return { rows: [{ count: next }] };
    } else if (text.includes("count(*)")) {
      log.push("COUNT");
      return { rows: [{ count: String(todayCount) }] };
    } else if (text.includes("INSERT INTO tool_runs")) {
      if (failOnInsert) throw new Error("insert failed");
      log.push("INSERT");
    } else {
      throw new Error(`unexpected query: ${text}`);
    }
    return { rows: [] };
  }),
};

vi.mock("@/lib/db", () => ({
  one: vi.fn(async () => null),
  query: vi.fn(async () => []),
  withClient: vi.fn(async (fn: (client: unknown) => Promise<unknown>) => fn(fakeClient)),
}));

const { reserveRun } = await import("@/lib/usage");

beforeEach(() => {
  log.length = 0;
  todayCount = 0;
  limit = 40;
  failOnInsert = false;
  fakeClient.query.mockClear();
});

describe("reserveRun", () => {
  const run = { toolSlug: "json-formatter", inputSize: 10, outputSize: 5, durationMs: 3, status: "ok" as const };

  it("takes the lock before counting, then records the run", async () => {
    todayCount = 4;
    const reservation = await reserveRun({ userId: 7, guestId: null }, 40, run);

    expect(reservation).toEqual({ allowed: true, used: 5, limit: 40, remaining: 35 });
    expect(log).toEqual(["BEGIN", "LOCK(user:7)", "COUNTER(5)", "INSERT", "COMMIT"]);
  });

  it("locks guests per browser id, not globally", async () => {
    await reserveRun({ userId: null, guestId: "guest-abc" }, 5, run);
    expect(log).toContain("LOCK(guest:guest-abc)");
  });

  it("refuses the run once the allowance is used up and records nothing", async () => {
    todayCount = 40;
    const reservation = await reserveRun({ userId: 7, guestId: null }, 40, run);

    expect(reservation).toEqual({ allowed: false, used: 40, limit: 40, remaining: 0 });
    expect(log).toEqual(["BEGIN", "LOCK(user:7)", "COUNTER-REFUSED", "COUNT", "COMMIT"]);
    expect(log).not.toContain("INSERT");
  });

  it("keeps the allowance independent of the history", async () => {
    todayCount = 12;
    const reservation = await reserveRun({ userId: 7, guestId: null }, 40, run);
    expect(reservation.used).toBe(13);
    // the counter row is what limits the day, so deleting history cannot reset it
    expect(log).toContain("COUNTER(13)");
    expect(log.filter((entry) => entry.startsWith("COUNTER"))).toHaveLength(1);
  });

  it("allows the very last slot exactly once", async () => {
    todayCount = 39;
    const last = await reserveRun({ userId: 7, guestId: null }, 40, run);
    expect(last.allowed).toBe(true);
    expect(last.remaining).toBe(0);
  });

  it("rolls back instead of leaving a half-written run", async () => {
    failOnInsert = true;
    await expect(reserveRun({ userId: 7, guestId: null }, 40, run)).rejects.toThrow("insert failed");
    expect(log.at(-1)).toBe("ROLLBACK");
    expect(log).not.toContain("COMMIT");
  });
});
