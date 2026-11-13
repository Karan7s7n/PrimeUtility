import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const fixture = (name: string) => path.join(process.cwd(), "e2e", ".fixtures", name);

async function openTool(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1");
  await page.waitForTimeout(1500);
}

const downloadControl = (page: Page) =>
  page.getByRole("link", { name: /download/i }).or(page.getByRole("button", { name: /download/i })).first();

test.describe("merge PDF", () => {
  test("merges two files, reports the page count and downloads the result", async ({ page }) => {
    await openTool(page, "/en/tools/merge-pdf/");
    await page.setInputFiles("input[type=file]", [fixture("sample.pdf"), fixture("second.pdf")]);
    await expect(page.locator(".stat", { hasText: /Total pages/i })).toContainText("5", { timeout: 60_000 });

    await page.getByRole("button", { name: /merge/i }).click();
    const download = page.waitForEvent("download");
    await downloadControl(page).click();
    expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
  });

  test("refuses a file that would push the document past 300 pages", async ({ page }) => {
    await openTool(page, "/en/tools/merge-pdf/");
    await page.setInputFiles("input[type=file]", [fixture("sample.pdf"), fixture("many-pages.pdf")]);
    await expect(page.getByText(/over 300 pages/i)).toBeVisible({ timeout: 90_000 });
  });
});

test.describe("PDF compressor", () => {
  test("compresses a small PDF and reports the size change", async ({ page }) => {
    await openTool(page, "/en/tools/pdf-compressor/");
    await page.setInputFiles("input[type=file]", fixture("sample.pdf"));
    await page.getByRole("button", { name: /compress/i }).click();
    await expect(page.locator(".stat", { hasText: /Before/i }).first()).toBeVisible({ timeout: 60_000 });
    await expect(downloadControl(page)).toBeVisible();
  });

  test("explains why a 301-page document is refused", async ({ page }) => {
    await openTool(page, "/en/tools/pdf-compressor/");
    await page.setInputFiles("input[type=file]", fixture("many-pages.pdf"));
    await page.getByRole("button", { name: /compress/i }).click();
    await expect(page.getByText(/more than 300 pages/i)).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("PDF to Word", () => {
  test("extracts the text of a text-based PDF and offers a .docx", async ({ page }) => {
    await openTool(page, "/en/tools/pdf-to-word/");
    await page.setInputFiles("input[type=file]", fixture("sample.pdf"));
    await expect(page.getByText(/SAMPLE — page 1 of 3/)).toBeVisible({ timeout: 60_000 });

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download Word file/i }).click();
    expect((await download).suggestedFilename()).toMatch(/\.docx$/);
  });

  test("says clearly that scanned PDFs need OCR", async ({ page }) => {
    await openTool(page, "/en/tools/pdf-to-word/");
    await expect(page.getByText(/need OCR/i).first()).toBeVisible();
  });
});
