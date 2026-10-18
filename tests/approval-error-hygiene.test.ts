import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  sendManagerDonationNotification: vi.fn(),
  sendDonorDecisionEmail: vi.fn(),
}))

vi.mock("@/lib/db/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}))

vi.mock("@/lib/services/email.service", () => ({
  sendManagerDonationNotification: mocks.sendManagerDonationNotification,
  sendDonorDecisionEmail: mocks.sendDonorDecisionEmail,
}))

import {
  respondToDonationApproval,
  UserFacingApprovalError,
} from "@/lib/services/donation-approval.service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("respondToDonationApproval — error hygiene on the public link", () => {
  it("surfaces curated, user-facing messages unchanged", async () => {
    mocks.transaction.mockRejectedValue(
      new UserFacingApprovalError(
        "This link is no longer valid — it may have already been used or has expired."
      )
    )

    const result = await respondToDonationApproval("a".repeat(64), "approve", "1.2.3.4")

    expect(result.success).toBe(false)
    expect(result.error).toContain("no longer valid")
  })

  it("never leaks raw database/provider errors to the caller", async () => {
    const dbError = Object.assign(
      new Error('relation "Donation" does not exist'),
      { code: "P2021" }
    )
    mocks.transaction.mockRejectedValue(dbError)

    const result = await respondToDonationApproval("b".repeat(64), "approve", "1.2.3.4")

    expect(result.success).toBe(false)
    expect(result.error).not.toContain("relation")
    expect(result.error).not.toContain("P2021")
    expect(result.error).toBe("Unable to update the donation right now. Please try again.")
  })

  it("rejects an unknown action without touching the database", async () => {
    const result = await respondToDonationApproval("c".repeat(64), "delete" as never)
    expect(result).toEqual({ success: false, error: "Unknown action." })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
})
