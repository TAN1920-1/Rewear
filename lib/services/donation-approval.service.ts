import { createHash, randomBytes } from "node:crypto"
import { prisma } from "@/lib/db/prisma"
import { DonationStatus } from "@/lib/enums"
import {
  sendManagerDonationNotification,
  sendDonorDecisionEmail,
  type DonationEmailItem,
} from "@/lib/services/email.service"

export type ApprovalAction = "approve" | "reject"

/**
 * An error whose message is safe (and useful) to show the manager.
 * Any other error type is treated as internal and replaced by a generic
 * message so database/provider details never reach the browser.
 */
export class UserFacingApprovalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UserFacingApprovalError"
  }
}

/** How long an emailed approval link stays valid (default 7 days). */
const DEFAULT_TTL_HOURS = 168

export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    (typeof window !== "undefined" ? window.location.origin : "")
  
  return url.replace(/\/$/, "")
}

/** Only the hash is persisted — the raw token lives solely in the email link. */
function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex")
}

function ttlHours(): number {
  const n = Number(process.env.APPROVAL_TOKEN_TTL_HOURS)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_HOURS
}

/** Mint a fresh single-use token for a donation. */
export async function issueApprovalToken(donationId: number) {
  const raw = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + ttlHours() * 3600_000)
  await prisma.donationApprovalToken.create({
    data: { tokenHash: hashToken(raw), donationId, expiresAt },
  })
  return { raw, expiresAt }
}

export interface ApprovalEmailResult {
  emailSent: boolean
  provider: string | null
  error?: string
}

/**
 * Create an approval token for a freshly-submitted donation and email the
 * manager with Approve / Reject links. Never throws — a mail outage must not
 * roll back an already-saved donation; the failure is reported to the caller.
 */
export async function sendDonationSubmittedNotifications(
  donationDbId: number
): Promise<ApprovalEmailResult> {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id: donationDbId },
      include: {
        items: { include: { category: true } },
        campaign: { select: { name: true } },
        ngo: true,
      },
    })
    if (!donation) return { emailSent: false, provider: null, error: "Donation not found" }

    const { raw, expiresAt } = await issueApprovalToken(donation.id)
    const approveUrl = `${getSiteUrl()}/donations/approval?token=${raw}&action=approve`
    const rejectUrl = `${getSiteUrl()}/donations/approval?token=${raw}&action=reject`

    const items: DonationEmailItem[] = donation.items.map((i) => ({
      categoryName: i.category.name,
      size: i.size,
      condition: i.condition,
      quantity: i.quantity,
      description: i.description,
    }))

    const { provider } = await sendManagerDonationNotification({
      donationCode: donation.donationId,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      donorPhone: donation.donorPhone,
      pickupAddress: donation.pickupAddress,
      notes: donation.notes,
      campaignName: donation.campaign?.name ?? null,
      items,
      totalItems: donation.totalItems,
      submittedAt: donation.createdAt,
      ngoName: donation.ngo?.name ?? "REWEAR NGO",
      approveUrl,
      rejectUrl,
      expiresAt,
    })

    return { emailSent: true, provider }
  } catch (err: any) {
    console.error("sendDonationSubmittedNotifications error", err)
    return { emailSent: false, provider: null, error: err?.message ?? "Failed to send email" }
  }
}

export interface ApprovalDonationView {
  code: string
  donorName: string
  donorEmail: string
  donorPhone?: string | null
  pickupAddress?: string | null
  notes?: string | null
  campaignName?: string | null
  totalItems: number
  submittedAt: string
  currentStatus: string
  items: DonationEmailItem[]
}

export interface ApprovalView {
  state: "ready" | "invalid"
  reason?: string
  ngoName?: string
  expiresAt?: string
  donation?: ApprovalDonationView
}

/** Validate an emailed token WITHOUT consuming it (used to render the page). */
export async function getApprovalRequest(rawToken: string): Promise<ApprovalView> {
  if (!rawToken) return { state: "invalid", reason: "Missing approval token." }

  const token = await prisma.donationApprovalToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: {
      donation: {
        include: {
          items: { include: { category: true } },
          campaign: { select: { name: true } },
          ngo: { select: { name: true } },
        },
      },
    },
  })

  if (!token) return { state: "invalid", reason: "This approval link is not valid." }
  if (token.usedAt) {
    return {
      state: "invalid",
      reason: `This donation was already ${token.action === "approve" ? "approved" : "rejected"}. No further action is needed.`,
    }
  }
  if (token.expiresAt.getTime() < Date.now()) {
    return { state: "invalid", reason: "This approval link has expired. Please review the donation from the admin dashboard." }
  }

  const d = token.donation

  // A donation that already moved on (e.g. handled from the dashboard) needs
  // no approval — surface that instead of offering buttons that would fail.
  if (d.currentStatus !== DonationStatus.SUBMITTED) {
    return {
      state: "invalid",
      reason: `This donation is already "${d.currentStatus.replace(/_/g, " ")}" — no approval action is needed.`,
    }
  }

  return {
    state: "ready",
    ngoName: d.ngo?.name ?? "REWEAR NGO",
    expiresAt: token.expiresAt.toISOString(),
    donation: {
      code: d.donationId,
      donorName: d.donorName,
      donorEmail: d.donorEmail,
      donorPhone: d.donorPhone,
      pickupAddress: d.pickupAddress,
      notes: d.notes,
      campaignName: d.campaign?.name ?? null,
      totalItems: d.totalItems,
      submittedAt: d.createdAt.toISOString(),
      currentStatus: d.currentStatus,
      items: d.items.map((i) => ({
        categoryName: i.category.name,
        size: i.size,
        condition: i.condition,
        quantity: i.quantity,
        description: i.description,
      })),
    },
  }
}

export interface RespondResult {
  success: boolean
  error?: string
  status?: string
  donationCode?: string
  donorNotified?: boolean
}

/**
 * Consume a token and apply the manager's decision.
 *
 * Guarantees:
 *  - single-use  : the token is atomically claimed (conditional update) inside
 *                  the same transaction as the status change, so concurrent
 *                  clicks can never both succeed.
 *  - authorised  : only a valid, unexpired, matching token works.
 *  - idempotent  : a donation that already moved past SUBMITTED is refused.
 */
export async function respondToDonationApproval(
  rawToken: string,
  action: ApprovalAction,
  ip?: string | null
): Promise<RespondResult> {
  if (!rawToken) return { success: false, error: "Missing approval token." }
  if (action !== "approve" && action !== "reject") {
    return { success: false, error: "Unknown action." }
  }

  const tokenHash = hashToken(rawToken)
  const nextStatus = action === "approve" ? DonationStatus.RECEIVED : DonationStatus.REJECTED

  let donationCode = ""
  let donorEmail = ""
  let donorName = ""

  try {
    await prisma.$transaction(async (tx: any) => {
      // 1. Atomically claim the token — the only gate against duplicate actions.
      const claim = await tx.donationApprovalToken.updateMany({
        where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date(), action, actedByIp: ip ?? null },
      })
      if (claim.count !== 1) {
        throw new UserFacingApprovalError(
          "This link is no longer valid — it may have already been used or has expired."
        )
      }

      const token = await tx.donationApprovalToken.findUnique({
        where: { tokenHash },
        include: { donation: true },
      })
      if (!token) throw new UserFacingApprovalError("Approval request not found.")

      const donation = await tx.donation.findUnique({
        where: { id: token.donationId },
        select: {
          id: true,
          donationId: true,
          donorId: true,
          ngoId: true,
          currentStatus: true,
          donorEmail: true,
          donorName: true,
        },
      })
      if (!donation) throw new UserFacingApprovalError("Donation not found.")

      // 2. Only a still-pending (SUBMITTED) donation may be decided.
      if (donation.currentStatus !== DonationStatus.SUBMITTED) {
        throw new UserFacingApprovalError(
          `This donation has already been processed (current status: ${donation.currentStatus}).`
        )
      }

      // 3. Attribute the change to an NGO admin (status history requires a user).
      const actor = await tx.user.findFirst({
        where: { ngoId: donation.ngoId, role: "NGO_ADMIN", isActive: true },
        select: { id: true },
        orderBy: { id: "asc" },
      })
      if (!actor)
        throw new UserFacingApprovalError(
          "No NGO administrator account is available to record this action."
        )

      await tx.donation.update({
        where: { id: donation.id },
        data: {
          currentStatus: nextStatus,
          ...(nextStatus === DonationStatus.REJECTED
            ? { rejectionReason: "Rejected by manager via email" }
            : {}),
        },
      })

      await tx.donationStatusHistory.create({
        data: {
          donationId: donation.id,
          status: nextStatus,
          changedBy: actor.id,
          note:
            nextStatus === DonationStatus.REJECTED
              ? "Donation rejected by manager via email link"
              : "Donation approved by manager via email link",
        },
      })

      await tx.notification.create({
        data: {
          userId: donation.donorId,
          title: nextStatus === DonationStatus.REJECTED ? "Donation Rejected" : "Donation Received",
          message:
            nextStatus === DonationStatus.REJECTED
              ? `Your donation ${donation.donationId} could not be accepted. Contact us for details.`
              : `Your donation ${donation.donationId} has been received at our facility. Thank you!`,
          relatedType: "donation",
          relatedId: donation.id,
        },
      })

      donationCode = donation.donationId
      donorEmail = donation.donorEmail
      donorName = donation.donorName
    })
  } catch (err: any) {
    // Curated, user-facing messages are surfaced; anything else (Prisma,
    // provider, network) is logged server-side and replaced with a generic
    // message so internals never reach the browser.
    if (err instanceof UserFacingApprovalError) {
      return { success: false, error: err.message }
    }
    console.error("respondToDonationApproval error", err)
    return { success: false, error: "Unable to update the donation right now. Please try again." }
  }

  // 4. Notify the donor (best-effort — the decision is already committed).
  let donorNotified = false
  if (donorEmail) {
    try {
      await sendDonorDecisionEmail({
        to: donorEmail,
        donorName,
        donationCode,
        decision: action === "approve" ? "APPROVED" : "REJECTED",
        reason: action === "reject" ? "Rejected by the NGO manager" : null,
        ngoName: process.env.NGO_DISPLAY_NAME ?? "Mangaldham Bahuuddeshiy Samajik Sanstha",
        trackUrl: `${getSiteUrl()}/track`,
      })
      donorNotified = true
    } catch (err) {
      console.error("Donor notification email failed", err)
    }
  }

  return { success: true, status: nextStatus, donationCode, donorNotified }
}
