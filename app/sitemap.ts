import type { MetadataRoute } from "next";
import { posts } from "@/lib/blog";
import { categories, contentDates, locales, pageDates } from "@/lib/site";
import { toolSlugs } from "@/lib/tools";
import { href, siteOrigin } from "@/lib/urls";

export const dynamic = "force-dynamic";

const staticPaths = [
  "",
  "tools",
  "pricing",
  "blog",
  "about",
  "contact",
  "privacy",
  "terms",
  "cookies",
  ...categories.map((category) => `tools/${category.slug}`),
  ...toolSlugs.map((slug) => `tools/${slug}`),
  ...posts.map((post) => `blog/${post.slug}`),
];

const asDate = (value: string) => new Date(`${value}T00:00:00.000Z`);
const latestPostDate = () => posts.map((post) => post.date).sort().at(-1) ?? contentDates.site;

/**
 * Real last-modified date per path: blog articles use their own publication
 * date, tools and legal pages use the date their section actually changed.
 * Nothing is stamped with "now", so unchanged pages do not look freshly edited.
 */
export function lastModifiedFor(path: string): Date {
  if (pageDates[path]) return asDate(pageDates[path]);

  if (path.startsWith("blog/")) {
    const post = posts.find((entry) => entry.slug === path.slice("blog/".length));
    if (post) return asDate(post.date);
  }
  if (path === "blog") return asDate(latestPostDate());
  if (path.startsWith("tools")) return asDate(contentDates.tools);
  if (["privacy", "terms", "cookies"].includes(path)) return asDate(contentDates.legal);

  return asDate(contentDates.site);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  if (!origin) return [];

  return locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${origin}${href(locale, path)}`,
      lastModified: lastModifiedFor(path),
      changeFrequency: path.startsWith("tools") ? ("monthly" as const) : ("weekly" as const),
      priority: path === "" ? 1 : path.startsWith("tools") ? 0.8 : 0.6,
      alternates: {
        languages: Object.fromEntries(locales.map((other) => [other, `${origin}${href(other, path)}`])),
      },
    })),
  );
}
