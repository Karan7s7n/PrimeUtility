import type { Metadata } from "next";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${site.brand} — Fast online tools for PDF, images, developers and business`,
    template: `%s · ${site.brand}`,
  },
  description:
  "Free online tools for PDF, images, developers and small business. Ten focused tools that run in your browser.",
    applicationName: site.brand,
  robots: { index: true, follow: true },
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#4f46e5"/><path d="M32 13l3.6 9.9 9.9 3.6-9.9 3.6L32 40l-3.6-9.9-9.9-3.6 9.9-3.6z" fill="#fff"/><circle cx="44" cy="45" r="5" fill="#a78bfa"/></svg>',
          ),
        type: "image/svg+xml",
      },
    ],
  },
};

/** Applies the saved theme and the correct lang/dir before the first paint. */
const bootScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (error) {}
  document.documentElement.lang = 'en';
document.documentElement.dir = 'ltr';
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"></link>
        <meta name="theme-color" content="#4f46e5" />
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <div className="page-glow" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
