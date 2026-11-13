import { expect, test } from "@playwright/test";

/** Every tool of this version, with the control that proves its page built. */
const toolCases = [
  { slug: "json-formatter", heading: "JSON Formatter & Validator", control: "#json-input" },
  { slug: "jwt-decoder", heading: "JWT Decoder", control: "#jwt-input" },
  { slug: "regex-tester", heading: "Regex Tester", control: "#regex-pattern" },
  { slug: "qr-code-generator", heading: "QR Code Generator", control: "#qr-url" },
  { slug: "image-compressor", heading: "Image Compressor", control: "input[type=file]" },
  { slug: "image-converter", heading: "Image Converter (JPG, PNG, WebP)", control: "input[type=file]" },
  { slug: "pdf-compressor", heading: "Compress PDF Online", control: "input[type=file]" },
  { slug: "pdf-to-word", heading: "PDF to Word Converter", control: "input[type=file]" },
  { slug: "merge-pdf", heading: "Merge PDF Files", control: "input[type=file]" },
  { slug: "smart-pricing-calculator", heading: "Smart Pricing Calculator", control: "#purchase" },
];


test.describe("tool pages", () => {
  for (const tool of toolCases) {
    test(`${tool.slug} loads with its tool ready`, async ({ page }) => {
      const response = await page.goto(`/en/tools/${tool.slug}/`);
      expect(response?.status()).toBeLessThan(400);

      await expect(page.locator("h1")).toHaveText(tool.heading);
      // file inputs are intentionally hidden and opened by the drop area button
      await expect(page.locator(tool.control).first()).toBeAttached();

      // SEO essentials every tool page must keep
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`/en/tools/${tool.slug}/?$`),
      );
      await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();

      // privacy promise and related tools
      await expect(page.getByRole("heading", { level: 2, name: /related tools/i })).toBeVisible();
    });
  }

  test("the home page lists the tools and the search box", async ({ page }) => {
    await page.goto("/en/");
    await expect(page.locator("h1")).toContainText("Fast online tools");
    await expect(page.getByPlaceholder(/search for a tool/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /JSON Formatter/i }).first()).toBeVisible();
  });

  test("Arabic pages render right to left", async ({ page }) => {
    await page.goto("/ar/tools/json-formatter/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("h1")).toContainText(/JSON/);
  });

  test("the tools index links every category", async ({ page }) => {
    await page.goto("/en/tools/");
    for (const category of ["PDF Tools", "Image Tools", "Developer Tools", "Business Tools"]) {
      await expect(page.getByRole("link", { name: new RegExp(category, "i") }).first()).toBeVisible();
    }
    await expect(page.getByRole("link", { name: /Merge PDF/i }).first()).toBeVisible();
  });
});
