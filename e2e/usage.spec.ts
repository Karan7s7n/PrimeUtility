import { expect, test, type Page } from "@playwright/test";

const uniqueEmail = (label: string) => `${label}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;

async function register(page: Page, label: string) {
  await page.goto("/en/register/");
  await page.waitForSelector("#auth-email");
  await page.waitForTimeout(1500);
  await page.locator("#auth-name").fill("Usage User");
  await page.locator("#auth-email").fill(uniqueEmail(label));
  await page.locator("#auth-password").fill("secret-pass-123");
  await page.getByRole("button", { name: /create my account/i }).click();
  await expect(page).toHaveURL(/\/en\/account\//, { timeout: 60_000 });
}

/** The dashboard needs a moment to hydrate before its tabs respond. */
async function openAccount(page: Page) {
  await page.goto("/en/account/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1");
  await page.waitForTimeout(1500);
}

const recordRun = (page: Page, times: number) =>
  page.evaluate(async (count) => {
    const call = () =>
      fetch("/api/runs/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toolSlug: "json-formatter" }),
      }).then(async (response) => ({ status: response.status, body: await response.json() }));
    return Promise.all(Array.from({ length: count }, call));
  }, times);

test.describe("usage accounting", () => {
  test("a tool run is counted and appears in the history", async ({ page }) => {
    await register(page, "usage-history");
    await page.goto("/en/tools/json-formatter/");
    await page.locator("#json-input").fill('{"counted": true}');
    // the tool records the run in the background, so wait for that request
    const tracked = page.waitForResponse(
      (response) => response.url().includes("/api/runs/") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Format", exact: true }).click();
    await expect(page.locator("textarea.code-area").nth(1)).toHaveValue(/"counted"/);
    expect((await tracked).status()).toBe(200);

    await openAccount(page);
    await expect(page.locator(".stat", { hasText: /Used today/i })).toContainText("/ 40", { timeout: 30_000 });

    await page.getByRole("button", { name: /history/i }).click();
    await expect(page.getByText(/JSON Formatter/i).first()).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /^plan$/i }).click();
    await expect(page.locator(".stat", { hasText: /Used today/i })).toContainText("1 / 40", { timeout: 30_000 });
  });

  test("sixty simultaneous runs hand out every slot exactly once", async ({ page }) => {
    await register(page, "usage-atomic");

    const results = await recordRun(page, 60);
    const accepted = results.filter((entry) => entry.status === 200);
    const refused = results.filter((entry) => entry.status === 429);

    expect(accepted).toHaveLength(40);
    expect(refused).toHaveLength(20);

    // every accepted run got its own slot: 1..40, never a duplicate
    const slots = accepted.map((entry) => entry.body.used as number).sort((a, b) => a - b);
    expect(slots).toEqual(Array.from({ length: 40 }, (_, index) => index + 1));
    expect(refused.every((entry) => entry.body.used === 40)).toBe(true);

    const usage = await page.evaluate(async () => (await fetch("/api/usage/", { cache: "no-store" })).json());
    expect(usage.usage.usedToday).toBe(40);
    expect(usage.usage.remaining).toBe(0);
  });

  test("the history can be cleared without touching the allowance", async ({ page }) => {
    // clearing asks for confirmation, so accept any dialog from the start
    page.on("dialog", (dialog) => void dialog.accept());

    await register(page, "usage-clear");
    await recordRun(page, 3);
    await openAccount(page);
    await page.getByRole("button", { name: /history/i }).click();
    await expect(page.locator("li.panel").first()).toBeVisible({ timeout: 30_000 });
    const rowsBefore = await page.locator("li.panel").count();
    expect(rowsBefore).toBe(3);

    await page.getByRole("button", { name: /clear history/i }).click();
    await expect(page.getByText(/Nothing yet\. Use any tool while signed in/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("li.panel")).toHaveCount(0);

    // clearing the history must not hand back a fresh allowance
    const usage = await page.evaluate(async () => (await fetch("/api/usage/", { cache: "no-store" })).json());
    expect(usage.usage.usedToday).toBe(3);
    expect(usage.usage.totalRuns).toBe(0);
  });
});
