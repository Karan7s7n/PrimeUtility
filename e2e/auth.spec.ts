import { expect, test, type Page } from "@playwright/test";

const uniqueEmail = (label: string) => `${label}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;

/** The dashboard needs a moment to hydrate before its tabs respond. */
async function openAccount(page: Page) {
  await page.goto("/en/account/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1");
  await page.waitForTimeout(1500);
}

/** Sign out lives in the header / dashboard as a button, not a link. */
const signOutButton = (page: Page) => page.getByRole("button", { name: /sign out/i }).first();

/** Registers a fresh account through the real form and returns its email. */
async function register(page: Page, label: string, password = "secret-pass-123") {
  const email = uniqueEmail(label);
  await page.goto("/en/register/");
  await page.waitForSelector("#auth-email");
  await page.waitForTimeout(1500);
  await page.locator("#auth-name").fill("E2E User");
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill(password);
  await page.getByRole("button", { name: /create my account/i }).click();
  await expect(page).toHaveURL(/\/en\/account\//, { timeout: 60_000 });
  return { email, password };
}

test.describe("accounts", () => {
  test("registration creates an account and shows the allowance", async ({ page }) => {
    await register(page, "e2e-register");
    await expect(page.locator("h1")).toContainText("E2E User");
    await expect(page.locator(".stat", { hasText: /Used today/i })).toContainText("/ 40");
    await expect(signOutButton(page)).toBeVisible();
  });

  test("the wrong password is refused, the right one signs in", async ({ page }) => {
    const { email, password } = await register(page, "e2e-login");
    await signOutButton(page).click();
    await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible({ timeout: 30_000 });

    await page.goto("/en/login/");
    await page.waitForSelector("#auth-email");
    await page.waitForTimeout(1500);
    await page.locator("#auth-email").fill(email);
    await page.locator("#auth-password").fill("definitely-wrong");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/does not match an account/i)).toBeVisible({ timeout: 30_000 });

    await page.locator("#auth-password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/en\/account\//, { timeout: 60_000 });
  });

  test("changing the password keeps the account signed in", async ({ page }) => {
    await register(page, "e2e-password");
    await openAccount(page);
    await page.getByRole("button", { name: /security/i }).click();
    await page.waitForSelector("#current-password");
    await page.locator("#current-password").fill("secret-pass-123");
    await page.locator("#new-password").fill("brand-new-pass-456");
    await page.getByRole("button", { name: /change password/i }).click();
    await expect(page.getByText(/saved/i).first()).toBeVisible({ timeout: 30_000 });

    const session = await page.evaluate(async () => (await fetch("/api/auth/me/", { cache: "no-store" })).json());
    expect(session.user).toBeTruthy();
  });

  test("profile changes are stored", async ({ page }) => {
    await register(page, "e2e-profile");
    await openAccount(page);
    await page.getByRole("button", { name: /profile/i }).click();
    await page.waitForSelector("#profile-name");
    await page.locator("#profile-name").fill("Renamed User");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/saved/i).first()).toBeVisible({ timeout: 30_000 });

    await page.reload();
    // the greeting fills in once the session answers, so allow for that
    await expect(page.locator("h1")).toContainText("Renamed User", { timeout: 30_000 });
  });
});
