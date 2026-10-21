# REWEAR — Cloth Donation Management Platform

A full-stack web platform built for **Mangaldham Bahuuddeshiy Samajik Sanstha**, an NGO based in Pune. REWEAR lets donors submit cloth donations online, gives the NGO a complete back-office to sort, inventory and distribute them, and runs an **email-driven approval workflow** so the manager never has to sit in front of the dashboard.

---

## Table of Contents

- [About the NGO](#about-the-ngo)
- [Tech Stack](#tech-stack)
- [What the System Does](#what-the-system-does)
- [The Email Approval Workflow](#the-email-approval-workflow)
- [Donation Lifecycle](#donation-lifecycle)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Demo Accounts](#demo-accounts)
- [Deployment](#deployment)
- [Team & Contributions](#team--contributions)
- [Security Notes](#security-notes)

---

## About the NGO

| | |
|---|---|
| **Name** | Mangaldham Bahuuddeshiy Samajik Sanstha |
| **Address** | Sukhsagar Nagar, Katraj, Pune, Maharashtra |
| **Mobile** | 7219185111 |
| **Email** | vijug0027@gmail.com |

The NGO details are defined **once** in [`lib/constants/ngo-contact.ts`](lib/constants/ngo-contact.ts) and consumed by the contact section, the footer and the site navbar. The location map uses an OpenStreetMap embed (no API key required).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14.2 (App Router, React Server Components, Server Actions) |
| **Language** | TypeScript 5.6 (strict mode) |
| **Styling** | Tailwind CSS 3.4 + shadcn/ui (Radix UI primitives) |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Prisma 5.22 |
| **Auth** | NextAuth v5 (beta) — Credentials provider, JWT sessions |
| **File Storage** | Firebase Cloud Storage |
| **Email** | Nodemailer over SMTP (Resend / Gmail / SendGrid — any relay) |
| **Charts** | Recharts |
| **PDF** | `@react-pdf/renderer` (donation receipts) |
| **Forms** | React Hook Form + Zod |
| **Notifications** | Sonner (toasts) |
| **Icons / Dates / State** | lucide-react · date-fns · Zustand |

### Architecture notes

- **Server Actions** live in `lib/actions/*.actions.ts`, each file carrying a top-level `"use server"` directive.
- **Business logic** is kept out of actions, in `lib/services/`.
- **OOP core** (`lib/core/`) uses abstraction + interfaces with swappable providers:
  - `AppError` / `BaseService` — shared error and service base classes
  - `IStorageProvider` — Firebase Cloud Storage implementation
  - `IEmailProvider` — `SmtpEmailProvider` and `LogEmailProvider`, chosen by a factory
- **Auth is split**: `auth.config.ts` is Edge-safe (used by middleware); `auth.ts` adds the Prisma/bcrypt-dependent Credentials provider. This keeps Prisma out of the Edge bundle.
- **Route protection** is enforced by NextAuth middleware on `/admin/**` and `/donor/**`, plus server-side role guards.

---

## What the System Does

### Public site

| Page | What it does |
|---|---|
| `/` | Landing page — hero, impact stats, **donation image gallery**, **NGO contact section with an interactive map** |
| `/campaigns` | Active donation drives the donor can support |
| `/requirements` | Live "what our communities need right now" list |
| `/impact` | Published impact stories |
| `/track` | Public donation tracking by tracking ID — no login needed |
| `/login`, `/register` | Donor sign-up and sign-in |

### Donor area

| Page | What it does |
|---|---|
| `/donor/dashboard` | Personal stats — total donations, items, in-progress count |
| `/donor/donations` | Full history of the donor's own donations |
| `/donor/donations/new` | **4-step donation form**: Campaign → Items → Details → Review & Submit |
| `/donor/donations/[id]` | Single donation detail, item breakdown and status timeline |
| `/notifications` | In-app notifications (e.g. donation received / rejected) |

### Admin area (NGO staff & admin)

| Page | What it does |
|---|---|
| `/admin/dashboard` | KPI cards — donations this month, items received, inventory value, active requirements, distributions, total donors |
| `/admin/donations` | **Donations Management** — advance status, reject with a reason, copy the donor's tracking link |
| `/admin/inventory` | Stock levels per clothing category, low-stock thresholds |
| `/admin/requirements` | Requirement management (what the NGO needs) |
| `/admin/campaigns` | Create and manage donation campaigns |
| `/admin/distributions` | Record and track distributions to beneficiaries |
| `/admin/beneficiaries` | Beneficiary groups and their needs |
| `/admin/staff` | Staff accounts and module-level assignments |
| `/admin/analytics` | Charts and reports |
| `/admin/audit` | Audit log of system activity |
| `/admin/settings` | Organisation settings (name, contact, receipt colour, etc.) |

### Supporting features

- **Donation receipts** — generated as PDFs via `/api/receipts/[donationId]`
- **Image uploads** — `/api/upload` writes to Firebase Cloud Storage
- **QR codes** — generated per donation
- **Status history** — every status change is recorded with who changed it and why
- **Audit trail** — privileged actions are logged

---

## The Email Approval Workflow

This is the centrepiece feature. The manager approves donations **straight from their inbox — no login required.**

```
Donor submits donation
        │
        ▼
Donation saved to DB  (status: SUBMITTED)
        │
        ▼
Single-use approval token minted  ── only the SHA-256 hash is stored
        │
        ▼
Manager receives an email with Approve / Reject buttons
        │
        ▼
Manager clicks  →  /donations/approval?token=…&action=…
        │
        ▼
Backend atomically claims the token + updates the donation
        │
        ├── Approve → status becomes RECEIVED
        └── Reject  → status becomes REJECTED (+ reason)
        │
        ▼
Donor is emailed the decision  (when an email address is available)
```

**Guarantees implemented:**

- **Single-use** — the token is claimed with a conditional `updateMany` *inside the same transaction* as the status change, so two simultaneous clicks can never both succeed.
- **Expiring** — default lifetime is 7 days (`APPROVAL_TOKEN_TTL_HOURS`).
- **Unforgeable** — only a SHA-256 hash is persisted; the raw token exists solely in the email link.
- **Idempotent** — a donation that already moved past `SUBMITTED` is refused.
- **Non-blocking** — a mail outage never rolls back or blocks an already-saved donation. The failure is reported back to the UI instead.

The email body includes the donor's name, email and phone, the full cloth item breakdown, the pickup address and any notes — everything the manager needs to decide without opening the site.

---

## Donation Lifecycle

```
SUBMITTED → RECEIVED → SORTED → INVENTORY_ADDED → ALLOCATED → DISTRIBUTED → COMPLETED
     │
     └── REJECTED  (at any point, with a reason)
```

Statuses are defined in [`lib/enums.ts`](lib/enums.ts) and the allowed transitions are enforced in [`lib/services/donation.service.ts`](lib/services/donation.service.ts).

---

## Project Structure

```
app/
  (auth)/            login, register
  admin/             NGO back-office (dashboard, donations, inventory, …)
  donor/             donor dashboard, donation list, 4-step donation form
  donations/approval Public token-gated approval page (opened from email)
  api/               auth, upload, receipts
  campaigns/ impact/ requirements/ track/ notifications/ forbidden/
components/
  site/              gallery, NGO contact section
  layout/            public navbar & footer
  ui/                shadcn/ui primitives
lib/
  actions/           "use server" entry points
  services/          business logic (donation, inventory, email, approval, …)
  core/              AppError, BaseService, provider interfaces & factories
  auth/              NextAuth config (edge-safe) + guards
  db/                Prisma singleton
  validations/       Zod schemas
  constants/         NGO contact details
prisma/
  schema.prisma      data model
  migrations/        versioned SQL migrations
  seed.ts            demo data
public/images/       gallery & NGO photos
```

---

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A PostgreSQL database — this project uses [Neon](https://neon.tech) (free tier)
- A Firebase project with Cloud Storage enabled (for image uploads)

### 2. Install

```bash
npm install
```

> `npm install` also runs `prisma generate` automatically via the `postinstall` script.

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` — see the [Environment Variables](#environment-variables) section.

### 4. Set up the database

```bash
npx prisma migrate deploy   # apply migrations
SEED_DEMO_USERS=true npm run seed   # optional: load demo data (development only)
```

> `npm run seed` refuses to create demo accounts unless `SEED_DEMO_USERS=true`
> and `NODE_ENV` is **not** `production`. See [Demo Accounts](#demo-accounts).

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

For a production-like run:

```bash
npm run build
npm start
```

---

## Environment Variables

All variables are documented in [`.env.example`](.env.example) — **never commit `.env`.**

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Pooled Postgres connection used by the app at runtime (Neon `-pooler` host) |
| `DIRECT_URL` | ✅ | Direct (non-pooled) connection used by Prisma migrations |
| `AUTH_SECRET` | ✅ | NextAuth JWT signing secret (`npx auth secret`) |
| `AUTH_URL` | ✅ | Public base URL of the deployment |
| `NEXT_PUBLIC_SITE_URL` | ✅ | **Used to build the Approve/Reject links in emails** |
| `FIREBASE_PROJECT_ID` | ✅ | Firebase service-account `project_id` |
| `FIREBASE_CLIENT_EMAIL` | ✅ | Firebase service-account `client_email` |
| `FIREBASE_PRIVATE_KEY` | ✅ | Service-account `private_key` — one line, literal `\n` escapes |
| `FIREBASE_STORAGE_BUCKET` | ✅ | Storage bucket name, e.g. `my-app.firebasestorage.app` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | ✅ | SMTP relay details |
| `SMTP_USER` / `SMTP_PASSWORD` | ✅ | SMTP credentials |
| `EMAIL_FROM` | ✅ | "From" address on outgoing mail |
| `MANAGER_EMAIL` | ✅ | Inbox that receives approval requests (comma-separated for several) |
| `APPROVAL_TOKEN_TTL_HOURS` | ⬜ | Approval-link lifetime (default `168` = 7 days) |
| `NGO_DISPLAY_NAME` | ⬜ | Display name used inside donor emails |
| `SEED_DEMO_USERS` | ⬜ | Set to `true` to allow demo-account seeding. **Ignored when `NODE_ENV=production`.** |
| `SEED_DEMO_PASSWORD` | ⬜ | Password used for seeded demo users (≥ 8 chars). If unset, a random one is generated. **Never set this in production.** |

**If `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` are left blank, the app runs in
"log mode"** — emails are printed to the server console instead of being sent.
That makes local development possible without a mail account.

### Choosing an email provider

| Provider | SMTP settings |
|---|---|
| **Resend** (recommended) | `smtp.resend.com` · port `465` · secure `true` · user `resend` · password = your API key |
| Gmail | `smtp.gmail.com` · port `465` · secure `true` · user = address · password = **App Password** |
| SendGrid | `smtp.sendgrid.net` · port `587` · secure `false` · user `apikey` · password = your API key |

> ⚠️ Use a **dedicated sending account**. Never use the NGO's public contact address
> (`vijug0027@gmail.com`) as the mail-sending account.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the automated regression suite (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run seed` | Seed the database with demo data (development only) |
| `npx prisma studio` | Browse the database in a GUI |
| `npx prisma migrate dev` | Create and apply a new migration |
| `npx tsc --noEmit` | Type-check without emitting |

---

## Testing

```bash
npm test             # automated regression suite (Vitest, fully mocked)
npm run test:watch   # watch mode
```

The automated suite needs no database, SMTP account or network — every external
dependency is mocked, so it is safe to run anywhere. A full manual walkthrough
(registration → donation → approval) for a local/staging environment, plus the
read-only production checks, is documented in **[docs/TESTING.md](docs/TESTING.md)**.

---

## Demo Accounts

Demo users are **development-only** and are never created automatically. `prisma/seed.ts`
refuses to run unless both conditions hold:

1. `NODE_ENV` is **not** `production`, and
2. `SEED_DEMO_USERS=true` is explicitly set.

If either check fails the script aborts before touching the database. There is no
longer any hardcoded password in the repository — pick one with `SEED_DEMO_PASSWORD`
(≥ 8 chars) or let the script generate a random password, which it prints **once** to
the console when running outside production.

```bash
# development only
SEED_DEMO_USERS=true SEED_DEMO_PASSWORD="$(openssl rand -base64 18)" npm run seed
```

| Role | Email |
|---|---|
| NGO Admin | `admin@rewear.org` |
| NGO Staff | `staff.arjun@rewear.org`, `staff.meera@rewear.org` |
| Donors | `rahul.gupta@gmail.com`, `ananya.singh@gmail.com`, … |

> ⚠️ **Never run the seed against the production database.** Public registration always
> assigns the `DONOR` role server-side — it can never create an `NGO_ADMIN`/`NGO_STAFF`
> account.

### If demo accounts may already exist in production

Earlier versions shipped a shared, publicly known password. Follow this procedure to
check and remediate — **do not delete rows blindly**, and take a backup first.

1. **Identify** — in the Neon SQL editor, list accounts whose email matches the
   documented demo addresses:
   ```sql
   SELECT id, email, role, "createdAt", "updatedAt"
   FROM "User"
   WHERE email IN ('admin@rewear.org','staff.arjun@rewear.org','staff.meera@rewear.org')
      OR email LIKE '%@rewear.org'
   ORDER BY role, email;
   ```
2. **Assess** — for each hit decide whether it is a real staff account or a leftover
   demo login. Check `Donation` rows referencing that `id` before changing anything.
3. **Rotate** — change the password through the normal admin flow (or the password
   hashing helper used by the app, `hashPassword` in `lib/auth/guards.ts`). Never lower
   a real staff account's privileges without the NGO owner's confirmation.
4. **Disable instead of delete** — if the account is unused, prefer keeping the row and
   rotating the password so historic `Donation.donorId` references stay intact. Only
   remove an account once you have confirmed it owns no donations.
5. **Verify** — confirm a login attempt with the old password now fails.

Rotating a password is **manual production work** and is intentionally not automated.

---

## Deployment

The app deploys to **Vercel** with no extra configuration file.

1. Push the repository to GitHub.
2. Import it into Vercel — Next.js is auto-detected.
3. Add every variable from the table above under **Settings → Environment Variables**.
4. Set `NEXT_PUBLIC_SITE_URL` and `AUTH_URL` to your production domain.

### Two things that trip people up

- **Use the pooled connection for `DATABASE_URL` on Vercel.** Serverless functions are
  short-lived and can exhaust direct connections. On Neon the pooled hostname contains
  `-pooler`:
  ```
  postgresql://…@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require
  ```
  Keep `DIRECT_URL` on the non-pooled hostname so Prisma migrations still work.

- **Approval links are built from `NEXT_PUBLIC_SITE_URL`.** If it is not set to the
  public domain, every approval email will link to `localhost:3000` and be dead on arrival.

Initial production setup:

```bash
npx prisma migrate deploy
```

---

## Team & Contributions

| Member | Role | Responsibilities |
|---|---|---|
| **Tanishq Rikame** | **Project Lead & Lead Developer** | Overall architecture and delivery. Built the database schema and Prisma layer, Next.js App Router structure, authentication (NextAuth + role guards), the entire email-based approval workflow, the OOP service/provider core, performance optimisation, and deployment. Wrote the majority of the codebase and reviewed all incoming contributions. |
| **Rudresh** | **UI / UX Designer** | Visual design and front-end polish. Designed the layout system, glassmorphism styling, the responsive donation gallery, the contact section, hover/interaction effects, and helped tune mobile responsiveness and accessibility. |
| **Shubham** | **NGO Liaison & Resource Finder** | Primary point of contact with the NGO manager. Gathered and verified the NGO's official details (name, address, phone, email), collected the organisation's photos used in the gallery, documented real requirements and workflows, and sourced supporting resources for the project. |
| **Raj** | **QA / Tester** | Testing and quality assurance. Prepared test cases, manually exercised every feature end to end with dummy accounts, verified the donation → email → approve/reject → database-update workflow, reproduced bugs and reported them with clear steps, and re-tested fixes before sign-off. |

All three team members supported Tanishq across their respective areas, and Tanishq
reviewed and integrated every contribution into the final codebase.

---

## Security Notes

- `.env` is **git-ignored** — credentials are never committed. `.env.example` contains
  placeholder names only.
- Server secrets (`FIREBASE_PRIVATE_KEY`, SMTP credentials, `AUTH_SECRET`) are used
  exclusively in server code and never exposed to the browser.
- Approval tokens are SHA-256 hashed, single-use and expiring; the raw token only ever
  appears inside the approval email.
- NextAuth middleware guards `/admin/**` and `/donor/**`; server actions additionally
  re-check roles on every call, and donation ownership is derived from the server
  session — never from a client-supplied user id.
- Public registration is hard-coded to the `DONOR` role; the role field is stripped from
  the request by the Zod schema, so a client cannot request a privileged role.
- The public tracking page (`/track`) exposes only the tracking id, current status,
  item count, a masked donor name, and status history — no email, phone, address, notes
  or NGO staff identities.
- Tracking ids are generated server-side with a CSPRNG (`DON-YYYY-XXXXXXXX`) and backed
  by a database unique constraint, so concurrent submissions can never collide.
- Error messages returned to clients are generic; database errors and stack traces are
  logged server-side only. Email bodies (which contain approval tokens) are suppressed
  in production logs.
- Before going live: **rotate the seeded demo password**, use a dedicated mail-sending
  account, and verify a sending domain so mail can reach donors outside your own inbox.

---

**Built for Mangaldham Bahuuddeshiy Samajik Sanstha** — giving clothes a second life, one donation at a time.
