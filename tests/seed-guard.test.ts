import { describe, expect, it } from "vitest"
import {
  assertDemoSeedAllowed,
  DemoSeedForbiddenError,
  isDemoSeedAllowed,
  resolveSeedPassword,
} from "@/lib/utils/seed-guard"

describe("demo seed guard", () => {
  it("refuses to seed in production even with the opt-in flag set", () => {
    const env = { NODE_ENV: "production", SEED_DEMO_USERS: "true" }
    expect(isDemoSeedAllowed(env)).toBe(false)
    expect(() => assertDemoSeedAllowed(env)).toThrow(DemoSeedForbiddenError)
  })

  it("refuses to seed without the explicit opt-in flag", () => {
    const env = { NODE_ENV: "development" }
    expect(isDemoSeedAllowed(env)).toBe(false)
    expect(() => assertDemoSeedAllowed(env)).toThrow(DemoSeedForbiddenError)
  })

  it("allows seeding only in non-production with SEED_DEMO_USERS=true", () => {
    const env = { NODE_ENV: "development", SEED_DEMO_USERS: "true" }
    expect(isDemoSeedAllowed(env)).toBe(true)
    expect(() => assertDemoSeedAllowed(env)).not.toThrow()
  })
})

describe("seed password resolution", () => {
  it("never falls back to a hard-coded password and generates a unique one per run", () => {
    const env = { NODE_ENV: "test", SEED_DEMO_USERS: "true" }
    const first = resolveSeedPassword(env)
    const second = resolveSeedPassword(env)

    expect(first.generated).toBe(true)
    expect(first.password).not.toBe("Password123!")
    expect(first.password).not.toEqual(second.password)
    expect(first.password.length).toBeGreaterThanOrEqual(8)
  })

  it("uses SEED_DEMO_PASSWORD when supplied and marks it as not generated", () => {
    const result = resolveSeedPassword({
      NODE_ENV: "test",
      SEED_DEMO_PASSWORD: "a-very-secret-passphrase",
    })
    expect(result).toEqual({ password: "a-very-secret-passphrase", generated: false })
  })

  it("ignores a too-short SEED_DEMO_PASSWORD", () => {
    const result = resolveSeedPassword({ NODE_ENV: "test", SEED_DEMO_PASSWORD: "short" })
    expect(result.generated).toBe(true)
  })
})
