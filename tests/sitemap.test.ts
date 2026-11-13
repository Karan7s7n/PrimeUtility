import { describe, expect, it } from "vitest";
import { lastModifiedFor } from "@/app/sitemap";
import { posts } from "@/lib/blog";
import { contentDates, pageDates } from "@/lib/site";

const iso = (date: Date) => date.toISOString().slice(0, 10);
const today = new Date().toISOString().slice(0, 10);

describe("sitemap last-modified dates", () => {
  it("uses the tool date for tool pages, not the current time", () => {
    expect(iso(lastModifiedFor("tools"))).toBe(contentDates.tools);
    expect(iso(lastModifiedFor("tools/pdf-compressor"))).toBe(contentDates.tools);
    if (contentDates.tools !== today) {
      expect(iso(lastModifiedFor("tools/pdf-compressor"))).not.toBe(today);
    }
  });

  it("uses the legal date for policy pages", () => {
    for (const path of ["privacy", "terms", "cookies"]) {
      expect(iso(lastModifiedFor(path))).toBe(contentDates.legal);
    }
  });

  it("uses each article's own publication date", () => {
    for (const post of posts) {
      expect(iso(lastModifiedFor(`blog/${post.slug}`))).toBe(post.date);
    }
  });

  it("uses the newest article for the blog index", () => {
    const newest = posts.map((post) => post.date).sort().at(-1);
    expect(iso(lastModifiedFor("blog"))).toBe(newest);
  });

  it("gives different sections different dates", () => {
    const blogIndex = iso(lastModifiedFor("blog"));
    const legal = iso(lastModifiedFor("privacy"));
    expect(blogIndex).not.toBe(legal);
  });

  it("respects a per-page override", () => {
    pageDates["pricing"] = "2026-03-01";
    expect(iso(lastModifiedFor("pricing"))).toBe("2026-03-01");
    delete pageDates["pricing"];
  });

  it("falls back to the site date for unknown paths", () => {
    expect(iso(lastModifiedFor("something-new"))).toBe(contentDates.site);
  });

  it("never returns an invalid date", () => {
    for (const path of ["", "tools", "blog", "blog/json-formatter-guide", "privacy", "about"]) {
      expect(Number.isNaN(lastModifiedFor(path).getTime())).toBe(false);
    }
  });
});
