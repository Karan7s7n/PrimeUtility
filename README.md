# PrimeUtility — Digital Tools Platform (V1)

A bilingual (Arabic + English) web platform of ten focused online tools for PDF, images,
developers and small business. Version 1 is **client-side first**: every tool runs inside the
visitor's browser, so there is nothing to upload, nothing to store and almost nothing to pay
for in server capacity.

> The name in `lib/site.ts` is a working title. Change it in one place and it changes everywhere.

## What ships in V1

| Group | Tool | Route |
| --- | --- | --- |
| PDF | Compress PDF (safe + strong modes) | `/{locale}/tools/pdf-compressor/` |
| PDF | Merge PDF | `/{locale}/tools/merge-pdf/` |
| PDF | PDF to Word (.docx) | `/{locale}/tools/pdf-to-word/` |
| Image | Image Compressor | `/{locale}/tools/image-compressor/` |
| Image | Image Converter (JPG/PNG/WebP) | `/{locale}/tools/image-converter/` |
| Image | QR Code Generator (PNG + SVG) | `/{locale}/tools/qr-code-generator/` |
| Developer | JSON Formatter / Validator | `/{locale}/tools/json-formatter/` |
| Developer | JWT Decoder | `/{locale}/tools/jwt-decoder/` |
| Developer | Regex Tester | `/{locale}/tools/regex-tester/` |
| Business | Smart Pricing Calculator | `/{locale}/tools/smart-pricing-calculator/` |

Plus: home, all-tools index, four category pages, pricing (Free/Pro/Business, marked as
planned), four long-form guides, about, contact, privacy, terms and cookies — all in both
languages, all statically generated.

`locale` is `en` or `ar`; `/ar/` renders right-to-left.

## Accounts, history and limits (V2)

A free account is live: register with an email and password, and the platform keeps a record of
what you ran, how much data it saved you and how much of your daily allowance you have used.

- **Auth** — email + password (scrypt hashing), httpOnly session cookie, 30 days.
- **History** — tool runs with metadata only (tool, input size, output size, duration, time).
  File contents are never stored: the tools process everything in the browser.
- **Allowance** — guest 5 runs/day per browser, free account 40/day, Pro 2,000, Business 10,000.
  Because the tools run locally, the allowance is a soft limit: the tool keeps working, the
  notice explains the stop and a free account raises it.
- **Daily allowance** — counted in `usage_daily` (one row per account or browser per day) inside
  the same transaction that records the run, guarded by a per-scope advisory lock. Two requests
  arriving together can never both take the last slot, and clearing the history does not hand back
  a fresh allowance, because the counter is not part of the history rows.
- **Rate limiting** — fixed windows counted in Postgres (`rate_limits`): sign-in 5 attempts /
  15 min, registration 10 / hour, password change 5 / 15 min, all per hashed IP. Over the limit
  the API answers `429` with a `Retry-After` header. A successful sign-in clears its own counter,
  so a real user is never locked out by their own logins.
- **Sessions** — changing a password deletes every session of that user and issues a fresh one;
  expired sessions and rate-limit rows older than two hours are removed by housekeeping that runs
  at most every 30 minutes (there is no scheduler in this environment).
- **Account page** — plan and usage, history with delete/clear, profile (name, language) and
  password change.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` · `/api/auth/login` · `/api/auth/logout` | session |
| GET | `/api/auth/me` | current user + usage summary |
| PATCH | `/api/auth/profile` | name, preferred language |
| POST | `/api/auth/password` | change password |
| POST | `/api/runs` | record a run (returns remaining allowance, 429 when spent) |
| GET/DELETE | `/api/history` | list, delete one (`?id=`) or clear all |
| GET | `/api/usage` | counters per tool, totals, bytes saved |

Postgres tables (`users`, `sessions`, `tool_runs`) are created on first use — no migration step
to run. `DATABASE_URL` is injected by the platform; if it is missing the site still works, with
accounts disabled and a clear notice.

## Admin dashboard (V3)

`/[locale]/admin/` is the operations view, guarded on the server: the page and every
`/api/admin/*` route check the stored role, so hiding a button changes nothing.

- **Roles and plans** — `users.role` is `user`, `admin` or `super_admin`; `users.plan` is
  `free`, `pro` or `business` and decides the daily allowance (2,000 / 10,000). A plan is not a
  permission: a Pro account still cannot open the dashboard.
- **Getting in** — while the deployment has no admin at all, the first signed-in visitor sees a
  *Make this account the admin* button on `/admin` (one-time, then the seat is taken). Or list
  addresses in `ADMIN_EMAILS` and they are promoted on sign-in — that also survives a lost admin
  account.
- **Overview** — accounts, new and active users (7 days), open sessions, runs today / 7 / 30 days,
  failures, guest browsers, bytes saved, average duration, most used tools, plan breakdown and
  the newest signups.
- **Users** — search by email or name, filter by plan, role and status, paginated, with runs and
  sessions per account. Actions: change plan, change role (super admin only), suspend / activate,
  delete (super admin only). Suspension deletes that account's sessions immediately, so it is
  signed out everywhere on its next request. Guards stop an admin locking themselves out: no
  suspending or deleting yourself, and the last super admin cannot be demoted.
- **Tools** — usage per tool plus a switch and an internal note. A switched-off tool disappears
  from the home page and the tools index (both rendered per request), and its own page keeps its
  SEO content but shows a pause notice instead of the tool. Tool pages themselves stay static.
- **Activity** — every recorded run with its account (or an anonymised guest id), sizes, duration
  and status, filterable by tool and status.
- **Audit log** — every admin action with the acting account, so changes are attributable.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/admin/overview` | dashboard counters |
| GET/POST | `/api/admin/users` | list / act on an account |
| GET/POST | `/api/admin/tools` | list tools / switch one off or note it |
| GET | `/api/admin/activity` | recorded runs, filterable, paginated |
| GET | `/api/admin/audit` | admin action log |
| GET/POST | `/api/admin/claim` | availability of the first-admin seat / take it |

Tables `tool_settings` and `admin_audit` are created with the rest, and `users` gained the
`plan`, `status` and `last_seen_at` columns on first use.

## Limits and safety

Everything that could exhaust the visitor's device or our API is capped, and the user is told
why rather than having files silently ignored.

| Where | Limit |
| --- | --- |
| API JSON bodies | 1 MB (checked from `Content-Length` and the real byte length) |
| Image tools | 20 files, 25 MB each, 100 MB total |
| Merge PDF | 20 files, 50 MB each, 100 MB total, 300 pages in total |
| PDF compressor / PDF to Word | 50 MB, 300 pages |
| Regex tester | 2,000 characters of pattern, 500,000 characters of text |
| JSON formatter | 2 MB before anything is parsed |
| Tool statistics | sizes and durations are validated and clamped server-side |

Reported usage is self-reported by the browser, so it is used for history and statistics only —
anything billed later must be measured on the server.

Baseline security headers are sent from `next.config.mjs` (`X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, and `X-Frame-Options`,
which defaults to `SAMEORIGIN` so the app can still be previewed inside a frame — set
`X_FRAME_OPTIONS=DENY` to change it). A strict CSP is deliberately not set yet: the tools rely on
blob/data URLs and web fonts. The production container runs as the unprivileged `node` user.

## Stack

- **Next.js 15 (App Router) + React 19 + TypeScript**, server-rendered. Tool pages are still
  prerendered as real HTML (SEO), while `/api` routes handle accounts, history and limits.
  Published from the included `Dockerfile`.
- **Tailwind CSS v4** with a small design system in `app/globals.css` (light/dark, RTL-aware).
- Client-side libraries: `pdf-lib` (merge, rebuild, compose), `pdfjs-dist` (page rendering, text
  extraction), `docx` (Word output), `qrcode` (PNG/SVG), Canvas & `createImageBitmap` (images).

### Why not Laravel + MySQL + Redis yet

The project document proposes Next.js + Laravel + MySQL + Redis. That backend only earns its
keep once there are **accounts, saved history, subscriptions, queue jobs and heavy server-side
PDF/OCR** — none of which exist in V1. Building it now would add cost and risk without adding a
single usable feature, and it would move file processing onto a server, against the privacy
principle in the same document. The static-first V1 keeps the platform free to run and easy to
index; the API service (Dockerfile + Postgres) is the next stage.

## Project layout

```
app/
  layout.tsx                  root shell: fonts, theme + lang/dir boot script
  page.tsx                    "/" → picks Arabic or English from the browser
  not-found.tsx               404
  [locale]/
    layout.tsx                header, footer, dir=rtl|ltr, per-locale metadata
    page.tsx                  home (hero, search, categories, guides)
    tools/page.tsx            all tools + instant search and filters
    tools/[slug]/page.tsx     one tool page (or a category page)
    pricing | blog | blog/[slug] | about | contact | privacy | terms | cookies
components/
  Header, Footer, ToolCard, ToolSearch, Breadcrumbs, JsonLd, LegalPage, ThemeToggle, LocaleSwitch
  tools/                      one component per tool + shared tool UI (FileDrop, Stat, Notice…)
lib/
  site.ts        brand, locales, categories
  i18n.ts        every UI string in both languages
  tools.ts       tool registry: slugs, categories, SEO copy, how-to, FAQ, examples
  pages.ts       about / pricing / legal copy, both languages
  blog.ts        guide articles, both languages
  meta.ts        metadata + JSON-LD builders
  images.ts, pdf.ts, urls.ts, utils.ts
scripts/
  copy-pdf-worker.mjs   puts the pdf.js worker in public/ before dev/build
  generate-seo.mjs      writes sitemap.xml + robots.txt into out/ after build
```

## Adding an eleventh tool

1. Add an entry to `tools` in `lib/tools.ts` (slug, category, icon, gradient, and the copy for
   both locales: name, tagline, h1, description, SEO title/description, keywords, how-to steps,
   FAQ, examples).
2. Write `components/tools/MyTool.tsx` (client component, receives `locale`).
3. Register it in `components/tools/ToolRunner.tsx` with `dynamic(..., { ssr: false })` so the
   tool is code-split and only loads on its own page.
4. Add the slug to the tool list in `scripts/generate-seo.mjs`.

Nothing else: routing, breadcrumbs, structured data, related tools, sitemap, hreflang and both
languages come from the registry.

## SEO

- One static HTML page per tool per language; unique title, meta description, keywords, H1/H2s.
- `hreflang` alternates (en/ar + x-default) and canonical URLs whenever the public origin is
  known at build time (see below).
- JSON-LD: `WebSite`, `SoftwareApplication`, `FAQPage`, `BreadcrumbList`, `Article`.
- Internal linking: category pages, related tools, guides → tools.
- `sitemap.xml` + `robots.txt` are generated into `out/` by `scripts/generate-seo.mjs`.

The public origin comes from `MYTHEX_WEB_ORIGIN` — no hostname is ever hard-coded. `robots.txt` and
`sitemap.xml` read it per request, while canonical and hreflang tags are part of the prerendered
HTML and therefore use the value present at build time (CI sets it). If the variable is absent the
site still works: `robots.txt` is served without a sitemap line and no canonical/hreflang tags are
emitted, rather than emitting wrong ones.

`sitemap.xml` uses a real last-modified date per page (blog articles use their own publication
date, tools and legal pages use the date their section changed — see `contentDates` in
`lib/site.ts`), so a rebuild never makes unchanged pages look freshly edited.

## Tests

```bash
npm test          # unit tests (vitest run)
npm run test:watch

npm run test:e2e  # end-to-end browser tests (Playwright)
```

**Unit tests** (10 files, 84 tests) cover password hashing and verification, schema-before-query
ordering on registration, duplicate-email and weak-input rejection, sign-in with a wrong and a
right password, brute-force locking after five failures, session rotation on password change, the
rate-limit windows and `Retry-After` maths, API body-size handling, the atomic allowance
(lock → counter → record → commit, and rollback), file/page/regex/JSON limits, registered tool
integrity in both languages, sitemap last-modified dates, and the URL/formatting helpers.

**End-to-end tests** (Playwright, 56 checks over desktop and a mobile viewport) run the real
browser flows: every one of the ten tool pages renders its tool, formats/minifies JSON, decodes a
JWT, tests a regex with named groups, generates a QR code and downloads it, compresses and
converts an image, merges/compresses PDFs and extracts text to .docx, prices a product in both
languages, registers and signs in, changes a password and a profile, proves that sixty
simultaneous runs hand out each allowance slot exactly once, and covers the admin dashboard:
refusal for ordinary accounts, a plan change that reaches the account's own limits, suspension
that signs the account out, a tool switched off that leaves the public listings and pauses its
own page, and the audit trail recording it all. Sample files are generated on the fly
(`e2e/support/fixtures.ts`), so no binaries are committed.

Point the suite at an already running server with `E2E_BASE_URL`, or let it start one itself
(`E2E_PORT`, default 3000) — that is what CI does.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request:

1. **verify** — `npm run typecheck`, `npm test`, `npm run build`.
2. **e2e** — a real PostgreSQL 16 service, a production build, `npx playwright install
   --with-deps chromium`, then `npm run test:e2e`. Traces, screenshots and the HTML report are
   uploaded as artifacts when a run fails.

## Local development

```bash
npm install          # also copies the pdf.js worker into public/
npm run dev          # http://localhost:3000
npm run build        # production build (needs DATABASE_URL for the runtime only)
npm run typecheck

# verify a build while the dev server is running, without touching .next/
NEXT_DIST_DIR=.next-build npm run build
```

## Roadmap (from the project document)

- **V1** — 10 tools, bilingual, SEO, legal pages.
- **V2 (this release)** — accounts, saved history, usage limits, account dashboard, Postgres,
  Postgres-backed SEO routes (sitemap/robots read the live origin).
- **V3 (this release)** — admin dashboard: roles and plans, usage overview, account management,
  tool switches, activity log and audit trail.
- **V3 next** — Pro/Business billing (Stripe), batch processing, and heavy PDF work (OCR on
  scans, split/protect/sign) with the first AI tools.
- **V4** — public API, API keys, teams, usage dashboard.
- **V5** — mobile apps sharing the same API, integrations, marketplace.

Deliberately **not** yet: payments and server-side file processing (OCR on scans). The Pro and
Business plans exist in the data model and can be granted from the dashboard, but nothing charges
for them until billing lands.
# PrimeUtility
