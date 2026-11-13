import { describe, expect, it } from "vitest";
import { locales } from "@/lib/site";
import { categories } from "@/lib/site";
import { getTool, relatedTools, toolSlugs, tools, toolsByCategory } from "@/lib/tools";

describe("tool registry", () => {
  it("ships exactly the ten tools of this version", () => {
    expect(toolSlugs).toHaveLength(10);
    expect(new Set(toolSlugs).size).toBe(10);
  });

  it("gives every slug a readable kebab-case form", () => {
    for (const slug of toolSlugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("keeps the routes the sitemap and page builder rely on", () => {
    expect(toolSlugs).toEqual([
      "json-formatter",
      "jwt-decoder",
      "regex-tester",
      "qr-code-generator",
      "image-compressor",
      "image-converter",
      "pdf-compressor",
      "merge-pdf",
      "pdf-to-word",
      "smart-pricing-calculator",
    ]);
  });

  it("places every tool in a known category", () => {
    const known = categories.map((category) => category.id);
    for (const tool of tools) {
      expect(known).toContain(tool.category);
    }
    expect(toolsByCategory("pdf")).toHaveLength(3);
    expect(toolsByCategory("image")).toHaveLength(3);
    expect(toolsByCategory("developer")).toHaveLength(3);
    expect(toolsByCategory("business")).toHaveLength(1);
  });

  it("has complete copy in both languages", () => {
    for (const tool of tools) {
      for (const locale of locales) {
        const copy = tool.copy[locale];
        expect(copy.name.length).toBeGreaterThan(1);
        expect(copy.h1.length).toBeGreaterThan(2);
        expect(copy.description.length).toBeGreaterThan(30);
        expect(copy.seoTitle.length).toBeGreaterThan(10);
        expect(copy.metaDescription.length).toBeGreaterThan(50);
        expect(copy.metaDescription.length).toBeLessThan(320);
        expect(copy.keywords.length).toBeGreaterThanOrEqual(3);
        expect(copy.howTo.length).toBeGreaterThanOrEqual(3);
        expect(copy.faq.length).toBeGreaterThanOrEqual(3);
        expect(copy.examples.length).toBeGreaterThanOrEqual(1);
        for (const item of copy.faq) {
          expect(item.q.length).toBeGreaterThan(5);
          expect(item.a.length).toBeGreaterThan(30);
        }
      }
    }
  });

  it("does not leak one language into the other", () => {
    for (const tool of tools) {
      expect(tool.copy.ar.name).not.toBe(tool.copy.en.name);
      expect(/[\u0600-\u06FF]/.test(tool.copy.ar.name)).toBe(true);
      expect(/[\u0600-\u06FF]/.test(tool.copy.en.name)).toBe(false);
    }
  });

  it("marks the tools advertised as popular", () => {
    const popular = tools.filter((tool) => tool.popular).map((tool) => tool.slug);
    expect(popular).toContain("json-formatter");
    expect(popular).toContain("image-compressor");
    expect(popular).toContain("pdf-compressor");
  });
});

describe("lookups", () => {
  it("finds a tool by slug and returns undefined for unknown ones", () => {
    expect(getTool("merge-pdf")?.category).toBe("pdf");
    expect(getTool("nope")).toBeUndefined();
  });

  it("suggests related tools that are never the tool itself", () => {
    for (const slug of toolSlugs) {
      const related = relatedTools(slug);
      expect(related).toHaveLength(3);
      expect(related.map((tool) => tool.slug)).not.toContain(slug);
      expect(new Set(related.map((tool) => tool.slug)).size).toBe(3);
    }
  });

  it("prefers same-category tools first", () => {
    const related = relatedTools("merge-pdf");
    const pdfFirst = related[0].category === "pdf" || related.every((tool) => tool.category !== "pdf");
    expect(pdfFirst).toBe(true);
  });
});
