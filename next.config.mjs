/** @type {import('next').NextConfig} */
const nextConfig = {
  // The site is server-rendered: tool pages are still prerendered as real HTML
  // (SEO), while /api routes handle accounts, history and usage limits.
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  serverExternalPackages: ["pg"],
  // A separate dist dir can be used for verifying a production build while the
  // dev server is running (NEXT_DIST_DIR). Unset in production.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  /**
   * Baseline security headers. `X-Frame-Options` defaults to SAMEORIGIN so the
   * app can still be shown inside a same-origin preview frame; set
   * X_FRAME_OPTIONS=DENY (or off) to change that. A strict CSP is intentionally
   * not set yet: the tools load web fonts and create blob/data URLs.
   */
  async headers() {
    const frameOption = process.env.X_FRAME_OPTIONS ?? "SAMEORIGIN";
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()",
      },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    ];

    if (frameOption && frameOption !== "off") {
      headers.push({ key: "X-Frame-Options", value: frameOption });
    }

    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
