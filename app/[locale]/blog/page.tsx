import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { dictionaries } from "@/lib/i18n";
import { pageMetadata } from "@/lib/meta";
import { posts } from "@/lib/blog";
import { isLocale, type Locale } from "@/lib/site";
import { href } from "@/lib/urls";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  return pageMetadata({
    locale: typed,
    path: "blog",
    title: typed === "ar" ? "أدلة الاستخدام" : "Guides",
    description:
      typed === "ar"
        ? "أدلة عملية قصيرة عن ضغط الملفات وتحويل الصور وتنسيق JSON وتسعير المنتجات."
        : "Short, practical guides on compressing files, converting images, formatting JSON and pricing products.",
    keywords:
      typed === "ar"
        ? ["أدلة", "شروحات", "ضغط pdf", "تسعير المنتجات"]
        : ["guides", "how to compress pdf", "convert images", "pricing guide"],
  });
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const dict = dictionaries[typed];

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(typed === "ar" ? "ar-EG" : "en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="container-x py-10">
      <Breadcrumbs locale={typed} items={[{ label: dict.nav.blog }]} />

      <header className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{dict.nav.blog}</h1>
        <p className="mt-3 text-[15px] leading-7 text-slate-600 dark:text-slate-300">
          {typed === "ar"
            ? "دلائل قصيرة تشرح كيف تعمل المهمة الرقمية بشكل صحيح، ومتى تختار كل خيار."
            : "Short guides on how each digital chore actually works, and when to pick which option."}
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <Link key={post.slug} href={href(typed, `blog/${post.slug}`)} className="surface surface-hover flex flex-col gap-2 p-5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatDate(post.date)} · {post.minutes} {typed === "ar" ? "دقائق" : "min"}
            </span>
            <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white">{post.copy[typed].title}</h2>
            <p className="text-[13.5px] leading-6 text-slate-600 dark:text-slate-400">{post.copy[typed].excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
