import { expect, test, type Page } from "@playwright/test";

/** Opens a tool and waits until React has hydrated, so form input is not lost. */
async function openTool(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1");
  // give React a moment to hydrate so typed input is not lost
  await page.waitForTimeout(1500);
}

const filler = Array.from({ length: 40 }, (_, i) => `  "line${i}": ${i}`).join(",\n");
const validJson = `{\n${filler}\n}`;

test.describe("JSON formatter", () => {
  test("formats valid JSON and reports the size change", async ({ page }) => {
    await openTool(page, "/en/tools/json-formatter/");
    await page.locator("#json-input").fill(`{"a":1,"b":[1,2,3],"c":{"d":true}}`);
    await page.getByRole("button", { name: "Format", exact: true }).click();
    const output = page.locator("textarea.code-area").nth(1);
    await expect(output).toHaveValue(/"b": \[/);
    await expect(page.getByText("Formatted successfully.")).toBeVisible();
    await expect(page.getByText(/^\d+(\.\d+)? (B|KB|MB)$/).first()).toBeVisible();
  });

  test("minifies and explains invalid JSON with a position", async ({ page }) => {
    await openTool(page, "/en/tools/json-formatter/");
    await page.locator("#json-input").fill(validJson);
    await page.getByRole("button", { name: "Minify" }).click();
    await expect(page.locator("textarea.code-area").nth(1)).toHaveValue(/"line0":0/);
    const formatted = await page.locator("textarea.code-area").nth(1).inputValue();
    expect(formatted.split("\n")).toHaveLength(1);

    await page.locator("#json-input").fill('{\n  "a": 1,\n  "b": }\n}');
    await page.getByRole("button", { name: "Format", exact: true }).click();
    await expect(page.getByText(/line 3|column/i).first()).toBeVisible();
  });

  test("refuses input over two megabytes", async ({ page }) => {
    await openTool(page, "/en/tools/json-formatter/");
    await page.locator("#json-input").fill(`{"data":"${"x".repeat(2_100_000)}"}`);
    // wait until the size badge proves React received the value before acting
    await expect(page.getByText(/^\d+(\.\d+)? MB$/).first()).toBeVisible();
    await page.getByRole("button", { name: "Format", exact: true }).click();
    await expect(page.getByText(/larger than 2\.00 MB/)).toBeVisible();
  });
});

test.describe("JWT decoder", () => {
  // header.payload.signature — clearly not a real token
  const token = [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
    Buffer.from(JSON.stringify({ sub: "42", name: "Nour", iat: 1_700_000_000, exp: 4_000_000_000 })).toString("base64url"),
    "not-a-real-signature",
  ].join(".");

  test("decodes header and payload and says the signature is not verified", async ({ page }) => {
    await openTool(page, "/en/tools/jwt-decoder/");
    await page.locator("#jwt-input").fill(token);
    await expect(page.getByText(/"alg": "HS256"/)).toBeVisible();
    await expect(page.getByText(/"name": "Nour"/)).toBeVisible();
    await expect(page.getByText(/decoding is not verification/i).first()).toBeVisible();
    await expect(page.getByText(/^iat:/).first()).toBeVisible();
    await expect(page.getByText(/^exp:/).first()).toBeVisible();
  });

  test("explains a malformed token instead of failing silently", async ({ page }) => {
    await openTool(page, "/en/tools/jwt-decoder/");
    await page.locator("#jwt-input").fill("not.a.jwt");
    await expect(page.getByText(/does not look like a JWT/i)).toBeVisible();
  });
});

test.describe("Regex tester", () => {
  test("lists matches, groups and named groups", async ({ page }) => {
    await openTool(page, "/en/tools/regex-tester/");
    await page.locator("#regex-pattern").fill("(?<year>\\d{4})-(?<month>\\d{2})");
    await page.locator("#regex-text").fill("2026-01 start, 2026-09 end");
    await expect(page.getByText("Matches (2)")).toBeVisible();
    await expect(page.getByText("year").first()).toBeVisible();
    await expect(page.getByText("2026-01").first()).toBeVisible();
  });

  test("refuses text over the size limit", async ({ page }) => {
    await openTool(page, "/en/tools/regex-tester/");
    await page.locator("#regex-pattern").fill("[a-z]+");
    await page.locator("#regex-text").fill("a".repeat(500_001));
    await expect(page.getByText(/longer than 500,000 characters/)).toBeVisible();
  });
});

test.describe("QR code generator", () => {
  test("renders a QR code and offers both download formats", async ({ page }) => {
    await openTool(page, "/en/tools/qr-code-generator/");
    await page.locator("#qr-url").fill("https://example.com/primeutility");
    await expect(page.locator("#qr-url")).toHaveValue("https://example.com/primeutility");
    await expect(page.locator("svg").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /PNG/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /SVG/i }).first()).toBeVisible();

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /PNG/i }).first().click();
    expect((await download).suggestedFilename()).toMatch(/\.png$/);
  });
});
