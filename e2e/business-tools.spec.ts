import { expect, test, type Page } from "@playwright/test";

/** Arabic pages render numbers in Arabic-Indic digits, so both are accepted. */
const DIGITS = /[\d\u0660-\u0669]/;

async function openTool(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1");
  // give React a moment to hydrate so typed input is not lost
  await page.waitForTimeout(1500);
}

test.describe("smart pricing calculator", () => {
  test("turns costs and a target margin into a selling price", async ({ page }) => {
    await openTool(page, "/en/tools/smart-pricing-calculator/");
    await page.locator("#purchase").fill("100");
    await page.locator("#shipping").fill("10");
    await page.locator("#quantity").fill("1");
    await page.locator("#target").fill("30");

    await expect(page.locator(".stat", { hasText: /Suggested selling price|Selling price/i }).first()).toContainText(DIGITS);
    const price = await page.locator(".stat", { hasText: /Suggested selling price|Selling price/i }).first().innerText();
    // 110 real cost with a 30% margin on the selling price must be above the cost
    expect(Number(price.replace(/[^\d.]/g, ""))).toBeGreaterThan(110);

    await expect(page.locator(".stat", { hasText: /Profit/i }).first()).toContainText(DIGITS);
  });

  test("shows a break-even point once fixed costs are given", async ({ page }) => {
    await openTool(page, "/en/tools/smart-pricing-calculator/");
    await page.locator("#purchase").fill("80");
    await page.locator("#target").fill("25");
    await page.locator("#fixed").fill("2000");
    await expect(page.locator(".stat", { hasText: /break/i }).first()).toContainText(DIGITS);
  });

  test("works in Arabic with right-to-left numerals formatting", async ({ page }) => {
    await openTool(page, "/ar/tools/smart-pricing-calculator/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.locator("#purchase").fill("150");
    await page.locator("#target").fill("40");
    await expect(page.locator(".stat", { hasText: /سعر البيع/ }).first()).toContainText(DIGITS);
    await expect(page.locator(".stat", { hasText: /التكلفة الحقيقية/ }).first()).toContainText(DIGITS);
  });
});
