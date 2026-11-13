import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { posts, getPost } from "@/lib/blog";
import { dictionaries } from "@/lib/i18n";
import { pageMetadata } from "@/lib/meta";
import { isLocale, site, type Locale } from "@/lib/site";
import { getTool } from "@/lib/tools";
import { absoluteUrl, href } from "@/lib/urls";

export const dynamicParams = false;

export function generateStaticParams() {
  return ["en"].flatMap((locale) => posts.map((post) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const post = getPost(slug);
  if (!post) return {};
  const copy = post.copy[typed];
  return pageMetadata({
    locale: typed,
    path: `blog/${slug}`,
    title: copy.title,
    description: copy.metaDescription,
    type: "article",
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const post = getPost(slug);
  if (!post) notFound();

  const copy = post.copy[typed];
  const dict = dictionaries[typed];
  const tool = getTool(post.toolSlug);
  const url = absoluteUrl(typed, `blog/${slug}`);

  return (
    <div className="container-x py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: copy.title,
          description: copy.metaDescription,
          inLanguage: typed,
          datePublished: post.date,
          author: { "@type": "Organization", name: site.brand },
          publisher: { "@type": "Organization", name: site.brand },
          ...(url ? { mainEntityOfPage: url } : {}),
        }}
      />

      <Breadcrumbs
        locale={typed}
        items={[{ label: dict.nav.blog, path: "blog" }, { label: copy.title }]}
      />

      <article className="max-w-3xl">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{copy.title}</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {new Date(post.date).toLocaleDateString(typed === "ar" ? "ar-EG" : "en-GB", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            · {post.minutes} {typed === "ar" ? "دقائق قراءة" : "min read"}
          </p>
          <p className="mt-4 text-[15px] leading-7 text-slate-600 dark:text-slate-300">{copy.excerpt}</p>
        </header>

        <div className="prose-copy mt-8">
          {copy.sections.map((section, index) => (
            <section key={section.heading ?? index}>
              {section.heading && <h2>{section.heading}</h2>}
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.list && (
                <ul className="list-disc space-y-1.5 ps-5 text-[15px] leading-7 text-slate-600 dark:text-slate-300">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {tool && (
          <aside className="surface mt-10 p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {typed === "ar" ? "جرّب الأداة" : "Try the tool"}
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-6 text-slate-600 dark:text-slate-400">{tool.copy[typed].tagline}</p>
            <Link href={href(typed, `tools/${tool.slug}`)} className="btn-primary mt-4">
              {tool.copy[typed].name}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </aside>
        )}

        <section className="mt-12">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {typed === "ar" ? "اقرأ أيضًا" : "Also worth reading"}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {posts
              .filter((entry) => entry.slug !== post.slug)
              .slice(0, 2)
              .map((entry) => (
                <Link
                  key={entry.slug}
                  href={href(typed, `blog/${entry.slug}`)}
                  className="surface surface-hover p-4 text-sm font-medium text-slate-800 dark:text-slate-100"
                >
                  {entry.copy[typed].title}
                </Link>
              ))}
          </div>
        </section>
      </article>
    </div>
  );
}
