import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-x flex min-h-screen flex-col items-center justify-center gap-5 text-center">
      <p className="text-6xl font-extrabold text-brand-600/30 dark:text-brand-400/30">404</p>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">We could not find that page</h1>
      <p className="max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">
        الرابط قد يكون غير صحيح أو أن الأداة انتقلت. جرّب قائمة الأدوات كاملة.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/en/tools/" className="btn-primary">
          All tools (EN)
        </Link>
        <Link href="/ar/tools/" className="btn-secondary">
          كل الأدوات (ع)
        </Link>
      </div>
    </main>
  );
}
