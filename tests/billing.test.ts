import { describe, expect, it, vi } from "vitest";
import type { PoolClient } from "pg";
import { activateBillingOrder } from "@/lib/billing";

const now = new Date("2026-11-15T12:00:00.000Z");
const expiry = new Date("2026-12-15T12:00:00.000Z");

function createClient(options?: {
  orderStatus?: "created" | "paid";
  orderAmount?: number;
  existingPayment?: boolean;
}) {
  const order = {
    id: "101",
    user_id: "42",
    plan: "pro" as const,
    amount: options?.orderAmount ?? 29900,
    currency: "INR",
    status: options?.orderStatus ?? "created",
    access_starts_at: options?.orderStatus === "paid" ? now : null,
    access_expires_at: options?.orderStatus === "paid" ? expiry : null,
  };

  const query = vi.fn(async (sql: string) => {
    if (sql.includes("FROM billing_orders") && sql.includes("FOR UPDATE")) {
      return { rows: [order], rowCount: 1 };
    }

    if (sql.includes("FROM users")) {
      return { rows: [{ id: "42" }], rowCount: 1 };
    }

    if (sql.includes("FROM payments")) {
      return {
        rows: options?.existingPayment
          ? [{ id: "501", billing_order_id: "101" }]
          : [],
        rowCount: options?.existingPayment ? 1 : 0,
      };
    }

    if (sql.includes("WITH current_access")) {
      return {
        rows: [{
          access_starts_at: now,
          access_expires_at: expiry,
        }],
        rowCount: 1,
      };
    }

    if (sql.includes("UPDATE billing_orders")) {
      return { rows: [], rowCount: 1 };
    }

    return { rows: [], rowCount: 1 };
  });

  return {
    query,
    client: { query } as unknown as PoolClient,
  };
}

const payment = {
  orderId: "order_test_101",
  paymentId: "pay_test_101",
  amount: 29900,
  currency: "INR",
  method: "card",
  capturedAt: now,
};

describe("activateBillingOrder", () => {
  it("activates a captured order and records its payment", async () => {
    const { client, query } = createClient();

    const result = await activateBillingOrder(client, payment);

    expect(result).toEqual({
      plan: "pro",
      alreadyActivated: false,
      accessStartsAt: now,
      accessExpiresAt: expiry,
    });

    expect(
      query.mock.calls.some(([sql]) =>
        sql.includes("INSERT INTO payments"),
      ),
    ).toBe(true);

    expect(
      query.mock.calls.some(([sql]) =>
        sql.includes("UPDATE billing_orders"),
      ),
    ).toBe(true);
  });

  it("uses a 30-day period when calculating access", async () => {
    const { client, query } = createClient();

    await activateBillingOrder(client, payment);

    const accessQuery = query.mock.calls.find(([sql]) =>
      sql.includes("WITH current_access"),
    );

    expect(accessQuery?.[0]).toContain("INTERVAL '30 days'");
  });

  it("does not extend access when the same payment is activated again", async () => {
    const { client, query } = createClient({
      orderStatus: "paid",
      existingPayment: true,
    });

    const result = await activateBillingOrder(client, payment);

    expect(result.alreadyActivated).toBe(true);
    expect(result.accessExpiresAt).toEqual(expiry);

    expect(
      query.mock.calls.some(([sql]) =>
        sql.includes("INSERT INTO payments"),
      ),
    ).toBe(false);

    expect(
      query.mock.calls.some(([sql]) =>
        sql.includes("UPDATE billing_orders"),
      ),
    ).toBe(false);
  });

  it("rejects a payment with the wrong amount", async () => {
    const { client, query } = createClient();

    await expect(
      activateBillingOrder(client, {
        ...payment,
        amount: 99900,
      }),
    ).rejects.toThrow("Payment amount or currency does not match");

    expect(query).toHaveBeenCalledTimes(1);
  });

  it("rejects a payment with the wrong currency", async () => {
    const { client } = createClient();

    await expect(
      activateBillingOrder(client, {
        ...payment,
        currency: "USD",
      }),
    ).rejects.toThrow("Payment amount or currency does not match");
  });

  it("rejects a payment already recorded against another order", async () => {
    const { client } = createClient({
      existingPayment: true,
    });

    await expect(
      activateBillingOrder(client, payment),
    ).rejects.toThrow("This Razorpay payment has already been recorded");
  });

  it("rejects invalid payment amounts", async () => {
    const { client, query } = createClient();

    await expect(
      activateBillingOrder(client, {
        ...payment,
        amount: 0,
      }),
    ).rejects.toThrow("Invalid captured payment details");

    expect(query).not.toHaveBeenCalled();
  });
});
