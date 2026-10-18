import { afterEach, describe, expect, it, vi } from "vitest"
import { LogEmailProvider } from "@/lib/core/providers/LogEmailProvider"

// `process.env.NODE_ENV` is typed read-only; this cast lets the test flip it.
const env = process.env as Record<string, string | undefined>
const originalNodeEnv = process.env.NODE_ENV

afterEach(() => {
  env.NODE_ENV = originalNodeEnv
  vi.restoreAllMocks()
})

describe("LogEmailProvider", () => {
  it("prints the message body in development so the flow can be exercised", async () => {
    env.NODE_ENV = "development"
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const provider = new LogEmailProvider()

    await provider.send({
      to: "manager@example.com",
      subject: "Approve donation",
      html: "<a href='https://example.com/approve?token=SECRET_TOKEN'>Approve</a>",
    })

    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain("SECRET_TOKEN")
  })

  it("suppresses the body in production so approval tokens never reach the logs", async () => {
    env.NODE_ENV = "production"
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const provider = new LogEmailProvider()

    await provider.send({
      to: "manager@example.com",
      subject: "Approve donation",
      html: "<a href='https://example.com/approve?token=SECRET_TOKEN'>Approve</a>",
    })

    expect(warn).toHaveBeenCalledTimes(1)
    const output = String(warn.mock.calls[0][0])
    expect(output).not.toContain("SECRET_TOKEN")
    expect(output).toMatch(/suppressed/i)
  })
})
