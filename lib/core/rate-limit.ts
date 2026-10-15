import { PrismaRateLimiter } from "@/lib/core/providers/PrismaRateLimiter"
import { RateLimitError } from "@/lib/core/errors/AppError"
import type { IRateLimiter } from "@/lib/core/interfaces/IRateLimiter"

/** Single shared limiter instance (encapsulated singleton). */
export const rateLimiter: IRateLimiter = new PrismaRateLimiter()

/**
 * Consume one unit for `key`; throw `RateLimitError` (HTTP 429) if exceeded.
 * Use on sensitive public endpoints (login, register, upload).
 */
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<void> {
  const result = await rateLimiter.consume(key, limit, windowMs)
  if (!result.allowed) {
    const retryAfter = Math.max(
      1,
      Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)
    )
    throw new RateLimitError(retryAfter)
  }
}

/** Resolve the best-effort client IP behind a proxy/CDN. */
export function getClientIp(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]!.trim()
  return headers.get("x-real-ip") ?? "unknown"
}
