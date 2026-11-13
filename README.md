# PrimeUtility — All-in-One Online Tools Platform

**Fast, practical, and privacy-focused digital tools for everyday tasks.**

PrimeUtility is a web-based platform that brings together useful PDF, image, developer, and small-business tools in one place. Its primary goal is to make common digital tasks simple, accessible, and efficient without requiring users to install software or upload files to a remote processing server.

The platform follows a client-side-first approach: supported tools process files directly inside the visitor's browser. This reduces server workload, improves privacy, and keeps infrastructure requirements manageable.

---

## Project Overview

PrimeUtility is built around three principles:

- **Privacy first:** File processing happens locally in the browser wherever supported. File contents are not stored in the platform's database.
- **Simple experience:** Focused tools with straightforward interfaces and minimal setup.
- **Scalable architecture:** A lightweight web application supported by PostgreSQL for accounts, usage tracking, and administration.

The application also includes user accounts, usage history, daily allowances, and an administrative dashboard.

## Features

### 1. Online Tools

PrimeUtility brings together tools across four main categories:

| Category | Tools |
|---|---|
| PDF | PDF compression, PDF merging, PDF-to-Word conversion |
| Images | Image compression, image conversion, QR code generation |
| Developer | JSON formatting and validation, JWT decoding, regex testing |
| Business | Smart pricing calculator |

Each tool has its own dedicated page, instructions, and supporting SEO content.

### 2. User Accounts and Usage Management

Registered users can create an account using an email address and password.

Account functionality includes:

- Secure password hashing using scrypt.
- HTTP-only session cookies.
- Session expiration after 30 days.
- Account profile management.
- Password changes and session rotation.
- Tool usage history.
- Daily usage allowance tracking.
- Usage statistics and data-savings estimates.

The platform stores tool execution metadata rather than uploaded file contents.

### 3. Usage Allowances

PrimeUtility supports guest usage and account-based plans.

| Account type | Daily allowance |
|---|---:|
| Guest | 5 runs |
| Free | 40 runs |
| Pro | 2,000 runs |
| Business | 10,000 runs |

The Pro and Business plans are currently represented in the application and can be assigned through administration. Payment processing and subscription billing are planned for a future release.

Because most tools operate locally, usage allowances primarily govern platform usage tracking rather than acting as a technical restriction on browser-side processing.

### 4. Usage Tracking and History

The application records:

- Tool name.
- Input and output sizes.
- Execution duration.
- Execution timestamp.
- Success or failure status.

Users can view their usage history, delete individual records, or clear their history.

Daily allowance counters are maintained separately from history records. Clearing history therefore does not reset the daily allowance.

### 5. Administrative Dashboard

The administration area is available at:

`/en/admin/`

Access is protected by server-side role checks. Hiding an interface element does not grant or remove permissions.

**Roles**

- `user`
- `admin`
- `super_admin`

**Administrative capabilities**

- View platform statistics.
- Monitor registered and active users.
- Review usage activity and failures.
- Search and filter accounts.
- Change user plans.
- Manage account roles.
- Suspend or reactivate accounts.
- Delete accounts.
- Enable or disable individual tools.
- Add internal notes to tools.
- Review administrative activity and audit records.

Suspending an account invalidates its existing sessions. Additional safeguards prevent administrators from accidentally suspending or deleting themselves and protect the last super administrator from being demoted.

**Administrator access**

Administrator accounts can be configured through the `ADMIN_EMAILS` environment variable. Whitelisted email addresses are promoted when signing in.

The first-administrator claim mechanism is also protected by an email whitelist and a transactional database lock.

### 6. Database and Backend

PrimeUtility uses PostgreSQL for persistent application data.

The database includes tables for:

- Users.
- Sessions.
- Tool execution history.
- Daily usage counters.
- Tool settings.
- Administrative audit records.
- API rate limits.

The schema is initialized automatically on first database-backed use. No separate manual migration command is required for the current schema.

If the database is not configured, the public tools can still operate, but account-related features remain unavailable.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Frontend | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL |
| Database client | node-postgres (`pg`) |
| Authentication | Custom email/password authentication |
| Password hashing | scrypt |
| PDF processing | pdf-lib, pdfjs-dist |
| Word generation | docx |
| QR generation | qrcode |
| Image processing | Canvas API, createImageBitmap |
| Testing | Vitest, Playwright |
| Deployment packaging | Docker |

### Architecture

PrimeUtility combines statically generated public pages with dynamic server-side API routes.

- Public pages are prerendered for performance and search engine indexing.
- Interactive tools are loaded on their respective pages.
- Browser-supported processing happens locally.
- API routes handle authentication, accounts, history, usage tracking, and administration.
- PostgreSQL stores persistent application data.

This architecture avoids moving every file-processing task onto a backend server.

---

## Privacy, Security and Resource Limits

PrimeUtility is designed to limit unnecessary data collection and protect both visitors and platform infrastructure.

### File Processing

Files are processed in the browser wherever supported. The application does not store uploaded file contents in its usage-history database.

### Resource Limits

The application applies safeguards to prevent excessively large inputs or expensive operations.

| Area | Limit |
|---|---|
| API JSON request bodies | 1 MB |
| Image tools | 20 files, 25 MB each, 100 MB total |
| PDF merging | 20 files, 50 MB each, 100 MB total, 300 pages |
| PDF compression and conversion | 50 MB, 300 pages |
| Regex pattern | 2,000 characters |
| Regex test text | 500,000 characters |
| JSON formatter input | 2 MB |

Limits are validated so oversized inputs receive a clear error rather than being silently ignored.

### API Rate Limiting

PostgreSQL-backed rate limiting protects authentication endpoints:

- Sign-in: 5 attempts per 15 minutes.
- Registration: 10 attempts per hour.
- Password changes: 5 attempts per 15 minutes.

Rate limits are applied using hashed IP identifiers. Requests exceeding the configured limits receive HTTP 429 responses with a `Retry-After` header.

### Security Headers

The application configures baseline security headers, including:

- X-Content-Type-Options.
- Referrer-Policy.
- Permissions-Policy.
- Strict-Transport-Security.
- X-Frame-Options.

A restrictive Content Security Policy is not enabled yet because browser-based tools require certain blob URLs, data URLs, and font resources.

The Docker production container runs under the unprivileged `node` user.

**Usage statistics note:** Input sizes, output sizes, and durations reported by the browser are intended for history and analytics. They should not be treated as authoritative billing measurements. Any future usage-based billing must rely on server-verified measurements.

---

## Search Engine Optimization

PrimeUtility uses dedicated public pages and metadata to support search engine discovery.

SEO features include:

- Dedicated pages for individual tools.
- Unique page titles and descriptions.
- Structured headings and descriptions.
- Breadcrumb navigation.
- JSON-LD structured data.
- Internal links between related tools and guides.
- Canonical URLs when the public origin is configured.
- Sitemap and robots.txt endpoints.

The public website origin is configured through `MYTHEX_WEB_ORIGIN`. It is not hard-coded into the application.

Canonical and alternate-language metadata are generated as part of the static build and therefore require the correct public origin during deployment.

---

## Project Structure

```text
app/
  layout.tsx
  page.tsx
  not-found.tsx

  [locale]/
    layout.tsx
    page.tsx
    tools/
      page.tsx
      [slug]/
        page.tsx
    account/
    admin/
    blog/
    pricing/
    about/
    contact/
    privacy/
    terms/
    cookies/

  api/
    auth/
    admin/
    history/
    runs/
    tools/
    usage/

components/
  Header.tsx
  Footer.tsx
  ToolCard.tsx
  ToolSearch.tsx
  Breadcrumbs.tsx
  JsonLd.tsx
  LegalPage.tsx
  ThemeToggle.tsx
  tools/

lib/
  admin.ts
  api.ts
  auth.ts
  db.ts
  i18n.ts
  limits.ts
  meta.ts
  plans.ts
  ratelimit.ts
  session.ts
  site.ts
  tools.ts
  usage.ts
  utils.ts

scripts/
  copy-pdf-worker.mjs
  db-report.mjs

tests/
e2e/
.github/
  workflows/
    ci.yml

Dockerfile
next.config.mjs
package.json
```

---

## Getting Started

### Requirements

- Node.js 24 or a compatible supported Node.js version.
- npm.
- PostgreSQL database for account and administration functionality.

### 1. Clone the repository

```bash
git clone https://github.com/Karan7s7n/PrimeUtility.git
cd PrimeUtility
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file:

```bash
cp .env.example .env
```

Configure the following variables:

```env
DATABASE_URL=your_postgresql_connection_string
MYTHEX_WEB_ORIGIN=http://localhost:3000
RATE_LIMIT_SALT=your_random_secret
ADMIN_EMAILS=your_admin_email@example.com
```

Use your own PostgreSQL connection string and generate a strong random value for `RATE_LIMIT_SALT`.

Never commit `.env` or publish database credentials and secrets.

### 4. Start the development server

```bash
npm run dev
```

Open:

`http://localhost:3000`

### 5. Run TypeScript checks

```bash
npm run typecheck
```

### 6. Run unit tests

```bash
npm test
```

### 7. Create a production build

```bash
npm run build
```

### 8. Start the production server

```bash
npm run start
```

---

## Testing and Continuous Integration

PrimeUtility uses Vitest for unit testing and Playwright for browser-based end-to-end testing.

### Unit tests

```bash
npm test
```

The test suite covers:

- Password hashing and verification.
- Authentication and registration.
- Duplicate account and invalid input handling.
- Session management.
- Rate limiting.
- API request-size validation.
- Atomic daily usage allowances.
- File and input limits.
- Tool registry integrity.
- Sitemap dates.
- Utility functions.
- Administrative access and protections.

### End-to-end tests

```bash
npm run test:e2e
```

Playwright tests exercise real browser workflows, including tool operations, authentication, account management, usage allowances, and administrative actions.

The test environment can use an existing server through `E2E_BASE_URL` or start its own server using the configured E2E port.

### Continuous Integration

The GitHub Actions workflow runs on pushes and pull requests.

It includes:

**Verification**
- TypeScript checks.
- Unit tests.
- Production build.

**End-to-end testing**
- PostgreSQL service.
- Production application build.
- Chromium installation.
- Playwright browser tests.

Test traces, screenshots, and HTML reports are uploaded as artifacts when an E2E run fails.

---

## Why Client-Side Processing?

A traditional document-processing platform may upload every file to a backend server before performing an operation.

PrimeUtility takes a different approach wherever browser capabilities allow.

Client-side processing provides several advantages:

1. Files do not need to travel to a processing server.
2. Users retain greater control over their documents.
3. Server infrastructure requirements are reduced.
4. Many operations can run without waiting for a backend response.
5. The platform can support more users without scaling file-processing servers for every request.

PostgreSQL is still used for account management, usage records, and administration, but it is not used to store users' processed files.

---

## Development Roadmap

| Version | Planned or delivered functionality |
|---|---|
| V1 | Core online tools, public pages, responsive interface and SEO |
| V2 | User accounts, usage history, daily allowances and PostgreSQL |
| V3 | Administrative dashboard, role management, tool controls and audit logs |
| V3 Next | Subscription billing, batch processing, advanced PDF operations and AI-powered tools |
| V4 | Public API, API keys, teams and developer usage dashboard |
| V5 | Mobile applications, integrations and marketplace |

### Future Development

Potential additions include:

- Stripe-powered Pro and Business subscriptions.
- Advanced PDF operations such as OCR, splitting, protection and signing.
- Batch-processing workflows.
- AI-assisted tools.
- Public API access.
- Team accounts and integrations.

Payment processing and server-side OCR are not currently part of the live feature set.

---

## Project Status

PrimeUtility currently includes its public tool platform, account system, PostgreSQL-backed usage tracking, and administrative dashboard.

The production build completes successfully with Next.js 15.5.26. The project is being prepared for deployment.

Some planned features, particularly subscription billing and advanced server-side processing, remain under development.

---

## License

All rights reserved. No permission to copy, modify, distribute, or commercially use this project is granted unless explicitly authorized by the copyright holder.

---

**PrimeUtility — Useful tools. Less friction. More control.**
