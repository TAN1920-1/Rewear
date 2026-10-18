# Testing Guide

This document explains how to verify the Rewear registration → donation → approval
workflow. It is split into three layers:

| Layer | What it is | Where it runs | Safe against production? |
|---|---|---|---|
| **A. Automated regression tests** | Vitest unit/integration tests with every external dependency mocked | Your machine / CI | ✅ Yes — no network, no database, no email |
| **B. Local end-to-end (E2E)** | Manual walkthrough of the real app against a **separate test database** | Local or a staging deploy | ⚠️ Only against a test database — **never** the production Supabase project |
| **C. Manual production checks** | Read-only verification on the live deployment | `https://rewear-rust.vercel.app` | ✅ Read-only only |

> **Never point `DATABASE_URL` at production while running layer B.** Do not reseed,
> truncate or migrate the production database to make a test pass.

---

## A. Automated regression tests

### How to run

```bash
npm install          # first time only
npm test             # single run
npm run test:watch   # watch mode while developing
```

The suite uses **Vitest 2** with `environment: "node"`. Config lives in
[`vitest.config.ts`](../vitest.config.ts) and tests live in [`tests/`](../tests).
The `@/*` alias mirrors the one in `tsconfig.json`.

**No environment variables, database, SMTP account or network access is required.**
`next/headers`, `next/cache`, `@/lib/auth/guards`, `@/lib/db/prisma`, the rate limiter
and the email provider are all replaced with `vi.mock` stubs. Nothing is written to any
database and no email is ever sent.

Some tests deliberately provoke failures, so you will see `console.error` output such as
`relation "Donation" does not exist` or `Cannot advance from X to Y` on stderr. That is
expected output from the code under test, **not** a failing test — the summary line is
what matters.

### What is covered

| File | Area | Examples |
|---|---|---|
| [`tests/seed-guard.test.ts`](../tests/seed-guard.test.ts) | Demo seeding | refuses production even with the flag set; refuses without opt-in; allows only non-prod + flag; generated password is random and never the old shared value |
| [`tests/donation-id.test.ts`](../tests/donation-id.test.ts) | Tracking IDs | `DON-YYYY-XXXXXXXX` format; no ambiguous `0/O/1/I/L`; 5 000 concurrent generations all unique; P2002 detection |
| [`tests/auth-schema.test.ts`](../tests/auth-schema.test.ts) | Validation | valid registration; invalid email rejected; weak password rejected; password/confirm mismatch; injected `role` field is stripped |
| [`tests/auth-actions.test.ts`](../tests/auth-actions.test.ts) | Auth actions | registration always assigns `DONOR`; injected `NGO_ADMIN` ignored; duplicate email; invalid credentials; rate-limit message |
| [`tests/donation-actions.test.ts`](../tests/donation-actions.test.ts) | Donation creation | unauthenticated rejected; empty/invalid items rejected; `donorId` taken from the session; items + initial status history persisted; 50 concurrent submissions produce unique IDs; retry on collision; email failure still succeeds exactly once; DB errors not leaked |
| [`tests/authorization.test.ts`](../tests/authorization.test.ts) | Admin authorization | unauthenticated/donor/staff-without-NGO blocked; admin scoped to own `ngoId`; unknown status rejected; safe error message |
| [`tests/donation-ownership.test.ts`](../tests/donation-ownership.test.ts) | Ownership | owner allowed; cross-donor denied; anonymous denied |
| [`tests/track.test.ts`](../tests/track.test.ts) | Public tracking | minimal field set only; no email/phone/address/notes/NGO/staff names; donor name masked; ID normalised; throttled |
| [`tests/log-email-provider.test.ts`](../tests/log-email-provider.test.ts) | Log hygiene | log provider prints the body in development, suppresses it in production |
| [`tests/approval-error-hygiene.test.ts`](../tests/approval-error-hygiene.test.ts) | Approval link | curated messages surfaced; raw database errors replaced with a generic message |

### Type-check and lint

```bash
npx tsc --noEmit
npm run lint
```

---

## B. Local end-to-end walkthrough (13 steps)

Run this against a **dedicated test database** (a second Supabase project, or a local
Postgres). Use a unique test email every time so runs never collide.

### 1. Start the app with test environment variables

```bash
cp .env.example .env      # then fill in the TEST database URLs
npm run dev
```

Points to watch:

- `DATABASE_URL` / `DIRECT_URL` must point at the **test** database.
- Leave `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` **blank** to run in *log mode* —
  emails are printed to the terminal instead of being sent. This is the recommended mode
  for E2E testing and guarantees you cannot mail a real donor.
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000` so approval links are clickable locally.

Optional: load demo data (development only).

```bash
SEED_DEMO_USERS=true npm run seed
```

### 2. Register a new donor with a unique test email

Open <http://localhost:3000/register> and submit a unique address, e.g.
`e2e.donor.<timestamp>@example.com`, with a ≥ 8-character password.

**Expected:** the account is created and assigned the `DONOR` role. Registration is
rate-limited (see `RegisterSchema` / `enforceRateLimit`); repeated attempts should be
rejected with a retry-after message rather than allowing unlimited sign-ups.

### 3. Log in with that donor

Open <http://localhost:3000/login>. A wrong password must fail with a generic
"invalid credentials" message that does not reveal whether the email exists.

### 4. Submit a test clothing donation

Go to <http://localhost:3000/donor/donations/new>. Add at least one item with a valid
category, a size, a condition and a quantity ≥ 1, then submit.

### 5. Verify the tracking ID appears in the success response

**Expected:** the success panel shows a tracking ID of the form `DON-2026-XXXXXXXX`
(random suffix). It must match the value stored in the database — the frontend no longer
reconstructs it from the numeric row id.

### 6. Confirm the donation, its items and initial status history exist

In the test database:

```sql
SELECT id, "donationId", "donorId", "totalItems", "currentStatus", "createdAt"
FROM "Donation"
ORDER BY id DESC
LIMIT 5;

SELECT * FROM "DonationItem" WHERE "donationId" = <id>;
SELECT * FROM "DonationStatusHistory" WHERE "donationId" = <id>;
```

**Expected:** one `Donation` row with `currentStatus = 'SUBMITTED'`, one `DonationItem`
row per submitted line, and one `DonationStatusHistory` row with status `SUBMITTED`.
There must be **no orphaned items**. The `donorId` must equal the logged-in user's id.

### 7. Open the donor dashboard

<http://localhost:3000/donor/dashboard> — the new donation appears in the list.

### 8. Verify the tracking page

Copy the tracking ID into <http://localhost:3000/track>.

**Expected:** the status, item count and a *masked* donor name (e.g. `Rahul G.`) are
shown. The page must **not** show the donor's email, phone, pickup address, notes, the
NGO id, or any staff member's name.

### 9. Test the NGO approval / rejection workflow

With SMTP in log mode, submitting a donation prints the manager notification (including
the Approve / Reject links) to the terminal. Copy a link and open it, or browse to:

```
http://localhost:3000/donations/approval?token=<token>&action=approve
http://localhost:3000/donations/approval?token=<token>&action=reject
```

**Expected:** approving moves the status to `RECEIVED`; rejecting moves it to `REJECTED`
and records a rejection reason.

Then **re-open the same link**. It must be refused with a message saying the link has
already been used or expired — the token is single-use and is claimed atomically, so two
simultaneous clicks can never both succeed.

### 10. Verify status history and email outcomes

```sql
SELECT status, note, "changedBy", "createdAt"
FROM "DonationStatusHistory"
WHERE "donationId" = <id>
ORDER BY "createdAt";
SELECT * FROM "DonationApprovalToken" WHERE "donationId" = <id>;
```

**Expected:** history shows `SUBMITTED` → `RECEIVED`/`REJECTED`. The token row has a
non-null `usedAt`. In log mode you should also see the donor notification printed to the
terminal. A donation whose manager email failed to send must **still exist exactly once**
with status `SUBMITTED` — email failure must never duplicate or roll back a donation.

### 11. Confirm one donor cannot access another donor's data

Log out, register a **second** donor, and log in as them. Then try:

- <http://localhost:3000/donor/donations/<first-donor-donation-id>

**Expected:** a 404 — ownership is derived from the session, not from the URL.

### 12. Test concurrent submissions

Submit two donations back-to-back (two tabs, or:

```bash
curl ... & curl ... & wait
```

against the server action, or simply double-click submit). Then:

```sql
SELECT "donationId", COUNT(*) FROM "Donation" GROUP BY "donationId" HAVING COUNT(*) > 1;
```

**Expected:** zero rows. Every `donationId` is unique thanks to the `Donation_donationId_key`
unique index plus the bounded-retry generator.

### 13. Confirm validation and service failures are handled gracefully

- Submit with **no items** → friendly "add at least one item" message, no row written.
- Submit with **quantity 0** or an **unknown category** → rejected, no row written.
- Stop the database (or point `DATABASE_URL` at a bad host) and submit → a generic
  "Failed to submit donation. Please try again." No stack trace, SQL or connection string
  is shown to the user; the detail is only in the server log.
- Submit while logged out → "Authentication required."

---

## C. Manual production checks (read-only)

These are the only checks that should ever touch the live site. **Read-only.**

1. **Demo accounts** — list accounts at `@rewear.org` (SQL in
   [README → Demo Accounts](../README.md#demo-accounts)) and confirm none is reachable
   with the old shared password. Rotate any that are; do not delete rows blindly.
2. **`SEED_DEMO_USERS` must not be set in Vercel.** With it unset, `npm run seed` cannot
   create demo users at all, and `NODE_ENV=production` blocks it regardless.
3. **Approval links** — trigger a real donation and confirm the emailed link points at
   the production domain (this depends on `NEXT_PUBLIC_SITE_URL`).
4. **Tracking page** — confirm `/track` returns only the minimal fields and that an
   unknown ID returns "not found" rather than an error.
5. **Registration** — register a throwaway account and confirm you land as a donor with
   no access to `/admin/**`.

Items **not verifiable from this environment**: anything requiring the production
Supabase credentials, the production mail account, or an interactive browser session.
Those must be executed by the project owner and are reported as *not verified* until
observed.

---

## Related documents

- [README](../README.md) — setup, environment variables, deployment.
- [`.env.example`](../.env.example) — every variable with comments.
