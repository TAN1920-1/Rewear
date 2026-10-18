import { randomBytes } from "node:crypto"

/**
 * Human-readable, collision-resistant donation tracking IDs.
 *
 * Format: `DON-<YYYY>-<8 crockford-base32 characters>` → e.g. `DON-2026-7F3K9Q2M`
 *
 * Why not a `COUNT(*) + 1` sequence?
 *   A count-based scheme races: two concurrent submissions read the same count
 *   and mint the same ID. It also breaks across multiple app instances, which
 *   have no shared counter. We instead draw the suffix from a cryptographically
 *   secure random source, so no coordination is needed and collisions are
 *   astronomically unlikely (32^8 ≈ 1.1 × 10¹² combinations per year).
 *
 * The alphabet deliberately omits visually ambiguous characters (0/O, 1/I/L)
 * so an ID stays easy to read aloud and type. Uniqueness is additionally
 * enforced by the `Donation.donationId @unique` constraint; callers retry on
 * the rare collision (see `isUniqueConstraintError`).
 */

/** Crockford-style base32: no 0/O, 1/I/L. */
const ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ"
const ID_RANDOM_LENGTH = 8

/** Matches both the new randomized format and the legacy `DON-YYYY-NNNNNN`. */
export const DONATION_ID_PATTERN = /^DON-\d{4}-[0-9A-Z]{4,12}$/i

export function generateDonationId(now: Date = new Date()): string {
  // 256 is an exact multiple of 32, so `% 32` introduces no modulo bias.
  const bytes = randomBytes(ID_RANDOM_LENGTH)
  let suffix = ""
  for (let i = 0; i < ID_RANDOM_LENGTH; i++) {
    suffix += ID_ALPHABET[bytes[i] % ID_ALPHABET.length]
  }
  return `DON-${now.getFullYear()}-${suffix}`
}

/** True when Prisma reports a unique-constraint violation (P2002). */
export function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === "P2002"
  )
}
