import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  enforceRateLimit: vi.fn(),
}))

vi.mock("@/lib/db/prisma", () => ({
  prisma: { donation: { findUnique: mocks.findUnique } },
}))

vi.mock("@/lib/core/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
  getClientIp: () => "203.0.113.5",
}))

vi.mock("next/headers", () => ({ headers: () => ({ get: () => null }) }))

import { fetchDonationByTrackingId } from "@/lib/actions/track.actions"

const storedRow = {
  donationId: "DON-2026-7F3K9Q2M",
  currentStatus: "RECEIVED",
  totalItems: 5,
  createdAt: new Date("2026-05-01T10:00:00Z"),
  donorName: "Rahul Gupta",
  donorEmail: "rahul.gupta@gmail.com",
  donorPhone: "+91 98100 00001",
  pickupAddress: "12 MG Road, Pune",
  notes: "Drop off at centre",
  ngoId: 3,
  statusHistory: [
    {
      status: "SUBMITTED",
      note: "Donation submitted by donor",
      createdAt: new Date("2026-05-01T10:00:00Z"),
      changedByUser: { name: "Priya Sharma", role: "NGO_ADMIN" },
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.enforceRateLimit.mockResolvedValue(undefined)
  // The service selects only public columns; emulate that projection.
  mocks.findUnique.mockImplementation(async ({ select }: { select: Record<string, unknown> }) => {
    const projected: Record<string, unknown> = {}
    for (const key of Object.keys(select)) projected[key] = (storedRow as never)[key]
    return projected
  })
})

describe("fetchDonationByTrackingId — public exposure", () => {
  it("returns only the minimum information needed to track a donation", async () => {
    const result = await fetchDonationByTrackingId("don-2026-7f3k9q2m")

    expect(result).not.toBeNull()
    expect(Object.keys(result!).sort()).toEqual(
      ["createdAt", "currentStatus", "donationId", "donorDisplayName", "statusHistory", "totalItems"].sort()
    )
  })

  it("never exposes the donor's email, phone, pickup address or notes", async () => {
    const result = await fetchDonationByTrackingId("DON-2026-7F3K9Q2M")
    const serialized = JSON.stringify(result)

    expect(serialized).not.toContain(storedRow.donorEmail)
    expect(serialized).not.toContain(storedRow.donorPhone)
    expect(serialized).not.toContain("MG Road")
    expect(serialized).not.toContain("Drop off")
    expect(serialized).not.toContain('"ngoId"')
  })

  it("never exposes the names of the staff who handled the donation", async () => {
    const result = await fetchDonationByTrackingId("DON-2026-7F3K9Q2M")
    expect(JSON.stringify(result)).not.toContain("Priya Sharma")
    expect(result!.statusHistory[0]).not.toHaveProperty("changedByUser")
  })

  it("masks the donor name", async () => {
    const result = await fetchDonationByTrackingId("DON-2026-7F3K9Q2M")
    expect(result!.donorDisplayName).toBe("Rahul G.")
  })

  it("normalises the supplied tracking ID (trim + uppercase) before lookup", async () => {
    await fetchDonationByTrackingId("  don-2026-7f3k9q2m  ")
    expect(mocks.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { donationId: "DON-2026-7F3K9Q2M" } })
    )
  })

  it("returns null for an unknown tracking ID", async () => {
    mocks.findUnique.mockResolvedValue(null)
    expect(await fetchDonationByTrackingId("DON-2026-ZZZZZZZZ")).toBeNull()
  })

  it("returns null for an empty tracking ID without hitting the database", async () => {
    expect(await fetchDonationByTrackingId("")).toBeNull()
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })

  it("throttles lookups so tracking IDs cannot be enumerated freely", async () => {
    mocks.enforceRateLimit.mockRejectedValue(new Error("rate limited"))
    expect(await fetchDonationByTrackingId("DON-2026-7F3K9Q2M")).toBeNull()
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })
})
