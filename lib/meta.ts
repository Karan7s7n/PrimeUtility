
import type { Metadata } from "next";
import type { Locale } from "./site";
import { site } from "./site";
import { absoluteUrl, href } from "./urls";

export function pageMetadata({
  locale,
  path,
  title,
  description,
  keywords,
  type = "website",
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  keywords?: string[];
  type?: "website" | "article";
}): Metadata {
  const canonical = absoluteUrl("en", path);

  return {
    title,
    description,
    keywords,
    alternates: canonical
      ? {
          canonical,
          languages: {
            en: canonical,
            "x-default": canonical,
          },
        }
      : undefined,
    openGraph: {
      title: `${title} · ${site.brand}`,
      description,
      type,
      siteName: site.brand,
      locale: "en_US",
      url: canonical ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${site.brand}`,
      description,
    },
  };
}

export const siteJsonLd = (_locale: Locale) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.brand,
  inLanguage: "en",
  ...(absoluteUrl("en") ? { url: absoluteUrl("en") } : {}),
  description:
    "Free online tools for PDF, images, developers and small business, running in your browser.",
});

export const toolJsonLd = ({
  locale,
  name,
  description,
  path,
  category,
  faq,
}: {
  locale: Locale;
  name: string;
  description: string;
  path: string;
  category: string;
  faq: { q: string; a: string }[];
}) => [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (web browser)",
    inLanguage: "en",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    ...(absoluteUrl("en", path) ? { url: absoluteUrl("en", path) } : {}),
    ...(category ? { keywords: category } : {}),
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("en") ?? undefined,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tools",
        item: absoluteUrl("en", "tools") ?? undefined,
      },
      {
        "@type": "ListItem",
        position: 3,
        name,
        item: absoluteUrl("en", path) ?? undefined,
      },
    ],
  },
];

export const canonicalPath = (_locale: Locale, path = "") => href("en", path);
