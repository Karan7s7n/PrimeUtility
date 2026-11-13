import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/urls";

/** Read at request time so a custom domain is picked up without a rebuild. */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/en/account/", "/ar/account/", "/en/login/", "/ar/login/", "/en/register/", "/ar/register/"],
      },
    ],
    ...(origin ? { sitemap: `${origin}/sitemap.xml`, host: origin } : {}),
  };
}
