# REWEAR — Smart NGO Clothing Donation & Resource Management System - Implementation Plan

## Task 1: Initialize Next.js 16+ project with core tech stack
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Create Next.js 16 App Router project with TypeScript strict mode
  - Install and configure Tailwind CSS, shadcn/ui, Lucide React
  - Install Zod, React Hook Form, Prisma, @prisma/client, Auth.js (NextAuth v5), Zustand
  - Install Recharts, @react-pdf/renderer, qrcode
  - Create base folder structure: app/, components/, lib/auth/, lib/db/, lib/validations/, lib/services/, lib/utils/, lib/recommendations/, prisma/, public/, types/
  - Create .env.example with DATABASE_URL, AUTH_URL, AUTH_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STORAGE_BUCKET, NEXT_PUBLIC_SITE_URL
  - Run shadcn/ui init and add core components: button, card, input, label, dialog, toast, table, tabs, badge, progress, select, dropdown-menu, avatar, separator, pagination, skeleton, form, textarea, tooltip, sheet, alert, accordion
- **Acceptance Criteria Addressed**: AC-1, NFR-1, NFR-2, NFR-3, NFR-9
- **Test Requirements**:
  - `rule` TR-1.1: `npm install` exits 0; `npx tsc --noEmit` passes
  - `rule` TR-1.2: All target folders exist; shadcn components importable; `next dev` boots on :3000
  - `rule` TR-1.3: TypeScript strict enabled in tsconfig.json; no `any` in scaffolded files
- **Notes**: Use Supabase Storage as default per spec open question default.

## Task 2: Prisma schema + seed script
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - Write prisma/schema.prisma with all entities: User, Role (embedded enum UserRole), NGO, Donation, DonationItem, DonationStatusHistory, ClothingCategory, InventoryItem, InventoryTransaction, Requirement, BeneficiaryGroup, Distribution, DistributionItem, Campaign, CampaignDonation, ImpactStory, Notification, DonationReceipt, StaffAssignment, AuditLog
  - Add enums: UserRole(DONOR,NGO_ADMIN,NGO_STAFF), DonationStatus(SUBMITTED,RECEIVED,SORTED,INVENTORY_ADDED,ALLOCATED,DISTRIBUTED,COMPLETED,REJECTED), ClothingCondition(NEW,LIKE_NEW,GOOD,FAIR,POOR), Priority(LOW,MEDIUM,HIGH,CRITICAL), InventoryStatus(IN_STOCK,LOW_STOCK,OUT_OF_STOCK,RESERVED), DistributionStatus(DRAFT,ALLOCATED,IN_PROGRESS,COMPLETED,CANCELLED), CampaignStatus(DRAFT,ACTIVE,PAUSED,COMPLETED,ARCHIVED)
  - Add all relations, unique indexes, createdAt/updatedAt timestamps
  - Write prisma/seed.ts with: 1 NGO, 13+ Users, 30+ Donations w/ items and status history, ClothingCategories, InventoryItems with transactions, Requirements, BeneficiaryGroups, Distributions with items, 3 Campaigns w/ campaign donations, ImpactStories, Notifications
  - Register seed in package.json (`"prisma": {"seed": "tsx prisma/seed.ts"}`)
- **Acceptance Criteria Addressed**: AC-2, AC-18, NFR-2, NFR-10
- **Test Requirements**:
  - `rule` TR-2.1: `npx prisma validate` passes; `npx prisma db push` on fresh DB exits 0
  - `rule` TR-2.2: All entities and enums present in schema.prisma with correct relations
  - `rule` TR-2.3: `npx prisma db seed` exits 0; counts meet minimums (Users>=13, Donations>=30, Campaigns=3)
  - `rubric` TR-2.4: Schema normalization quality; scale 1-5, anchors: 1=denormalized repeated fields, 3=mostly normalized but missing indexes, 5=3NF, all FK indexed, composite unique indexes where needed; threshold >= 4; evidence: `prisma format` output

## Task 3: Auth.js (NextAuth v5) setup with Credentials provider + role middleware
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - Configure NextAuth v5 with Credentials provider (email/password) using Prisma adapter
  - Password hashing via bcryptjs; session strategy "jwt" or "database" with Prisma
  - Extend session JWT with user.id, user.role, user.ngoId
  - Write `lib/auth/auth.ts` with auth config and `auth()` export
  - Write `middleware.ts` protecting: `/donor/*` (DONOR+), `/admin/*` (NGO_ADMIN or NGO_STAFF per specific routes; staff-only and admin-only distinction)
  - Build `/app/login/page.tsx`, `/app/register/page.tsx` forms with RHF + Zod validation (server actions for register/login)
  - Build unauthorized/forbidden page at `/app/(auth)/forbidden/page.tsx` and 404 global not-found
  - Implement role guard server helper `requireRole(...roles)` that throws or redirects
- **Acceptance Criteria Addressed**: AC-1, AC-3, FR-1 through FR-5, NFR-8
- **Test Requirements**:
  - `rule` TR-3.1: Register/create three users (donor/admin/staff) via register endpoint; login returns session with correct role claim
  - `rule` TR-3.2: Donor GET /admin/dashboard → 403/redirect; Staff GET /admin/staff → 403 if admin-only; Admin succeeds
  - `rule` TR-3.3: Server action mutation for inventory CREATE fails with 401 when called without session; called by donor returns 403
  - `rule` TR-3.4: Login form empty submission → validation errors; wrong password → auth error; valid credentials → session set

## Task 4: Core service layer + lib utilities
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3
- **Description**:
  - `lib/db/prisma.ts`: Singleton PrismaClient export with dev global cache
  - `lib/utils/cn.ts`: tailwind-merge + clsx helper; formatDate/generateId helpers
  - `lib/validations/*.ts`: Zod schemas for: donation create, donation status update, inventory create/edit, requirement create/edit, beneficiary create, distribution create, campaign create, impact create, user create, notification mark-read
  - `lib/services/donation.service.ts`: createDonation, getDonationById, advanceDonationStatus (tx: inserts history, optionally calls inventory allocate/distribute), searchDonations, getDonorDonations, getRecommendationForItem
  - `lib/services/inventory.service.ts`: addInventoryItem, adjustInventory (tx: creates InventoryTransaction, updates qtys), searchInventory, allocateToDistribution, releaseAllocation
  - `lib/services/requirement.service.ts`: createRequirement, computeFulfilledQty (aggregate matching donations/inventory), listRequirementsWithProgress
  - `lib/services/distribution.service.ts`: createDistribution, allocateItems (tx: reserve inventory), completeDistribution (tx: finalize inventory decrease, distribution mark COMPLETED, update donations ALLOCATED→DISTRIBUTED, update impact stats)
  - `lib/services/campaign.service.ts`: createCampaign, associateDonationToCampaign, computeCampaignProgress
  - `lib/services/notification.service.ts`: createNotification, markAsRead, listForUser; toast wrapping helper
  - `lib/recommendations/recommend.ts`: Rule-based scoring: (priority weight * shortage ratio * 2 if matching size) + deadline urgency bonus; return HIGH/MEDIUM/LOW with reason string
  - `lib/services/pdf.service.ts`: generateDonationReceiptPDF using @react-pdf/renderer with NGO name, donor, DON id, date, items, status, footer
  - `lib/services/qr.service.ts`: generateQRDataURL(text) for DON id and batch ids
- **Acceptance Criteria Addressed**: AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-12, FR-6 through FR-40
- **Test Requirements**:
  - `rule` TR-4.1: `createDonation` returns record with DON-YYYY-NNNNNN id and SUBMITTED status history row
  - `rule` TR-4.2: `advanceDonationStatus(x, RECEIVED)` creates history; calling `INVENTORY_ADDED` creates InventoryTransaction + InventoryItem (via service)
  - `rule` TR-4.3: recommendation HIGH returned for high-priority shortage category
  - `rule` TR-4.4: `adjustInventory` always creates InventoryTransaction row; direct Prisma inventory update forbidden in UI layers
  - `rule` TR-4.5: `completeDistribution` rolls back all writes if any step fails (inject throw on 2nd step to verify)
  - `rule` TR-4.6: `generateDonationReceiptPDF` returns Buffer of valid PDF with 5 required fields present when parsed
  - `rule` TR-4.7: `generateQRDataURL("DON-2026-000124")` returns valid data:image/png;base64,...

## Task 5: Public home page + public content (requirements, campaigns, impact stories)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4
- **Description**:
  - `/app/page.tsx`: Public landing (glassmorphism hero with REWEAR logo + "Give clothes a second life." CTA buttons: Donate Now / Track Donation / Sign In)
  - Hero section with image banner, feature highlights (3 cards: Track Impact, Trusted Transparency, Smart Matching)
  - Requirements overview section: top 5 active requirements with progress bar, priority badge, deadline
  - Active campaigns section: 3 campaign cards with cover, target progress %, date range
  - Impact stories carousel/list: published stories with cover, title, excerpt, items count
  - Footer, navbar (public), responsive mobile menu via shadcn sheet
  - `/app/requirements/page.tsx`: public paginated requirement list with filter by category/priority
  - `/app/campaigns/page.tsx`: public paginated campaign list with filter by status
  - `/app/impact/page.tsx`: public published impact stories grid with detail pages
  - `/app/track/page.tsx`: anonymous donation tracking by DON id (input → redirects to tracking detail if found, else error state)
  - Dynamic OG images / metadata for SEO
- **Acceptance Criteria Addressed**: AC-9, AC-17, AC-19, AC-20, FR-17, FR-19, FR-24 through FR-28
- **Test Requirements**:
  - `rule` TR-5.1: Home page renders all sections with live seed data (3 campaigns visible, requirements show non-hardcoded progress%)
  - `rule` TR-5.2: /track?don=DON-EXISTING → shows timeline; invalid id → friendly error
  - `rule` TR-5.3: Public pages have empty states for 0 campaigns/requirements/stories
  - `rubric` TR-5.4: Visual polish; scale 1-5 anchors: 1=plain HTML, 3=basic Tailwind, 5=glassmorphism hero, gradient accents, smooth hover, responsive at 375/768/1440; threshold >= 4

## Task 6: Donor auth routes (dashboard, create donation, history, tracking, receipt)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 5
- **Description**:
  - `/app/donor/page.tsx`: Donor dashboard with KPIs (Total donations, Total items, Campaigns supported, Badges list), Recent donations table, Create Donation CTA
  - Badge logic: Seed badges, Bronze(1-5 items), Silver(6-20), Gold(21-50), Platinum(51+); also First Donation, Campaign Supporter
  - `/app/donor/donations/new/page.tsx`: Multi-step create-donation wizard: Step1 select campaign (optional), Step2 add items (category, size, qty, condition, image upload), Step3 donor info (prefill if logged in), Step4 review with recommendation badges, Step5 submit (confirmation with DON id + QR)
  - Image upload via route handler `/app/api/upload/route.ts` → Supabase Storage (validate type: jpg/png/webp, max size: 5MB)
  - `/app/donor/donations/page.tsx`: Donor history with search/filter (by date, status) + pagination + row click to detail
  - `/app/donor/donations/[donationId]/page.tsx`: Detail view with status timeline (vertical stepper with dates/changer/notes), items list with images, associated campaign, QR code display, "Download Receipt" button (only when donation status >= RECEIVED)
  - Receipt download server action: calls pdf.service and returns `application/pdf` response with filename `REWEAR-RECEIPT-{donId}.pdf`
  - In-app notification bell in donor nav: click opens dropdown, marks as read, links to related content
- **Acceptance Criteria Addressed**: AC-4, AC-10, AC-12, AC-13, AC-15, AC-16, FR-6 through FR-12, FR-29 through FR-31, FR-36, FR-39
- **Test Requirements**:
  - `rule` TR-6.1: Donor dashboard KPIs match donor-scoped counts (SQL verified)
  - `rule` TR-6.2: Create donation wizard validates qty > 0; rejects missing required fields; valid submit → DON id generated + confirmation + SUBMITTED notification for donor, "New donation" for admin
  - `rule` TR-6.3: Download receipt → PDF valid with required fields (see AC-12)
  - `rule` TR-6.4: Upload 10MB .exe → rejected with invalid-type error; valid 2MB JPEG → DonationItem.imageUrl set
  - `rule` TR-6.5: After admin advances status → donor sees new notification unread; clicking marks read

## Task 7: Admin/staff dashboard (KPIs, charts, analytics)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 6
- **Description**:
  - Sidebar navigation (admin vs staff menus): Dashboard, Donations, Inventory, Requirements, Beneficiaries, Distributions, Campaigns, Impact, Analytics, Staff (admin only), Settings (admin only)
  - `/app/admin/page.tsx`: KPI cards: Total Donations, Items Received, Current Inventory, Pending Processing, Items Distributed, Active Requirements — each with delta sparkline or % change vs prior period
  - Recent donations data table (10 rows, columns: Don ID, Donor, Items, Status, Date, Actions)
  - Critical requirements section: Top 5 highest priority requirements with shortage badges
  - Low inventory alerts section: Items where available qty < reorder threshold (use category-specific thresholds)
  - Recharts charts: Monthly Donations Bar, Distribution Trends Line, Inventory Categories Pie, Requirement vs Inventory Grouped Bar, Campaign Progress Horizontal Bar
  - `/app/admin/analytics/page.tsx`: Full analytics page with all the charts + reuse statistics (total clothes saved from landfill = total distributed; kg CO2 avoided estimate using 2.5 kg per item factor), export CSV button for analytics data
  - Dashboard + analytics use server components with streaming suspense skeletons
- **Acceptance Criteria Addressed**: AC-11, FR-32 through FR-35, NFR-7
- **Test Requirements**:
  - `rule` TR-7.1: All 6 KPIs match SQL aggregate queries on seeded data
  - `rule` TR-7.2: Each Recharts chart renders with data points count > 0 (DOM check for SVG paths)
  - `rule` TR-7.3: Low inventory section includes items where available_qty < category.threshold in seed
  - `rubric` TR-7.4: Admin dashboard UX quality; scale 1-5; threshold >= 4

## Task 8: Admin modules — Donations, Inventory, Requirements management
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 7
- **Description**:
  - `/app/admin/donations/page.tsx`: Search (don id, donor name), filter (status, category, date range), sort, pagination table; row actions: View, Advance Status, Reject; bulk status update
  - Donation detail `/app/admin/donations/[donationId]/page.tsx`: timeline, items, donor contact, status change modal with note field, QR for don id, associate with campaign, generate receipt
  - Status advance uses service layer and creates notification for donor
  - `/app/admin/inventory/page.tsx`: Search (category, batch id), filters (category, size, condition, stock status), sort, pagination; actions: Add, Edit, Adjust Qty, View Transactions
  - Inventory create/edit dialog: all required fields; uses inventory service with transaction row
  - Inventory detail modal/side sheet: full history of InventoryTransaction rows
  - `/app/admin/requirements/page.tsx`: List with progress bar + filter by priority/category/status; create/edit requirement dialog; delete confirmation
  - Requirement card shows required/fulfilled/remaining/progress dynamically per AC-7
- **Acceptance Criteria Addressed**: AC-4, AC-6, AC-7, AC-14, FR-11, FR-13 through FR-19
- **Test Requirements**:
  - `rule` TR-8.1: Admin donations search by partial id returns matching rows; status filter = RECEIVED returns only RECEIVED rows
  - `rule` TR-8.2: Inventory "Add" → qty +10 creates InventoryTransaction(type=RECEIVED, +10) and updates available_qty correctly
  - `rule` TR-8.3: New requirement(required=100) with matched donations=60 → progress shows 60% live
  - `rule` TR-8.4: Pagination: total 30 rows, page size 10 → 3 pages; page 2 shows rows 11-20 when sort=date asc

## Task 9: Admin modules — Beneficiaries, Distributions, Campaigns, Impact, Staff
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 8
- **Description**:
  - `/app/admin/beneficiaries/page.tsx`: Group-based records: BEN-GROUP-NNN, Age group, Size, Categories required, Qty required, Program, Status; CRUD dialogs; aggregated record view only (no PII)
  - `/app/admin/distributions/page.tsx`: Distribution events table (DRAFT→ALLOCATED→IN_PROGRESS→COMPLETED); create event dialog (name, date, program, location, desc)
  - Distribution detail `/app/admin/distributions/[id]/page.tsx`: Step1 allocate inventory items (qty from available), Step2 record distribution (beneficiary groups), Step3 mark COMPLETED; "Complete Distribution" button triggers transactional service.completeDistribution
  - `/app/admin/campaigns/page.tsx`: List with cover thumb, progress bar, status badge, date range; create/edit dialog with cover image upload to Storage; associate donations action modal
  - Campaign detail with progress chart + list of associated donations
  - `/app/admin/impact/page.tsx`: Published + draft impact stories; editor (title, description HTML or md, cover image, date, items distributed, program, optional stats JSON)
  - `/app/admin/staff/page.tsx`: Admin-only: Create staff/admin users, assign role, disable/enable account, remove
- **Acceptance Criteria Addressed**: AC-8, AC-9, FR-20 through FR-28, FR-150/FR-160 (manage staff, settings)
- **Test Requirements**:
  - `rule` TR-9.1: Create distribution DRAFT → allocate 50 jackets → COMPLETE → distribution.status=COMPLETED, inventory.available−=50, transaction rows created, related donations moved to DISTRIBUTED
  - `rule` TR-9.2: Campaign create with cover image → image URL stored; adding donation to campaign → campaign progress% increments (verify math)
  - `rule` TR-9.3: Impact story publish toggle → appears on /app/impact list when published
  - `rule` TR-9.4: Staff user attempts GET /admin/staff → 403; Admin succeeds

## Task 10: Settings, AuditLog, Notifications center, global UX polish
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 9
- **Description**:
  - `/app/admin/settings/page.tsx`: NGO profile (name, address, logo upload, description, receipt template color), email settings placeholders, category management (add/edit ClothingCategory)
  - Global audit log: Admin AuditLog model written on sensitive operations (donation status advance, inventory adjust > threshold, user role change, staff create/delete); `/app/admin/audit/page.tsx` view
  - Notifications center `/app/notifications/page.tsx`: Paginated list per user, bulk mark-read, filter by read/unread
  - Global toast provider (shadcn toaster) wrapping React-Hot-Toast or built-in; success/error/info variants
  - Loading skeletons for dashboard cards, tables, charts (shadcn skeleton component)
  - Confirmation dialogs for destructive actions (delete requirement, reject donation, complete distribution)
  - Global error boundary and friendly error page; add proper not-found.tsx for app segment
  - Image optimization via next/image with Supabase/S3 remote pattern configured
  - A11y pass: all forms have labels, focus rings, keyboard nav; color contrast AA
  - Responsive polish: mobile-optimized donor flow, tablet admin layout with collapsible sidebar, no horizontal overflow
  - Final animation polish: fade-in route transitions, progress bar smooth animation, modal/accordion motion via Tailwind transition classes
- **Acceptance Criteria Addressed**: AC-13, AC-15, AC-17, AC-19, AC-20, AC-21, NFR-5 through NFR-8, NFR-11
- **Test Requirements**:
  - `rule` TR-10.1: AuditLog row created after admin rejects a donation (actor, action, target, timestamp)
  - `rule` TR-10.2: Notifications center mark-all-read → all user notifications.isRead = true
  - `rule` TR-10.3: Destructive action "Delete requirement" shows confirm dialog; Cancel → no DB change; Confirm → row deleted
  - `rubric` TR-10.4: A11y Lighthouse >= 90; responsive 375/768/1440 no horizontal overflow; threshold >= 4
  - `rubric` TR-10.5: Overall polish (glassmorphism, animations, consistency); scale 1-5 threshold >= 4

## Task 11: Seed + env docs, verify end-to-end flows, final build check
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 10
- **Description**:
  - Final .env.example completeness; README instructions (install, env, prisma generate, db push, seed, dev, build)
  - Manual E2E sanity:
    (a) Register donor → create donation → track DON-id → admin login → advance through full workflow (SUBMITTED→COMPLETED) with each step creating notification + inventory changes → donor downloads valid receipt
    (b) Admin creates requirement → donor creates matching donation → recommendation shows HIGH → requirement fulfilled% updates
    (c) Admin creates campaign → 5 donations associated → campaign progress% correct
    (d) Admin creates distribution → allocates → completes → inventory decreases + analytics update
  - `npm run build` (Next.js production build) should succeed with no errors or warnings that impact runtime
  - Run `npx prisma validate`, `tsc --noEmit`, `eslint .` (if configured) as final checks
  - Document any remaining open items / next steps / deployment notes inline in code where non-obvious
- **Acceptance Criteria Addressed**: AC-1, AC-4, AC-8, AC-9, AC-10, AC-11, AC-18, AC-21, all remaining
- **Test Requirements**:
  - `rule` TR-11.1: `npm run build` exits 0; `next start` serves pages without server errors
  - `rule` TR-11.2: E2E flow (a) above completes fully with all side effects verified in DB
  - `rule` TR-11.3: `tsc --noEmit` passes; no `any` usage outside lib type declarations
  - `rule` TR-11.4: `npx prisma validate` passes; seed produces counts per AC-18
