import { describe, expect, it, vi } from "vitest"

// The service imports Prisma and notification helpers at module scope; both are
// stubbed so the pure ownership predicate can be imported without a database.
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }))
vi.mock("@/lib/services/notification.service", () => ({ createNotification: vi.fn() }))

import { isDonationOwner } from "@/lib/services/donation.service"

describe("isDonationOwner", () => {
  it("grants access to the donor who owns the record", () => {
    expect(isDonationOwner({ id: 10 }, { donorId: 10 })).toBe(true)
  })

  it("denies access to a different donor (no IDOR by changing the URL)", () => {
    expect(isDonationOwner({ id: 20 }, { donorId: 10 })).toBe(false)
  })

  it("denies access when there is no authenticated user", () => {
    expect(isDonationOwner(null, { donorId: 10 })).toBe(false)
    expect(isDonationOwner(undefined, { donorId: 10 })).toBe(false)
  })
})
