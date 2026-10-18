"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import {
  respondToDonationApproval,
  type ApprovalAction,
} from "@/lib/services/donation-approval.service"

export interface ApprovalActionResult {
  success: boolean
  error?: string
  status?: string
  donationCode?: string
  donorNotified?: boolean
}

/**
 * Public endpoint (no login) — the manager acts on a donation straight from
 * the emailed link. All authorisation/validation happens server-side inside
 * `respondToDonationApproval`; the token is the sole credential.
 */
export async function respondToDonationApprovalAction(
  token: string,
  action: ApprovalAction
): Promise<ApprovalActionResult> {
  try {
    if (!token) return { success: false, error: "Missing approval token." }

    const ip =
      headers().get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers().get("x-real-ip") ||
      null

    const result = await respondToDonationApproval(token, action, ip)

    if (result.success) {
      revalidatePath("/donations/approval")
      revalidatePath("/admin/donations")
      revalidatePath("/admin/dashboard")
    }

    return result
  } catch (err: any) {
    console.error("respondToDonationApprovalAction error", err)
    return { success: false, error: err?.message ?? "Unexpected error. Please try again." }
  }
}
