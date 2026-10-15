# REWEAR — Smart NGO Clothing Donation & Resource Management System

## Overview
- **Summary**: A full-stack production-quality web application for managing clothing donation operations for a single NGO. The system handles donation intake, inventory management, beneficiary requirements, distribution tracking, campaign management, impact reporting, and donor transparency features.
- **Purpose**: Transform clothing donations into a trackable, transparent, and efficient resource allocation process. Donors can see impact; NGO staff can manage operations with accountability.
- **Target Users**:
  - **DONOR**: Public users who donate clothing, track donations, and view impact
  - **NGO_ADMIN**: Full operational control and reporting
  - **NGO_STAFF**: Operational processing of donations, inventory, and distributions

## Goals
- Enable donors to register, donate, track donation status end-to-end, and download receipts
- Provide NGO admins with a complete operational dashboard covering donations, inventory, requirements, distributions, campaigns, and analytics
- Allow NGO staff to process donations, manage inventory, and record distributions
- Maintain complete audit trails for all donation status changes and inventory transactions
- Deliver a mobile-responsive, accessible, and production-ready web application with real database-backed UI

## Non-Goals
- Multi-tenant NGO SaaS platform (single NGO only)
- Financial / monetary donation processing (clothing only)
- AI/ML-based recommendation APIs (rule-based only)
- Real-time WebSocket push notifications (polling / page-refresh based status updates acceptable)
- Native mobile apps (responsive web only)
- Internationalization / multi-language support (English only)

## Background & Context
- Project name: REWEAR with tagline "Give clothes a second life."
- Empty repository at `d:\cloth donation Website`
- Google Stitch design project referenced as the visual single-source-of-truth (requires authentication — visual fidelity requirements captured in requirements below)
- User preferences: High-end commercial quality, glassmorphism, smooth animations, mobile responsiveness, Clean Architecture / feature-first folder layout

## Functional Requirements

### Authentication & Authorization
- **FR-1**: Role-based authentication with three roles: DONOR, NGO_ADMIN, NGO_STAFF
- **FR-2**: Registration and login flows using email/password via Auth.js / NextAuth
- **FR-3**: Server-side authorization middleware on all protected routes and API endpoints
- **FR-4**: NGO_ADMIN can manage staff accounts (create, disable, assign roles)
- **FR-5**: Donors see only their own data; staff/admin see operational data

### Donation Management
- **FR-6**: Donor can create a donation by selecting categories, quantities, sizes, conditions, uploading optional images, and entering donor details
- **FR-7**: Each donation receives a unique ID (e.g., DON-YYYY-NNNNNN)
- **FR-8**: Donation status workflow: SUBMITTED → RECEIVED → SORTED → INVENTORY_ADDED → ALLOCATED → DISTRIBUTED → COMPLETED (with REJECTED as alternate terminal state)
- **FR-9**: Every status change creates a DonationStatusHistory record (status, timestamp, changedBy, note)
- **FR-10**: Donor can view donation details and a dynamic timeline of status changes
- **FR-11**: NGO admin/staff can search/filter donations by ID, donor name, category, status, and date
- **FR-12**: Smart recommendation engine compares donor-selected items against NGO requirements and returns HIGH/MEDIUM/LOW match with a reason message

### Inventory Management
- **FR-13**: Inventory items track: Category, Size, Gender/Age, Condition, Qty, Available Qty, Reserved Qty, Distributed Qty, Location, Batch ID
- **FR-14**: All inventory changes go through InventoryTransaction records (RECEIVED, ALLOCATED, DISTRIBUTED, ADJUSTED) with signed quantities
- **FR-15**: Admin/staff can add/edit/remove/search/filter/sort inventory with stock level indicators
- **FR-16**: Low-stock alerts and critical shortage indicators on dashboard

### Requirement Management
- **FR-17**: NGO admin can create requirements with: Category, Required Qty, Priority, Deadline, Description
- **FR-18**: UI dynamically computes fulfilled quantity, remaining = required - fulfilled, progress% = fulfilled/required * 100
- **FR-19**: Requirements reflect relevant inventory and donation data automatically

### Beneficiary & Distribution
- **FR-20**: Privacy-conscious beneficiary group management (aggregated/group records, no public PII)
- **FR-21**: NGO admin creates Distribution Events (name, date, program, location, description) then allocates inventory
- **FR-22**: Completing a distribution transactionally decreases inventory, creates distribution records, updates donation utilization, and updates impact analytics
- **FR-23**: Distributions track items with quantities and link to beneficiary groups

### Campaign Management
- **FR-24**: NGO admin creates campaigns with: Name, Description, Cover Image, Target Qty, Start/End Date, Priority, Status
- **FR-25**: Campaign progress dynamically calculated from associated donations
- **FR-26**: Donors can associate their donations with a campaign during donation creation

### Impact & Public Content
- **FR-27**: NGO admin publishes Impact Stories (Title, Description, Cover, Date, Items Distributed, Program, Optional Stats)
- **FR-28**: Public home page displays NGO requirements, active campaigns, and published impact stories

### Donor Dashboard
- **FR-29**: Total donations count, total items donated, campaigns supported, achievement badges, recent donations list
- **FR-30**: Donation history with filters, detailed view per donation, and status tracking
- **FR-31**: PDF donation receipt download (NGO name, donor name, DON ID, date, items/qty, status)

### NGO Admin Dashboard
- **FR-32**: KPI cards: Total Donations, Items Received, Current Inventory, Pending Processing, Items Distributed, Active Requirements (all database-driven)
- **FR-33**: Charts using Recharts: Monthly Donations, Distribution Trends, Inventory Categories, Requirement vs Inventory, Campaign Progress
- **FR-34**: Recent donations table, critical requirements section, low-inventory alerts
- **FR-35**: Analytics page with: donation trends, monthly volume, category distribution, inventory levels, distribution trends, shortages, campaign performance, reuse statistics

### Notifications
- **FR-36**: In-app notification system with per-user notification records (read/unread)
- **FR-37**: Toast notifications for client-side actions (success, error, loading)
- **FR-38**: System-generated notifications: donation status changes, requirement priority alerts, campaign milestones, admin alerts for new donations and low inventory

### QR Codes
- **FR-39**: QR code generation for Donation IDs and Inventory Batches
- **FR-40**: QR code URL opens the appropriate tracking/detail page for authorized users; no sensitive data embedded in URL

### Search, Filtering, Forms
- **FR-41**: Every searchable domain (donations, inventory, campaigns, requirements) supports search + filter + sort + pagination
- **FR-42**: Every form uses React Hook Form + Zod with client + server validation, loading/success/error states, helpful messages
- **FR-43**: File uploads validate type and size; images use Cloudinary or Supabase Storage (URLs stored in DB, not binary blobs)

### Error Handling & UX
- **FR-44**: Custom 404, Unauthorized, and Forbidden pages; friendly database/network error states; empty states for all data views
- **FR-45**: Loading skeletons, animated progress bars, modal dialogs, confirmation dialogs, optimistic UI where appropriate

## Non-Functional Requirements
- **NFR-1**: Next.js 16+ App Router, TypeScript strict mode, React with Server Components preferred, Server Actions / Route Handlers for backend ops
- **NFR-2**: PostgreSQL with Prisma ORM (fully normalized schema, proper indexes, relations, enums)
- **NFR-3**: Tailwind CSS + shadcn/ui component library + Lucide React icons
- **NFR-4**: Zustand only where client-side global state is genuinely required (URL state + RSC preferred)
- **NFR-5**: Responsive design: desktop, tablet, mobile (donor experience especially mobile-optimized)
- **NFR-6**: Accessibility: semantic HTML, ARIA labels, keyboard nav, visible focus, color contrast, accessible forms/dialogs
- **NFR-7**: Performance: streaming/loading states, pagination, DB indexes, Next.js image optimization, lazy loading, caching where appropriate; avoid fetching entire tables
- **NFR-8**: Security: secure sessions via Auth.js, server-side authz, Prisma injection protection, rate limiting on sensitive public endpoints, env-var secrets, image type/size validation
- **NFR-9**: Clean architecture with feature-first folder structure under `app/`, `components/`, `lib/`, `prisma/`, `public/`, `types/`
- **NFR-10**: Prisma seed script with realistic demo data (1 NGO, 10+ donors, 30+ donations, categories, inventory, requirements, beneficiary groups, distributions, 3 campaigns, impact stories, notifications)
- **NFR-11**: No fake/hardcoded buttons or numbers — every UI element connected to real logic and DB data (except explicit demo seed)
- **NFR-12**: Visual design follows the referenced Google Stitch design exactly for typography, spacing, colors, cards, buttons, navigation, responsiveness, hierarchy

## Constraints
- **Technical**:
  - Single PostgreSQL database (use Prisma)
  - Auth.js / NextAuth for authentication
  - No localStorage as primary persistence
  - No unnecessary microservices
  - No AI API for recommendations (rule-based only)
  - Do NOT introduce libraries outside the specified stack unless unavoidable
- **Business**:
  - One NGO instance only (not multi-tenant SaaS)
  - Clothing donations only (no money)
  - Beneficiary PII never exposed publicly (use group/aggregated records)
  - Role boundaries enforced server-side
- **Dependencies**:
  - Prisma seed for demo data
  - Cloudinary or Supabase Storage for images
  - Recharts for analytics
  - PDF generation library for receipts
  - QR code generation library

## Assumptions
- Local PostgreSQL available (DATABASE_URL env var)
- Developer will configure AUTH_URL, AUTH_SECRET, and OAuth/credential provider secrets in .env
- Cloudinary or Supabase Storage account credentials provided in env vars
- User will deploy independently; no CI/CD required
- Design screens from Google Stitch visually specify: home page, donor flow, donor dashboard, admin dashboard with KPIs + charts, inventory tables, requirements cards, campaign cards, distribution workflow, tracking timeline page, receipt layout, impact stories page

## Acceptance Criteria

### AC-1: Project scaffold runs
- **Type**: `rule`
- **Given**: Fresh clone with `.env` populated
- **When**: `npm install` → `npx prisma generate` → `npx prisma db push` → `npm run dev`
- **Then**: App boots at `http://localhost:3000` with no unhandled errors; seed script populates demo data via `npx prisma db seed`
- **Pass Condition**: All four commands exit 0 and dev server responds
- **Evidence**: Terminal output of each command + HTTP 200 on home page

### AC-2: Database schema fully models all domains
- **Type**: `rule`
- **Given**: Prisma schema and generated DB
- **When**: Inspecting `prisma/schema.prisma` and running `npx prisma validate`
- **Then**: Models exist for User/Role/NGO/Donation/DonationItem/DonationStatusHistory/ClothingCategory/InventoryItem/InventoryTransaction/Requirement/BeneficiaryGroup/Distribution/DistributionItem/Campaign/CampaignDonation/ImpactStory/Notification/DonationReceipt/StaffAssignment/AuditLog; enums for UserRole/DonationStatus/ClothingCondition/Priority/InventoryStatus/DistributionStatus/CampaignStatus; all required relations and indexes
- **Pass Condition**: `prisma validate` passes and all listed entities/enums present
- **Evidence**: `prisma validate` output + schema file content

### AC-3: Role-based authz enforced server-side
- **Type**: `rule`
- **Given**: Three users with DONOR / NGO_ADMIN / NGO_STAFF roles
- **When**: A donor attempts to access `/admin/*` or mutate inventory/requirements/distributions; staff attempts admin-only actions (manage staff/settings)
- **Then**: Server returns 403/redirects to Forbidden; corresponding DB writes rejected even if client tampered
- **Pass Condition**: Protected endpoints return 403 for unauthorized roles in Postman/curl test
- **Evidence**: HTTP 403 responses recorded for cross-role access attempts

### AC-4: Donation lifecycle with history and QR
- **Type**: `rule`
- **Given**: Logged-in donor
- **When**: Donor creates donation → admin advances status through SUBMITTED→RECEIVED→SORTED→INVENTORY_ADDED→ALLOCATED→DISTRIBUTED→COMPLETED
- **Then**: Unique DON-* ID generated; each step creates DonationStatusHistory row; timeline page renders all steps with time/changer/note; QR code links to tracking URL
- **Pass Condition**: Donation record exists with 7+ history rows, timeline page displays ordered statuses, QR scan opens tracking
- **Evidence**: DB query of Donation + DonationStatusHistory + screenshot of timeline + QR decode

### AC-5: Smart recommendation scores
- **Type**: `rule`
- **Given**: A HIGH-priority Requirement for "Children's Jackets" with large shortage + urgent deadline
- **When**: Donor selects Category=Children's Jacket in donation form
- **Then**: System returns HIGH MATCH with a message like "Children's jackets are currently a HIGH PRIORITY requirement."
- **Pass Condition**: Recommendation service returns HIGH for matching high-priority shortage, MEDIUM for partial match, LOW for no match
- **Evidence**: Recommendation function output for 3 distinct scenarios (HIGH/MEDIUM/LOW) + DB state

### AC-6: Inventory transactions and audit
- **Type**: `rule`
- **Given**: InventoryItem row for a category with qty=50
- **When**: ALLOCATE 20 and then DISTRIBUTE 20 occur via service functions
- **Then**: Available qty=30 after allocation; Distributed qty=20 after distribution; two InventoryTransaction rows with +/− signed qty and type=ALLOCATED/DISTRIBUTED
- **Pass Condition**: Final numbers correct, both transactions present
- **Evidence**: DB select of InventoryItem + InventoryTransaction before/after

### AC-7: Requirement progress computed dynamically
- **Type**: `rule`
- **Given**: Requirement(required=200) + donations/inventory summing to 124 fulfilled
- **When**: Loading requirement detail page
- **Then**: Displayed remaining=76, progress=62.0% (from live DB, not hardcoded)
- **Pass Condition**: Math verified server-side in rendered HTML/JSON payload
- **Evidence**: Server log or API JSON showing computed values from aggregate query

### AC-8: Distribution completes transactionally
- **Type**: `rule`
- **Given**: Distribution event with 50 jackets allocated from inventory
- **When**: Mark distribution COMPLETED while a service layer error is simulated on step 3 of 4
- **Then**: Transaction rolls back (inventory unchanged, no distribution rows); on retry without error, both inventory decrease and distribution records + impact updates all persist
- **Pass Condition**: Partial-failure scenario leaves DB consistent; success scenario shows all 4 updates
- **Evidence**: DB state after failure rollback + after success

### AC-9: Campaign progress from live donations
- **Type**: `rule`
- **Given**: Campaign with target=500; 382 items associated via CampaignDonation
- **When**: View campaign detail page
- **Then**: Progress bar/metric shows 76.4% from live aggregate
- **Pass Condition**: Value matches SUM(campaign_donations.items_qty)/target * 100
- **Evidence**: DB aggregate + rendered page value

### AC-10: Donor dashboard KPIs scoped to own data
- **Type**: `rule`
- **Given**: Donor A with 5 donations totaling 23 items; Donor B with 3 donations totaling 9 items
- **When**: Donor A views donor dashboard
- **Then**: "Total donations"=5, "Total items donated"=23; no rows from Donor B visible in history
- **Pass Condition**: KPIs match donor's own count, other donor data absent from SQL results
- **Evidence**: Raw SQL WHERE-clause + dashboard screenshots

### AC-11: Admin dashboard KPIs + charts from DB
- **Type**: `rule`
- **Given**: Seeded demo data
- **When**: NGO admin loads admin dashboard + analytics page
- **Then**: All 6 KPI cards match aggregate queries, Recharts render with non-empty datasets, no values are hardcoded literals
- **Pass Condition**: Each KPI SQL aggregate matches displayed value
- **Evidence**: SQL queries and their results matched to dashboard numbers + chart screenshot

### AC-12: PDF receipt generation
- **Type**: `rule`
- **Given**: Completed donation with donor + items
- **When**: Donor clicks "Download Receipt"
- **Then**: Browser downloads a PDF containing NGO name, donor name, DON ID, date, items/qty, status; PDF is viewable/valid
- **Pass Condition**: PDF opens; all listed fields present
- **Evidence**: PDF file hash/screenshot containing required fields

### AC-13: In-app notifications trigger and mark read
- **Type**: `rule`
- **Given**: Donor creates donation DON-001
- **When**: Admin marks it RECEIVED → donor refreshes notifications bell
- **Then**: Donor sees unread notification "Your donation DON-001 has been received"; clicking marks as read; toast appears on donor's next page load if page was open
- **Pass Condition**: Notification row created + read toggled correctly
- **Evidence**: DB Notification rows + UI bell indicator

### AC-14: Search, filter, sort, pagination on donations/inventory
- **Type**: `rule`
- **Given**: 30+ donations and inventory rows in seed
- **When**: Search by partial DON ID, filter by status=RECEIVED, sort by date desc, page size=10
- **Then**: Results match filter, order correct, pagination metadata (page count/current) accurate
- **Pass Condition**: Filtered/sorted SQL output matches UI
- **Evidence**: API JSON response vs SQL query output

### AC-15: Form validation client + server
- **Type**: `rule`
- **Given**: Donation form (or any form) with React Hook Form + Zod
- **When**: Submitting with: (a) all empty; (b) qty=−5; (c) category=nonexistent; (d) valid payload
- **Then**: (a) field error messages displayed; (b) invalid qty error; (c) server-side invalid category error; (d) successful DB insert with 201/200 response
- **Pass Condition**: 4 scenarios behave as specified
- **Evidence**: Screenshots of validation errors + successful submit DB row

### AC-16: File upload validation
- **Type**: `rule`
- **Given**: Donation image upload field
- **When**: Uploading: (a) 10 MB .exe; (b) 15 MB PNG; (c) valid 2 MB JPEG
- **Then**: (a) invalid type rejected; (b) size exceeded rejected; (c) uploaded to Cloudinary/Supabase, URL stored, DB DonationItem.imageUrl set
- **Pass Condition**: 3 scenarios behave correctly
- **Evidence**: Error messages + image URL in DonationItem row

### AC-17: All error pages and empty states render
- **Type**: `rule`
- **Given**: Running app
- **When**: Navigate to `/nonexistent`; try forbidden route as donor; navigate to donations list with 0 items; kill DB and refresh admin dashboard
- **Then**: 404 page; Forbidden/403 page; "No donations yet" empty state; friendly error message (no stack trace)
- **Pass Condition**: All four states render correctly
- **Evidence**: Screenshots of each

### AC-18: Seed data meets minimum volume
- **Type**: `rule`
- **Given**: `npx prisma db seed` executed on fresh DB
- **When**: Query counts
- **Then**: NGO=1, Users>=13 (1 admin+2 staff+10 donors), Donations>=30, Campaigns=3, plus inventory/requirements/beneficiaries/distributions/impact_stories/notifications present
- **Pass Condition**: Counts met
- **Evidence**: `SELECT count(*)` output for each entity

### AC-19: Responsive + accessible
- **Type**: `rubric`
- **Dimension**: Responsive design and accessibility quality
- **Scale**: 1-5
- **Anchors**: 1 = desktop-only, broken forms; 3 = tablet layout rough, no focus states; 5 = desktop/tablet/mobile all pixel-perfect, donor flow mobile-optimized, semantic HTML, keyboard-navigable, visible focus rings, no horizontal overflow, Lighthouse a11y score ≥90
- **Pass Threshold**: >= 4
- **Evidence**: Chrome DevTools device emulation screenshots at 375px / 768px / 1440px + Lighthouse a11y score

### AC-20: Visual design fidelity
- **Type**: `rubric`
- **Dimension**: Design fidelity to referenced Stitch UI (typography, spacing, colors, glassmorphism, cards, nav, animations, charts, icons)
- **Scale**: 1-5
- **Anchors**: 1 = raw unstyled HTML; 3 = generic shadcn look, minimal custom styling; 5 = every screen matches design spacing/color/typography, glassmorphism effects applied where spec'd, smooth micro-animations on state changes, image placeholders use design-matching photo prompt, component consistency across pages
- **Pass Threshold**: >= 4
- **Evidence**: Screenshots of home, donor dashboard, admin dashboard, donation form, tracking page compared against design intent description (glassmorphism, mobile-optimized, polished)

### AC-21: Architecture cleanliness & code quality
- **Type**: `rubric`
- **Dimension**: Architecture, type safety, and code organization
- **Scale**: 1-5
- **Anchors**: 1 = everything in app/route files, no types; 3 = basic separation but logic tangled in components; 5 = clean feature-first folders, services layer for biz logic, Prisma transactions for multi-record ops, strict TypeScript (no `any`), reusable components, env vars for secrets, lib/auth + lib/db + lib/validations + lib/services + lib/utils folders followed
- **Pass Threshold**: >= 4
- **Evidence**: Folder tree screenshot + grep for `: any` count + sample service function with Prisma transaction

## Open Questions
- [ ] Stitch design requires Google auth. Are design screenshots available as files to match exact layouts? If not, implementation will follow the stated intent: glassmorphism, high-end commercial look, mobile-optimized.
- [ ] Which file storage provider? Spec allows Cloudinary or Supabase Storage. Default choice: **Supabase Storage** (closer to Postgres stack); override if you prefer Cloudinary.
- [ ] Do you need social login providers (Google, Facebook) or just email/password Credentials provider? Default choice: **Credentials only**; add social providers if requested.
- [ ] PDF library preference: `@react-pdf/renderer` (React-friendly) vs `pdfkit` (imperative). Default choice: **@react-pdf/renderer**.
- [ ] QR library preference: `qrcode` (canvas/svg output). Default choice: **qrcode**.
