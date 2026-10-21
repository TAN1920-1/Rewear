import { describe, expect, it } from "vitest"
import { ChangePasswordSchema, LoginSchema, RegisterSchema } from "@/lib/validations/auth.schema"

const validRegistration = {
  name: "Test Donor",
  email: "donor@example.com",
  password: "secret123",
  confirmPassword: "secret123",
}

describe("RegisterSchema", () => {
  it("accepts a valid registration", () => {
    expect(RegisterSchema.safeParse(validRegistration).success).toBe(true)
  })

  it("rejects an invalid email", () => {
    expect(RegisterSchema.safeParse({ ...validRegistration, email: "not-an-email" }).success).toBe(
      false
    )
  })

  it("rejects a weak / too-short password", () => {
    const result = RegisterSchema.safeParse({
      ...validRegistration,
      password: "123",
      confirmPassword: "123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a password / confirmation mismatch", () => {
    const result = RegisterSchema.safeParse({
      ...validRegistration,
      confirmPassword: "different-password",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("confirmPassword"))).toBe(true)
    }
  })

  it("strips any privileged role supplied by the client (no escalation path)", () => {
    const result = RegisterSchema.safeParse({ ...validRegistration, role: "NGO_ADMIN" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect("role" in result.data).toBe(false)
    }
  })
})

describe("ChangePasswordSchema", () => {
  const validChange = {
    currentPassword: "secret123",
    newPassword: "newsecret456",
    confirmPassword: "newsecret456",
  }

  it("accepts a valid change", () => {
    expect(ChangePasswordSchema.safeParse(validChange).success).toBe(true)
  })

  it("rejects an empty current password", () => {
    expect(ChangePasswordSchema.safeParse({ ...validChange, currentPassword: "" }).success).toBe(
      false
    )
  })

  it("rejects a too-short new password", () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: "secret123",
      newPassword: "123",
      confirmPassword: "123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a new / confirmation mismatch", () => {
    const result = ChangePasswordSchema.safeParse({
      ...validChange,
      confirmPassword: "different-password",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("confirmPassword"))).toBe(true)
    }
  })

  it("rejects a new password identical to the current one", () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: "secret123",
      newPassword: "secret123",
      confirmPassword: "secret123",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("newPassword"))).toBe(true)
    }
  })
})

describe("LoginSchema", () => {
  it("rejects an invalid email", () => {
    expect(LoginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false)
  })

  it("rejects an empty password", () => {
    expect(LoginSchema.safeParse({ email: "donor@example.com", password: "" }).success).toBe(false)
  })

  it("accepts a well-formed credential pair", () => {
    expect(LoginSchema.safeParse({ email: "donor@example.com", password: "secret123" }).success).toBe(
      true
    )
  })
})
