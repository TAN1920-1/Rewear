import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  advanceDonationStatus: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/auth/guards", () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock("@/lib/services/donation.service", () => ({
  advanceDonationStatus: mocks.advanceDonationStatus,
}))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))

import { advanceDonationStatusAction } from "@/lib/actions/donation.actions"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.advanceDonationStatus.mockResolvedValue({})
})

describe("advanceDonationStatusAction — server-side authorization", () => {
  it("blocks unauthenticated callers", async () => {
    mocks.getCurrentUser.mockResolvedValue(null)
    const result = await advanceDonationStatusAction(1, "RECEIVED")
    expect(result).toEqual({ success: false, error: "Unauthorized" })
    expect(mocks.advanceDonationStatus).not.toHaveBeenCalled()
  })

  it("blocks a donor from using the privileged status action", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 5, role: "DONOR", ngoId: null })
    const result = await advanceDonationStatusAction(1, "RECEIVED")
    expect(result).toEqual({ success: false, error: "Unauthorized" })
    expect(mocks.advanceDonationStatus).not.toHaveBeenCalled()
  })

  it("blocks NGO staff that has no NGO association", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 5, role: "NGO_STAFF", ngoId: null })
    const result = await advanceDonationStatusAction(1, "RECEIVED")
    expect(result).toEqual({ success: false, error: "Unauthorized" })
    expect(mocks.advanceDonationStatus).not.toHaveBeenCalled()
  })

  it("allows an NGO admin and scopes the update to their own NGO", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 9, role: "NGO_ADMIN", ngoId: 3 })
    const result = await advanceDonationStatusAction(11, "RECEIVED", "arrived")

    expect(result).toEqual({ success: true })
    expect(mocks.advanceDonationStatus).toHaveBeenCalledWith({
      donationId: 11,
      ngoId: 3,
      nextStatus: "RECEIVED",
      changedBy: 9,
      note: "arrived",
    })
  })

  it("rejects an unknown status value before touching the database", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 9, role: "NGO_ADMIN", ngoId: 3 })
    const result = await advanceDonationStatusAction(11, "NOT_A_REAL_STATUS")
    expect(result).toEqual({ success: false, error: "Invalid status update request." })
    expect(mocks.advanceDonationStatus).not.toHaveBeenCalled()
  })

  it("returns a safe message when the service throws", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 9, role: "NGO_ADMIN", ngoId: 3 })
    mocks.advanceDonationStatus.mockRejectedValue(new Error("Cannot advance from X to Y"))
    const result = await advanceDonationStatusAction(11, "RECEIVED")
    expect(result.success).toBe(false)
    expect(result.error).toBe("Failed to advance status. Please try again.")
  })
})
