import type { Locale } from "./site";

export const href = (locale: Locale, path = "") => {
  const clean = path.replace(/^\/+|\/+$/g, "");
  return clean ? `/${locale}/${clean}/` : `/${locale}/`;
};

/**
 * Public origin, injected by the platform (MYTHEX_WEB_ORIGIN) and read at
 * request time — never hard-coded, and updated automatically when a custom
 * domain is added.
 */
export const siteOrigin = (): string | null => {
  const raw = (process.env.MYTHEX_WEB_ORIGIN || "").split(",")[0].trim().replace(/\/+$/, "");
  return raw || null;
};

export const absoluteUrl = (locale: Locale, path = "") => {
  const origin = siteOrigin();
  return origin ? `${origin}${href(locale, path)}` : null;
};
