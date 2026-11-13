
export const site = {
  /** Working brand identity. */
  brand: "PrimeUtility",
  version: "1.0",

  // Replace these example values before public launch.
  contactEmail: "karansinghn.07@gmail.com",
  github: "https://github.com/Karan7s7n/PrimeUtility.git",
};

/**
 * Last-modified dates used by sitemap generation.
 */
export const contentDates = {
  site: "2026-11-12",
  tools: "2026-09-24",
  legal: "2026-09-24",
};

/** Per-page date overrides. */
export const pageDates: Record<string, string> = {};

export type Locale = "en" | "ar";

export const locales: Locale[] = ["en"];
export const defaultLocale: Locale = "en";

export const localeDir = (_locale: Locale): "ltr" => "ltr";

export const isLocale = (value: string): value is Locale =>
  locales.includes(value as Locale);

export type CategoryId = "pdf" | "image" | "developer" | "business";

export const categories: {
  id: CategoryId;
  slug: string;
  icon: string;
  gradient: string;
}[] = [
  {
    id: "pdf",
    slug: "pdf-tools",
    icon: "file-text",
    gradient: "from-rose-500 to-orange-500",
  },
  {
    id: "image",
    slug: "image-tools",
    icon: "image",
    gradient: "from-sky-500 to-cyan-500",
  },
  {
    id: "developer",
    slug: "developer-tools",
    icon: "code",
    gradient: "from-brand-600 to-accent-600",
  },
  {
    id: "business",
    slug: "business-tools",
    icon: "briefcase",
    gradient: "from-emerald-500 to-teal-600",
  },
];

export const categorySlug = (id: CategoryId) =>
  categories.find((category) => category.id === id)!.slug;

export const categoryById = (id: CategoryId) =>
  categories.find((category) => category.id === id)!;

export const categoryBySlug = (slug: string) =>
  categories.find((category) => category.slug === slug);
