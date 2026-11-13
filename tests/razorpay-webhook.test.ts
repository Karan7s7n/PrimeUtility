import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  withClient: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  withClient: (fn: (client: { query: typeof mocks.query }) => Promise<unknown>) =>
    mocks.withClient(fn),
}));

const WEBHOOK_SECRET = "test-webhook-secret";

function createWebhookRequest(
  eventId: string,
  payload: Record<string, unknown>,
  options: {
    event?: string;
    signature?: string;
    createdAt?: number;
  } = {},
) {
  const rawBody = JSON.stringify({
    event: options.event ?? "subscription.activated",
    created_at: options.createdAt ?? 1794000000,
    payload,
  });

  const signature =
    options.signature ??
    createHmac("sha256", WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

  return new Request("http://localhost/api/webhooks/razorpay", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": signature,
      "x-razorpay-event-id": eventId,
    },
    body: rawBody,
  });
}

function subscriptionPayload(
  id = "sub_test_123",
  status = "active",
) {
  return {
    subscription: {
      entity: {
        id,
        status,
        current_start: 1794000000,
        current_end: 1796592000,
        charge_at: 1796592000,
      },
    },
  };
}

beforeEach(() => {
  vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", WEBHOOK_SECRET);

  mocks.query.mockReset();
  mocks.withClient.mockReset();

  mocks.query.mockImplementation(async (sql: string) => {
    if (sql.includes("INSERT INTO razorpay_webhook_events")) {
      return { rows: [{ id: "1" }] };
    }

    if (sql.includes("UPDATE subscriptions")) {
      return {
        rows: [{ id: "10", user_id: "42" }],
      };
    }

    if (sql.includes("SELECT id, user_id")) {
      return {
        rows: [{ id: "10", user_id: "42" }],
      };
    }

    return { rows: [] };
  });

  mocks.withClient.mockImplementation(
    async (fn: (client: { query: typeof mocks.query }) => Promise<unknown>) =>
      fn({ query: mocks.query }),
  );
});

describe("POST /api/webhooks/razorpay", () => {
  it("rejects an invalid signature without accessing the database", async () => {
    const { POST } = await import("@/app/api/webhooks/razorpay/route");

    const request = createWebhookRequest(
      "evt_invalid_signature",
      subscriptionPayload(),
      { signature: "invalid-signature" },
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "invalid_signature",
    });

    expect(mocks.withClient).not.toHaveBeenCalled();
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("does not process a duplicate event ID", async () => {
    mocks.query.mockImplementation(async (sql: string) => {
      if (sql.includes("INSERT INTO razorpay_webhook_events")) {
        return { rows: [] };
      }

      return { rows: [] };
    });

    const { POST } = await import("@/app/api/webhooks/razorpay/route");

    const response = await POST(
      createWebhookRequest(
        "evt_duplicate",
        subscriptionPayload(),
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });

    expect(mocks.query).toHaveBeenCalledWith("BEGIN");
    expect(mocks.query).toHaveBeenCalledWith("COMMIT");

    expect(
      mocks.query.mock.calls.some(([sql]) =>
        String(sql).includes("UPDATE subscriptions"),
      ),
    ).toBe(false);
  });

  it("updates a subscription and commits a valid activation event", async () => {
    const { POST } = await import("@/app/api/webhooks/razorpay/route");

    const response = await POST(
      createWebhookRequest(
        "evt_subscription_activated",
        subscriptionPayload(),
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });

    expect(mocks.query).toHaveBeenCalledWith("BEGIN");

    const updateCall = mocks.query.mock.calls.find(([sql]) =>
      String(sql).includes("UPDATE subscriptions"),
    );

    expect(updateCall).toBeDefined();
    expect(updateCall?.[1]).toEqual(
      expect.arrayContaining(["sub_test_123", "active"]),
    );

    expect(mocks.query).toHaveBeenCalledWith("COMMIT");

    expect(
      mocks.query.mock.calls.some(([sql]) =>
        String(sql).includes("ROLLBACK"),
      ),
    ).toBe(false);
  });

  it("rolls back an event referencing an unknown subscription", async () => {
    mocks.query.mockImplementation(async (sql: string) => {
      if (sql.includes("INSERT INTO razorpay_webhook_events")) {
        return { rows: [{ id: "1" }] };
      }

      if (sql.includes("UPDATE subscriptions")) {
        return { rows: [] };
      }

      if (sql.includes("SELECT id, user_id")) {
        return { rows: [] };
      }

      return { rows: [] };
    });

    const { POST } = await import("@/app/api/webhooks/razorpay/route");

    const response = await POST(
      createWebhookRequest(
        "evt_unknown_subscription",
        subscriptionPayload("sub_unknown_999"),
      ),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "webhook_processing_failed",
    });

    expect(mocks.query).toHaveBeenCalledWith("BEGIN");
    expect(mocks.query).toHaveBeenCalledWith("ROLLBACK");

    expect(
      mocks.query.mock.calls.some(([sql]) =>
        String(sql).includes("COMMIT"),
      ),
    ).toBe(false);
  });
});
