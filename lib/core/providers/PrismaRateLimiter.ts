import type { PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import type { IRateLimiter, RateLimitResult } from "@/lib/core/interfaces/IRateLimiter"

/**
 * Postgres-backed fixed-window rate limiter (polymorphism).
 *
 * Chosen over Redis to avoid an extra vendor: the app already owns a
 * Postgres connection, and traffic for a single-NGO instance is low. Each
 * `(key, windowStart)` pair is one atomic upsert, so concurrent requests
 * cannot race past the limit.
 */
export class PrismaRateLimiter implements IRateLimiter {
  constructor(private readonly db: PrismaClient = prisma) {}

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = new Date(Math.floor(now / windowMs) * windowMs)
    const expiresAt = new Date(windowStart.getTime() + windowMs)

    const entry = await this.db.rateLimitEntry.upsert({
      where: { key_windowStart: { key, windowStart } },
      create: { key, windowStart, count: 1, expiresAt },
      update: { count: { increment: 1 } },
      select: { count: true },
    })

    return {
      allowed: entry.count <= limit,
      remaining: Math.max(0, limit - entry.count),
      resetAt: expiresAt,
    }
  }

  /** Best-effort housekeeping; safe to call opportunistically. */
  async purgeExpired(): Promise<void> {
    await this.db.rateLimitEntry.deleteMany({
      where: { expiresAt: { lt: new Date(Date.now() - 60_000) } },
    })
  }
}
