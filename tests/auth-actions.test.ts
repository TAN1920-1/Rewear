import { beforeEach, describe, expect, it, vi } from "vitest"
import { RateLimitError } from "@/lib/core/errors/AppError"

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  getSessionUser: vi.fn(),
  signIn: vi.fn(),
  auth: vi.fn(),
  enforceRateLimit: vi.fn(),
  findUnique: vi.fn(),
  updateUser: vi.fn(),
  bcryptCompare: vi.fn(),
  bcryptHash: vi.fn(),
}))

vi.mock("@/lib/auth/guards", () => ({
  createUser: mocks.createUser,
  getSessionUser: mocks.getSessionUser,
  hashPassword: vi.fn(async () => "hashed"),
}))

vi.mock("@/lib/auth/auth", () => ({
  signIn: mocks.signIn,
  auth: mocks.auth,
}))

vi.mock("@/lib/db/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique, update: mocks.updateUser } },
}))

vi.mock("@/lib/core/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
  getClientIp: () => "127.0.0.1",
}))

vi.mock("bcryptjs", () => ({
  compare: mocks.bcryptCompare,
  hash: mocks.bcryptHash,
}))

vi.mock("next/headers", () => ({
  headers: () => ({ get: () => null }),
}))

import { changeOwnPasswordAction, loginAction, registerAction } from "@/lib/actions/auth.actions"

const validRegistration = {
  name: "Test Donor",
  email: "donor@example.com",
  password: "secret123",
  confirmPassword: "secret123",
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.enforceRateLimit.mockResolvedValue(undefined)
  mocks.signIn.mockResolvedValue({})
})

describe("registerAction", () => {
  it("registers a donor and always assigns the DONOR role server-side", async () => {
    mocks.createUser.mockResolvedValue({ id: 1, role: "DONOR" })

    const result = await registerAction(validRegistration)

    expect(result).toEqual({ success: true, redirectTo: "/donor/dashboard" })
    expect(mocks.createUser).toHaveBeenCalledTimes(1)
    expect(mocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: "DONOR", email: validRegistration.email })
    )
  })

  it("ignores a privileged role injected into the payload and still creates a DONOR", async () => {
    mocks.createUser.mockResolvedValue({ id: 2, role: "DONOR" })

    const result = await registerAction({
      ...validRegistration,
      role: "NGO_ADMIN",
    } as unknown as typeof validRegistration)

    expect(result.success).toBe(true)
    const arg = mocks.createUser.mock.calls[0][0] as { role: string }
    expect(arg.role).toBe("DONOR")
  })

  it("rejects an invalid email before creating any account", async () => {
    const result = await registerAction({ ...validRegistration, email: "nope" })
    expect(result.error).toBeTruthy()
    expect(mocks.createUser).not.toHaveBeenCalled()
  })

  it("rejects a weak password before creating any account", async () => {
    const result = await registerAction({
      ...validRegistration,
      password: "123",
      confirmPassword: "123",
    })
    expect(result.error).toBeTruthy()
    expect(mocks.createUser).not.toHaveBeenCalled()
  })

  it("rejects a password/confirmation mismatch", async () => {
    const result = await registerAction({ ...validRegistration, confirmPassword: "nope-nope" })
    expect(result.error).toBeTruthy()
    expect(mocks.createUser).not.toHaveBeenCalled()
  })

  it("reports a duplicate email with a safe, useful message", async () => {
    mocks.createUser.mockRejectedValue(
      new Error('Unique constraint failed on the fields: (`email`)')
    )
    const result = await registerAction(validRegistration)
    expect(result.error).toMatch(/already exists/i)
  })

  it("returns a safe message when the registration rate limit is hit", async () => {
    mocks.enforceRateLimit.mockRejectedValue(new RateLimitError(120))
    const result = await registerAction(validRegistration)
    expect(result.error).toMatch(/too many|try again/i)
    expect(mocks.createUser).not.toHaveBeenCalled()
  })
})

describe("loginAction", () => {
  it("routes NGO admins to the admin dashboard", async () => {
    mocks.auth.mockResolvedValue({ user: { role: "NGO_ADMIN" } })
    const result = await loginAction({ email: "admin@rewear.org", password: "secret123" })
    expect(result).toEqual({ success: true, redirectTo: "/admin/dashboard" })
  })

  it("routes donors to the donor dashboard", async () => {
    mocks.auth.mockResolvedValue({ user: { role: "DONOR" } })
    const result = await loginAction({ email: "donor@example.com", password: "secret123" })
    expect(result).toEqual({ success: true, redirectTo: "/donor/dashboard" })
  })

  it("returns a generic message on invalid credentials", async () => {
    mocks.signIn.mockResolvedValue({ error: "CredentialsSignin" })
    const result = await loginAction({ email: "donor@example.com", password: "wrong" })
    expect(result).toEqual({ error: "Invalid email or password" })
  })

  it("rejects invalid input without calling signIn", async () => {
    const result = await loginAction({ email: "bad", password: "" })
    expect(result.error).toBeTruthy()
    expect(mocks.signIn).not.toHaveBeenCalled()
  })

  it("returns a safe message when the login rate limit is hit", async () => {
    mocks.enforceRateLimit.mockRejectedValue(new RateLimitError(60))
    const result = await loginAction({ email: "donor@example.com", password: "secret123" })
    expect(result.error).toMatch(/too many|try again/i)
    expect(mocks.signIn).not.toHaveBeenCalled()
  })
})

describe("changeOwnPasswordAction", () => {
  const validChange = {
    currentPassword: "secret123",
    newPassword: "newsecret456",
    confirmPassword: "newsecret456",
  }

  it("rejects an invalid payload before touching the database", async () => {
    const result = await changeOwnPasswordAction({ ...validChange, newPassword: "123" })
    expect(result.error).toBeTruthy()
    expect(mocks.findUnique).not.toHaveBeenCalled()
    expect(mocks.updateUser).not.toHaveBeenCalled()
  })

  it("refuses to change a password without an active session", async () => {
    mocks.getSessionUser.mockResolvedValue(null)
    const result = await changeOwnPasswordAction(validChange)
    expect(result.error).toMatch(/signed in/i)
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })

  it("returns a safe message when the password rate limit is hit", async () => {
    mocks.getSessionUser.mockResolvedValue({ id: 7 })
    mocks.enforceRateLimit.mockRejectedValue(new RateLimitError(300))
    const result = await changeOwnPasswordAction(validChange)
    expect(result.error).toMatch(/too many|try again/i)
    expect(mocks.updateUser).not.toHaveBeenCalled()
  })

  it("rejects when the account cannot be found", async () => {
    mocks.getSessionUser.mockResolvedValue({ id: 7 })
    mocks.findUnique.mockResolvedValue(null)
    const result = await changeOwnPasswordAction(validChange)
    expect(result.error).toMatch(/not found/i)
    expect(mocks.updateUser).not.toHaveBeenCalled()
  })

  it("rejects an incorrect current password and never writes a new one", async () => {
    mocks.getSessionUser.mockResolvedValue({ id: 7 })
    mocks.findUnique.mockResolvedValue({ passwordHash: "old-hash" })
    mocks.bcryptCompare.mockResolvedValue(false)

    const result = await changeOwnPasswordAction(validChange)

    expect(result.error).toMatch(/current password is incorrect/i)
    expect(mocks.updateUser).not.toHaveBeenCalled()
  })

  it("updates the password for the session user with a fresh hash", async () => {
    mocks.getSessionUser.mockResolvedValue({ id: 7 })
    mocks.findUnique.mockResolvedValue({ passwordHash: "old-hash" })
    mocks.bcryptCompare.mockResolvedValue(true)
    mocks.bcryptHash.mockResolvedValue("new-hash")
    mocks.updateUser.mockResolvedValue({ id: 7 })

    const result = await changeOwnPasswordAction(validChange)

    expect(result).toEqual({ success: true })
    expect(mocks.updateUser).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { passwordHash: "new-hash" },
    })
  })

  it("derives the target account from the session, ignoring any supplied id", async () => {
    mocks.getSessionUser.mockResolvedValue({ id: 42 })
    mocks.findUnique.mockResolvedValue({ passwordHash: "old-hash" })
    mocks.bcryptCompare.mockResolvedValue(true)
    mocks.bcryptHash.mockResolvedValue("new-hash")
    mocks.updateUser.mockResolvedValue({ id: 42 })

    await changeOwnPasswordAction({ ...validChange, id: 1 } as unknown as typeof validChange)

    expect(mocks.updateUser).toHaveBeenCalledTimes(1)
    expect(mocks.updateUser.mock.calls[0][0]).toMatchObject({ where: { id: 42 } })
  })
})
