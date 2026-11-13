import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { Client } from "pg";

/**
 * Admin coverage. The suite runs against a real database, so the test promotes
 * its own account with a direct SQL update — exactly what an operator would do —
 * and then exercises the dashboard through the browser.
 */

const uniqueEmail = (label: string) => `${label}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;

/** Every account this spec creates, removed again so a real database stays clean. */
const created: string[] = [];

const withDatabase = async <T,>(fn: (client: Client) => Promise<T>): Promise<T> => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for the admin end-to-end tests");
  const local = /@(localhost|127\.0\.0\.1)/.test(url) || /sslmode=disable/i.test(url);
  const client = new Client({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
};

const setRole = (email: string, role: string) =>
  withDatabase((client) => client.query("UPDATE users SET role = $2 WHERE email = $1", [email, role]));

async function register(context: BrowserContext, label: string, name = "Admin User") {
  const email = uniqueEmail(label);
  created.push(email);
  const page = await context.newPage();
  await page.goto("/en/register/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#auth-email");
  await page.waitForTimeout(1500);
  await page.locator("#auth-name").fill(name);
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill("secret-pass-123");
  await page.getByRole("button", { name: /create my account/i }).click();
  await expect(page).toHaveURL(/\/en\/account\//, { timeout: 60_000 });
  return { email, page };
}

async function openAdmin(page: Page) {
  await page.goto("/en/admin/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1");
  await page.waitForTimeout(1500);
}

const tab = (page: Page, name: RegExp) => page.getByRole("tab", { name });

test.afterAll(async () => {
  if (created.length === 0) return;
  await withDatabase((client) => client.query("DELETE FROM users WHERE email = ANY($1)", [created]));
});

test.describe("admin dashboard", () => {
  test("an ordinary account is refused, on the page and on the API", async ({ browser }) => {
    const context = await browser.newContext();
    const { page } = await register(context, "admin-refused", "Plain User");

    const api = await page.evaluate(async () => (await fetch("/api/admin/overview/", { cache: "no-store" })).status);
    expect(api).toBe(403);

    // checked without claiming, so a test run can never take the seat by accident
    const claim = await page.evaluate(async () => {
      const data = (await (await fetch("/api/admin/claim/", { cache: "no-store" })).json()) as { admins: number };
      return data.admins;
    });
    expect(typeof claim).toBe("number");

    await openAdmin(page);
    await expect(page.getByText(/needs an admin account|Make this account the admin/i)).toBeVisible();

    await context.close();
  });

  test("a signed-out visitor gets 401 from the admin API", async ({ page }) => {
    await page.goto("/en/", { waitUntil: "domcontentloaded" });
    const status = await page.evaluate(async () => (await fetch("/api/admin/users/", { cache: "no-store" })).status);
    expect(status).toBe(401);
  });

  test("an admin sees usage, manages accounts, switches a tool off and audits it", async ({ browser }) => {
    const adminContext = await browser.newContext();
    const victimContext = await browser.newContext();

    const admin = await register(adminContext, "admin-owner", "Owner Admin");
    const victim = await register(victimContext, "admin-victim", "Victim User");
    await setRole(admin.email, "super_admin");

    // ---- overview
    await openAdmin(admin.page);
    await expect(admin.page.getByRole("heading", { name: "Admin dashboard" })).toBeVisible();
    await expect(admin.page.locator(".stat", { hasText: /Accounts/i }).first()).toContainText(/\d/);
    await expect(admin.page.locator(".stat", { hasText: /Runs today/i }).first()).toContainText(/\d/);
    await expect(admin.page.getByText("Most used tools")).toBeVisible();

    // ---- users: search, plan change and suspension
    await tab(admin.page, /Users/).click();
    await admin.page.getByRole("textbox", { name: "Search by email or name" }).fill(victim.email);
    await admin.page.getByRole("button", { name: "Apply" }).click();
    await expect(admin.page.getByText(victim.email)).toBeVisible({ timeout: 30_000 });

    await admin.page.getByLabel(`Plan ${victim.email}`).selectOption("pro");
    // the change must reach the account itself: a Pro plan carries a 2000/day allowance
    await expect
      .poll(async () =>
        victim.page.evaluate(async () => {
          const data = (await (await fetch("/api/auth/me/", { cache: "no-store" })).json()) as {
            usage?: { plan?: string; dailyLimit?: number };
          };
          return `${data.usage?.plan}:${data.usage?.dailyLimit}`;
        }),
      )
      .toBe("pro:2000");

    const victimRow = admin.page.locator("li.panel", { hasText: victim.email }).first();
    await admin.page.getByRole("button", { name: "Suspend" }).first().click();
    await expect(victimRow.locator(".chip", { hasText: "suspended" })).toBeVisible({ timeout: 30_000 });

    // a suspended account is signed out everywhere, immediately
    await expect
      .poll(async () =>
        victim.page.evaluate(async () => {
          const data = (await (await fetch("/api/auth/me/", { cache: "no-store" })).json()) as { user: unknown };
          return data.user === null ? "signed-out" : "signed-in";
        }),
      )
      .toBe("signed-out");

    await admin.page.getByRole("button", { name: "Activate" }).first().click();
    await expect(victimRow.locator(".chip", { hasText: "active" })).toBeVisible({ timeout: 30_000 });

    // ---- tools: switching one off really pauses it across the public site
    await tab(admin.page, /Tools/).click();
    await expect(admin.page.getByText("JSON Formatter", { exact: true }).first()).toBeVisible({ timeout: 30_000 });
    const jsonRow = admin.page.locator("li.panel", { hasText: "JSON Formatter" }).first();
    await jsonRow.getByRole("button", { name: "Turn off" }).click();
    await expect(jsonRow.getByRole("button", { name: "Turn on" })).toBeVisible({ timeout: 30_000 });

    const pausedOn = async () => {
      await admin.page.goto("/en/tools/json-formatter/", { waitUntil: "domcontentloaded" });
      await admin.page.waitForTimeout(1200);
      return admin.page.getByText("This tool is paused").count();
    };
    const listed = async () => {
      await admin.page.goto("/en/tools/", { waitUntil: "domcontentloaded" });
      return admin.page.getByRole("link", { name: /JSON Formatter/i }).count();
    };

    await expect.poll(pausedOn, { timeout: 45_000 }).toBe(1);
    await expect.poll(listed, { timeout: 45_000 }).toBe(0);

    // put it back so the rest of the suite is unaffected
    await openAdmin(admin.page);
    await tab(admin.page, /Tools/).click();
    await admin.page
      .locator("li.panel", { hasText: "JSON Formatter" })
      .first()
      .getByRole("button", { name: "Turn on" })
      .click();
    await expect(
      admin.page.locator("li.panel", { hasText: "JSON Formatter" }).first().getByRole("button", { name: "Turn off" }),
    ).toBeVisible({ timeout: 30_000 });

    await expect.poll(pausedOn, { timeout: 45_000 }).toBe(0);
    await expect.poll(listed, { timeout: 45_000 }).toBe(1);

    // ---- audit: the changes above are attributable
    await openAdmin(admin.page);
    await tab(admin.page, /Audit log/).click();
    await expect(admin.page.getByText("tool.disable").first()).toBeVisible({ timeout: 30_000 });
    await expect(admin.page.getByText("user.set_plan").first()).toBeVisible();

    await adminContext.close();
    await victimContext.close();
  });
});
