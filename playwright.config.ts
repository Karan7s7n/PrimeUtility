import { defineConfig, devices } from "@playwright/test";

// E2E_BASE_URL points at an already running server (the preview sandbox).
// Otherwise Playwright starts one itself, as it does in CI. E2E_PORT picks the port.
const port = Number(process.env.E2E_PORT ?? 3000);
const externalServer = process.env.E2E_BASE_URL;
const baseURL = externalServer ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/support/fixtures.ts",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  // One worker: the specs share a database, the daily allowance and per-IP rate limits.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    locale: "en-US",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /smoke\.spec\.ts/ },
  ],
  // In CI the workflow builds first and Playwright starts the built server.
  // Locally an already running dev server is reused.
  webServer: externalServer
    ? undefined
    : {
        command: "npm run start",
        url: `${baseURL}/en/`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          // the app needs these to render canonicals and to reach the database
          MYTHEX_WEB_ORIGIN: process.env.MYTHEX_WEB_ORIGIN ?? baseURL,
          DATABASE_URL: process.env.DATABASE_URL ?? "",
          PORT: String(port),
          NEXT_DIST_DIR: process.env.NEXT_DIST_DIR ?? ".next",
        },
      },
});
