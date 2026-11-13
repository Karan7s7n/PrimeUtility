import { afterEach, describe, expect, it, vi } from "vitest";
import { absoluteUrl, href, siteOrigin } from "@/lib/urls";
import { baseName, formatBytes, percentChange, stripExtension } from "@/lib/utils";

describe("formatBytes", () => {
  it("scales units and never renders nonsense", () => {
    expect(formatBytes(0)).toBe("0 KB");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536 * 1024)).toBe("1.50 MB");
    expect(formatBytes(1024 ** 3)).toBe("1 GB");
    expect(formatBytes(Number.NaN)).toBe("0 KB");
    expect(formatBytes(-10)).toBe("0 KB");
  });

  it("describes the documented limits in a readable way", () => {
    expect(formatBytes(2 * 1024 * 1024)).toBe("2.00 MB");
    expect(formatBytes(100 * 1024 * 1024)).toBe("100 MB");
  });
});

describe("percentChange", () => {
  it("reports how much was saved", () => {
    expect(percentChange(1000, 500)).toBe(50);
    expect(percentChange(1000, 1000)).toBe(0);
    expect(percentChange(0, 500)).toBe(0);
    expect(percentChange(1000, 1500)).toBeCloseTo(-50);
  });
});

describe("file names", () => {
  it("strips the extension and keeps it safe for downloads", () => {
    expect(stripExtension("report.pdf")).toBe("report");
    expect(stripExtension("archive.tar.gz")).toBe("archive.tar");
    expect(stripExtension("no-extension")).toBe("no-extension");
    expect(baseName("my report.pdf")).toBe("my report");
    expect(baseName("path/to/file.png")).toBe("path-to-file");
  });
});

describe("localised routes", () => {
  it("builds trailing-slash paths for both languages", () => {
    expect(href("en")).toBe("/en/");
    expect(href("ar")).toBe("/ar/");
    expect(href("en", "tools")).toBe("/en/tools/");
    expect(href("ar", "tools/json-formatter")).toBe("/ar/tools/json-formatter/");
    expect(href("en", "/tools/merge-pdf/")).toBe("/en/tools/merge-pdf/");
  });
});

describe("public origin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is null when the platform has not told us the origin", () => {
    vi.stubEnv("MYTHEX_WEB_ORIGIN", "");
    expect(siteOrigin()).toBeNull();
    expect(absoluteUrl("en", "tools")).toBeNull();
  });

  it("reads the injected origin and drops a trailing slash", () => {
    vi.stubEnv("MYTHEX_WEB_ORIGIN", "https://tools.example.com/");
    expect(siteOrigin()).toBe("https://tools.example.com");
    expect(absoluteUrl("ar", "pricing")).toBe("https://tools.example.com/ar/pricing/");
  });

  it("takes the first value when several origins are listed", () => {
    vi.stubEnv("MYTHEX_WEB_ORIGIN", "https://a.example.com,https://b.example.com");
    expect(siteOrigin()).toBe("https://a.example.com");
  });
});
