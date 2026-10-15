/**
 * Application error hierarchy.
 *
 * Demonstrates OOP pillars:
 *  - Inheritance : every concrete error extends the abstract `AppError`.
 *  - Abstraction : callers depend on `AppError`, never on a specific subclass.
 *  - Polymorphism: `toJSON()` / `statusCode` resolve to the concrete subclass,
 *                  so the API layer can serialise any error uniformly.
 *  - Encapsulation: HTTP status + machine code + "safe to expose" flag are
 *                  encapsulated per error type; messages are never leaked as
 *                  stack traces to clients unless `expose` is true.
 */

export interface AppErrorOptions {
  cause?: unknown
  /** Extra, non-sensitive context returned to the client (e.g. field errors). */
  details?: Record<string, unknown>
}

export abstract class AppError extends Error {
  /** HTTP status code this error maps to. */
  abstract readonly statusCode: number
  /** Stable, machine-readable error code for the client. */
  abstract readonly code: string
  /** Whether the message is safe to surface to an end user. */
  readonly expose: boolean
  /** Optional structured, non-sensitive payload. */
  readonly details?: Record<string, unknown>

  protected constructor(
    message: string,
    options: AppErrorOptions & { expose?: boolean } = {}
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined)
    this.name = new.target.name
    this.expose = options.expose ?? true
    this.details = options.details
    // Restore prototype chain (required when targeting ES5/ES2015 downlevel).
    Object.setPrototypeOf(this, new.target.prototype)
  }

  /** Uniform, client-safe serialisation (polymorphic). */
  toJSON(): { error: { code: string; message: string; details?: Record<string, unknown> } } {
    return {
      error: {
        code: this.code,
        message: this.expose ? this.message : "An unexpected error occurred.",
        ...(this.expose && this.details ? { details: this.details } : {}),
      },
    }
  }
}

/** 400 — input failed validation. */
export class ValidationError extends AppError {
  readonly statusCode = 400
  readonly code = "VALIDATION_ERROR"

  constructor(message = "Invalid input.", details?: Record<string, unknown>) {
    super(message, { details })
  }
}

/** 401 — not authenticated. */
export class AuthError extends AppError {
  readonly statusCode = 401
  readonly code = "UNAUTHORIZED"

  constructor(message = "You must be signed in to perform this action.") {
    super(message)
  }
}

/** 403 — authenticated but not permitted. */
export class ForbiddenError extends AppError {
  readonly statusCode = 403
  readonly code = "FORBIDDEN"

  constructor(message = "You do not have permission to perform this action.") {
    super(message)
  }
}

/** 404 — resource does not exist (or is not visible to the caller). */
export class NotFoundError extends AppError {
  readonly statusCode = 404
  readonly code = "NOT_FOUND"

  constructor(message = "The requested resource was not found.") {
    super(message)
  }
}

/** 409 — state conflict (duplicate key, illegal transition, …). */
export class ConflictError extends AppError {
  readonly statusCode = 409
  readonly code = "CONFLICT"

  constructor(message = "The request conflicts with the current state.") {
    super(message)
  }
}

/** 413 — uploaded payload too large. */
export class PayloadTooLargeError extends AppError {
  readonly statusCode = 413
  readonly code = "PAYLOAD_TOO_LARGE"

  constructor(message = "The uploaded file is too large.") {
    super(message)
  }
}

/** 415 — unsupported media type. */
export class UnsupportedMediaTypeError extends AppError {
  readonly statusCode = 415
  readonly code = "UNSUPPORTED_MEDIA_TYPE"

  constructor(message = "The uploaded file type is not supported.") {
    super(message)
  }
}

/** 429 — rate limited. */
export class RateLimitError extends AppError {
  readonly statusCode = 429
  readonly code = "RATE_LIMITED"
  readonly retryAfterSeconds: number

  constructor(retryAfterSeconds: number, message = "Too many requests. Please try again shortly.") {
    super(message, { details: { retryAfterSeconds } })
    this.retryAfterSeconds = retryAfterSeconds
  }
}

/** 500 — unexpected internal failure (message hidden from clients). */
export class InternalError extends AppError {
  readonly statusCode = 500
  readonly code = "INTERNAL_ERROR"

  constructor(message = "An unexpected error occurred.", options: AppErrorOptions = {}) {
    super(message, { ...options, expose: false })
  }
}

/** Narrow an unknown thrown value into an `AppError` (polymorphic factory). */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  const message = error instanceof Error ? error.message : "Unknown error"
  return new InternalError(message, { cause: error })
}
