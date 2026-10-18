import { randomBytes } from "node:crypto"

/**
 * Guards for demo/test account seeding.
 *
 * Demo accounts are a development convenience. They must NEVER be created
 * against a production database: they ship with publicly-known emails and were
 * historically created with one shared, hard-coded password — auto-creating an
 * admin like that is effectively a public back door.
 *
 * Seeding is therefore explicit opt-in:
 *   • `NODE_ENV=production`  → always refused, no override.
 *   • otherwise              → requires `SEED_DEMO_USERS=true`.
 */

export interface SeedEnv {
  NODE_ENV?: string
  SEED_DEMO_USERS?: string
  SEED_DEMO_PASSWORD?: string
}

export class DemoSeedForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DemoSeedForbiddenError"
  }
}

/** Non-throwing predicate — handy for tests and for pre-flight checks. */
export function isDemoSeedAllowed(env: SeedEnv = process.env): boolean {
  return env.NODE_ENV !== "production" && env.SEED_DEMO_USERS === "true"
}

/**
 * Throw unless demo seeding is explicitly permitted. Called at the very top of
 * the seed script so no production data can ever be touched.
 */
export function assertDemoSeedAllowed(env: SeedEnv = process.env): void {
  if (env.NODE_ENV === "production") {
    throw new DemoSeedForbiddenError(
      "Refusing to seed demo accounts: NODE_ENV=production. " +
        "Demo users must never be created against a production database. " +
        "Provision real staff accounts through an authorised admin process instead."
    )
  }
  if (env.SEED_DEMO_USERS !== "true") {
    throw new DemoSeedForbiddenError(
      "Refusing to seed demo accounts: demo seeding is opt-in. " +
        "Set SEED_DEMO_USERS=true (development/test only) to proceed."
    )
  }
}

/**
 * Resolve the password used for seeded demo accounts.
 *
 *   • `SEED_DEMO_PASSWORD` may supply one (read at runtime, never committed).
 *   • Otherwise a strong random password is generated for this run.
 *
 * Nothing is ever hard-coded, so the repository never ships a usable
 * credential. The caller prints a generated password once, in development
 * only, so a developer can actually sign in.
 */
export function resolveSeedPassword(env: SeedEnv = process.env): {
  password: string
  generated: boolean
} {
  const provided = env.SEED_DEMO_PASSWORD?.trim()
  if (provided && provided.length >= 8) {
    return { password: provided, generated: false }
  }
  return { password: `Demo-${randomBytes(18).toString("base64url")}`, generated: true }
}
