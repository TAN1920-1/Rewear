/**
 * Rate-limiter abstraction (abstraction / polymorphism).
 * Any implementation (DB-backed, Redis-backed, …) can be swapped in.
 */
export interface RateLimitResult {
  allowed: boolean
  /** Requests left in the current window. */
  remaining: number
  /** When the current window resets. */
  resetAt: Date
}

export interface IRateLimiter {
  /**
   * Consume one unit for `key` in a fixed window of `windowMs`.
   * @returns whether the request is allowed and window metadata.
   */
  consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult>
}
