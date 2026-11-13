import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const fixture = (name: string) => path.join(process.cwd(), "e2e", ".fixtures", name);

async function openTool(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1");
  await page.waitForTimeout(1500);
}

/** The download control is a link on single files and a button in batch mode. */
const downloadControl = (page: Page) =>
  page.getByRole("link", { name: /download/i }).or(page.getByRole("button", { name: /download/i })).first();

test.describe("image tools", () => {
  test("compresses an image and reports before and after", async ({ page }) => {
    await openTool(page, "/en/tools/image-compressor/");
    await page.setInputFiles("input[type=file]", fixture("photo.png"));

    await expect(page.locator(".stat", { hasText: /Original size/i }).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(".stat", { hasText: /After processing/i }).first()).toBeVisible();
    await expect(page.locator(".stat", { hasText: /Saved/i }).first()).toBeVisible();
    await expect(downloadControl(page)).toBeVisible();
  });

  test("converts PNG to WebP and downloads the result", async ({ page }) => {
    await openTool(page, "/en/tools/image-converter/");
    await page.selectOption("#img-format", "image/webp");
    await page.setInputFiles("input[type=file]", fixture("photo.png"));
    await expect(page.locator(".stat", { hasText: /After processing/i }).first()).toBeVisible({ timeout: 60_000 });

    const download = page.waitForEvent("download");
    await downloadControl(page).click();
    expect((await download).suggestedFilename()).toMatch(/\.webp$/);
  });

  test("refuses more files than the limit allows", async ({ page }) => {
    await openTool(page, "/en/tools/image-compressor/");
    const files = Array.from({ length: 21 }, () => fixture("photo.png"));
    await page.setInputFiles("input[type=file]", files);
    await expect(page.getByText(/up to 20 files/)).toBeVisible({ timeout: 30_000 });
  });
});
