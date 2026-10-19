import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ headers: vi.fn() }))

vi.mock("next/headers", () => ({ headers: mocks.headers }))
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }))
vi.mock("@/lib/services/email.service", () => ({
  sendManagerDonationNotification: vi.fn(),
  sendDonorDecisionEmail: vi.fn(),
}))

import { getSiteUrl } from "@/lib/services/donation-approval.service"

function hdrs(map: Record<string, string>) {
  return { get: (key: string) => map[key] ?? null }
}

afterEach(() => {
  vi.unstubAllEnvs()
  mocks.headers.mockReset()
})

describe("getSiteUrl — emailed links must never point at localhost", () => {
  it("uses an explicit public production URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://rewear-rust.vercel.app")
    vi.stubEnv("AUTH_URL", "http://localhost:3000")
    mocks.headers.mockReturnValue(hdrs({ "x-forwarded-host": "example.com" }))
    expect(getSiteUrl()).toBe("https://rewear-rust.vercel.app")
  })

  it("ignores a localhost config and falls back to the real request host", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")
    vi.stubEnv("AUTH_URL", "http://localhost:3000")
    mocks.headers.mockReturnValue(
      hdrs({ "x-forwarded-host": "rewear-rust.vercel.app", "x-forwarded-proto": "https" })
    )
    expect(getSiteUrl()).toBe("https://rewear-rust.vercel.app")
  })

  it("derives https from x-forwarded headers when nothing is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "")
    vi.stubEnv("AUTH_URL", "")
    mocks.headers.mockReturnValue(
      hdrs({ "x-forwarded-host": "rewear-rust.vercel.app", "x-forwarded-proto": "https" })
    )
    expect(getSiteUrl()).toBe("https://rewear-rust.vercel.app")
  })

  it("uses http for a plain localhost request host", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "")
    vi.stubEnv("AUTH_URL", "")
    mocks.headers.mockReturnValue(hdrs({ host: "localhost:3001" }))
    expect(getSiteUrl()).toBe("http://localhost:3001")
  })

  it("strips a trailing slash from the configured URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://rewear-rust.vercel.app/")
    mocks.headers.mockReturnValue(hdrs({}))
    expect(getSiteUrl()).toBe("https://rewear-rust.vercel.app")
  })

  it("falls back to the configured URL when there is no request scope", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")
    mocks.headers.mockImplementation(() => {
      throw new Error("headers() called outside a request scope")
    })
    expect(getSiteUrl()).toBe("http://localhost:3000")
  })
})
