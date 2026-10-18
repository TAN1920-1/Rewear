import { describe, expect, it } from "vitest"
import {
  DONATION_ID_PATTERN,
  generateDonationId,
  isUniqueConstraintError,
} from "@/lib/utils/donation-id"

describe("generateDonationId", () => {
  it("produces a readable DON-YYYY-XXXXXXXX identifier", () => {
    const id = generateDonationId(new Date("2026-05-01T00:00:00Z"))
    expect(id).toMatch(/^DON-2026-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/)
    expect(id).toMatch(DONATION_ID_PATTERN)
  })

  it("avoids visually ambiguous characters (0/O, 1/I/L)", () => {
    const suffixes = Array.from({ length: 300 }, () => generateDonationId().split("-")[2]).join("")
    expect(suffixes).not.toMatch(/[01OIL]/)
  })

  it("does not depend on a row count, so concurrent calls never collide", async () => {
    const ids = await Promise.all(
      Array.from({ length: 5000 }, async () => generateDonationId())
    )
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("isUniqueConstraintError", () => {
  it("detects Prisma P2002 errors", () => {
    expect(isUniqueConstraintError({ code: "P2002" })).toBe(true)
  })

  it("rejects other error codes, plain errors and non-objects", () => {
    expect(isUniqueConstraintError({ code: "P2003" })).toBe(false)
    expect(isUniqueConstraintError(new Error("boom"))).toBe(false)
    expect(isUniqueConstraintError(null)).toBe(false)
    expect(isUniqueConstraintError(undefined)).toBe(false)
  })
})
