import { beforeEach, describe, expect, it, vi } from "vitest";

const one = vi.fn();
const ensureSchema = vi.fn(async () => undefined);

vi.mock("@/lib/db", () => ({
  ensureSchema: () => ensureSchema(),
  one: (...args: unknown[]) => one(...args),
}));

const { effectivePlanForUser } = await import("@/lib/plans");

const user = { id: 42, role: "user", plan: "free" };

beforeEach(() => {
  one.mockReset();
  ensureSchema.mockClear();
});

describe("effectivePlanForUser", () => {
  it("does not grant a future scheduled recharge early", async () => {
    one
      .mockResolvedValueOnce({ admin_plan_override: false })
      .mockResolvedValueOnce(null);

    await expect(effectivePlanForUser(user)).resolves.toBe("free");

    const billingQuery = one.mock.calls[1][0] as string;
    expect(billingQuery).toContain("access_starts_at <= now()");
    expect(billingQuery).toContain("access_expires_at > now()");
  });

  it("grants the plan from an active paid recharge", async () => {
    one
      .mockResolvedValueOnce({ admin_plan_override: false })
      .mockResolvedValueOnce({ plan: "pro" });

    await expect(effectivePlanForUser(user)).resolves.toBe("pro");
  });

  it("preserves explicit admin plan overrides", async () => {
    one.mockResolvedValueOnce({ admin_plan_override: true });

    await expect(
      effectivePlanForUser({ ...user, plan: "business" }),
    ).resolves.toBe("business");

    expect(one).toHaveBeenCalledTimes(1);
  });

  it("returns guest for an anonymous user without querying the database", async () => {
    await expect(effectivePlanForUser(null)).resolves.toBe("guest");
    expect(one).not.toHaveBeenCalled();
    expect(ensureSchema).not.toHaveBeenCalled();
  });
});
