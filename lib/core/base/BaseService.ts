import type { PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { AppError } from "@/lib/core/errors/AppError"

/**
 * Abstract base class for all domain services.
 *
 * OOP pillars:
 *  - Encapsulation : the Prisma client is `protected` — subclasses use it,
 *                    external callers cannot reach it.
 *  - Abstraction   : subclasses implement domain intent (createDonation, …)
 *                    without exposing persistence mechanics.
 *  - Inheritance   : every service shares this single, well-defined contract.
 *  - Polymorphism  : `assert`/`guard` normalise any thrown value into the
 *                    `AppError` hierarchy regardless of subclass.
 */
export abstract class BaseService {
  /** Protected data-access handle, injected for testability. */
  protected readonly db: PrismaClient

  protected constructor(client: PrismaClient = prisma) {
    this.db = client
  }

  /** Narrow an unknown thrown value into a typed `AppError` and rethrow. */
  protected fail(error: unknown): never {
    if (error instanceof AppError) throw error
    throw error instanceof Error ? error : new Error(String(error))
  }

  /** Type-narrowing assertion helper (encapsulated invariant check). */
  protected assert<T>(
    condition: T,
    errorFactory: () => AppError
  ): asserts condition is NonNullable<T> {
    if (!condition) throw errorFactory()
  }
}
