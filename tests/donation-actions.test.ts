import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  categoryFindFirst: vi.fn(),
  donationCreate: vi.fn(),
  sendNotifications: vi.fn(),
  advanceDonationStatus: vi.fn(),
  revalidatePath: vi.fn(),
  usedIds: new Set<string>(),
}))

vi.mock("@/lib/auth/guards", () => ({ getCurrentUser: mocks.getCurrentUser }))

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    clothingCategory: { findFirst: mocks.categoryFindFirst },
    donation: { create: mocks.donationCreate },
  },
}))

vi.mock("@/lib/services/donation-approval.service", () => ({
  sendDonationSubmittedNotifications: mocks.sendNotifications,
}))

vi.mock("@/lib/services/donation.service", () => ({
  advanceDonationStatus: mocks.advanceDonationStatus,
}))

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))

import { submitDonationAction } from "@/lib/actions/donation.actions"

const sessionUser = { id: 42, email: "donor@example.com", name: "Test Donor", role: "DONOR", ngoId: null }

const validPayload = {
  donorName: "Test Donor",
  donorEmail: "donor@example.com",
  donorPhone: "+91 90000 00000",
  pickupAddress: "1 Test Street",
  notes: "",
  items: [
    { categoryId: 1, size: "M", condition: "GOOD" as const, quantity: 3, description: "shirts" },
    { categoryId: 2, size: "L", condition: "NEW" as const, quantity: 2, description: "pants" },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.usedIds.clear()
  mocks.getCurrentUser.mockResolvedValue(sessionUser)
  mocks.categoryFindFirst.mockResolvedValue({ ngoId: 7 })
  mocks.sendNotifications.mockResolvedValue({ emailSent: true, provider: "log" })
  // Emulate the Donation.donationId @unique constraint at the mock boundary.
  mocks.donationCreate.mockImplementation(async ({ data }: { data: { donationId: string } }) => {
    if (mocks.usedIds.has(data.donationId)) {
      const err = new Error("Unique constraint failed on the fields: (`donationId`)") as Error & {
        code: string
      }
      err.code = "P2002"
      throw err
    }
    mocks.usedIds.add(data.donationId)
    return { id: mocks.usedIds.size, donationId: data.donationId }
  })
})

describe("submitDonationAction — authentication & validation", () => {
  it("rejects an unauthenticated submission", async () => {
    mocks.getCurrentUser.mockResolvedValue(null)
    const result = await submitDonationAction(validPayload as never)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/authentication required/i)
    expect(mocks.donationCreate).not.toHaveBeenCalled()
  })

  it("rejects an empty item list", async () => {
    const result = await submitDonationAction({ ...validPayload, items: [] } as never)
    expect(result.success).toBe(false)
    expect(mocks.donationCreate).not.toHaveBeenCalled()
  })

  it("rejects an invalid email", async () => {
    const result = await submitDonationAction({ ...validPayload, donorEmail: "bad" } as never)
    expect(result.success).toBe(false)
    expect(mocks.donationCreate).not.toHaveBeenCalled()
  })

  it("rejects items with a non-positive quantity", async () => {
    const result = await submitDonationAction({
      ...validPayload,
      items: [{ categoryId: 1, condition: "GOOD", quantity: 0 }],
    } as never)
    expect(result.success).toBe(false)
    expect(mocks.donationCreate).not.toHaveBeenCalled()
  })

  it("rejects unknown categories instead of falling back to a default NGO", async () => {
    mocks.categoryFindFirst.mockResolvedValue(null)
    const result = await submitDonationAction(validPayload as never)
    expect(result.success).toBe(false)
    expect(mocks.donationCreate).not.toHaveBeenCalled()
  })
})

describe("submitDonationAction — persistence", () => {
  it("persists the donation with items and initial status history, deriving ownership from the session", async () => {
    const result = await submitDonationAction(validPayload as never)

    expect(result.success).toBe(true)
    expect(result.data!.donationId).toMatch(/^DON-\d{4}-[0-9A-Z]{8}$/)

    const data = mocks.donationCreate.mock.calls[0][0].data
    expect(data.donorId).toBe(sessionUser.id)
    expect(data.ngoId).toBe(7)
    expect(data.totalItems).toBe(5)
    expect(data.currentStatus).toBe("SUBMITTED")
    expect(data.items.create).toHaveLength(2)
    expect(data.statusHistory.create).toMatchObject({
      status: "SUBMITTED",
      changedBy: sessionUser.id,
    })
  })

  it("ignores any donorId supplied by the client", async () => {
    await submitDonationAction({ ...validPayload, donorId: 999 } as never)
    const data = mocks.donationCreate.mock.calls[0][0].data
    expect(data.donorId).toBe(sessionUser.id)
  })

  it("returns a unique tracking ID for every created donation", async () => {
    const results = await Promise.all(
      Array.from({ length: 50 }, () => submitDonationAction(validPayload as never))
    )
    const ids = results.map((r) => r.data!.donationId)
    expect(new Set(ids).size).toBe(ids.length)
    expect(mocks.donationCreate).toHaveBeenCalledTimes(50)
  })

  it("retries with a fresh ID when the database reports a collision", async () => {
    mocks.donationCreate
      .mockRejectedValueOnce(
        Object.assign(new Error("Unique constraint failed"), { code: "P2002" })
      )
      .mockResolvedValueOnce({ id: 1, donationId: "DON-2026-ABCDEFGH" })

    const result = await submitDonationAction(validPayload as never)
    expect(result.success).toBe(true)
    expect(mocks.donationCreate).toHaveBeenCalledTimes(2)
  })
})

describe("submitDonationAction — email behaviour", () => {
  it("still succeeds and never duplicates the donation when email delivery fails", async () => {
    mocks.sendNotifications.mockResolvedValue({ emailSent: false, provider: null, error: "smtp down" })
    const result = await submitDonationAction(validPayload as never)

    expect(result.success).toBe(true)
    expect(result.data!.emailSent).toBe(false)
    expect(mocks.donationCreate).toHaveBeenCalledTimes(1)
  })
})

describe("submitDonationAction — failure handling", () => {
  it("does not leak database errors to the caller", async () => {
    mocks.donationCreate.mockRejectedValue(
      new Error('relation "Donation" does not exist at character 42')
    )
    const result = await submitDonationAction(validPayload as never)

    expect(result.success).toBe(false)
    expect(result.error).toBe("Failed to submit donation. Please try again.")
    expect(result.error).not.toMatch(/relation|character 42/i)
  })
})
