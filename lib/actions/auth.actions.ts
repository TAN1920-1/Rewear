"use server"

import { headers } from "next/headers"
import { signIn, auth } from "@/lib/auth/auth"
import { createUser } from "@/lib/auth/guards"
import { prisma } from "@/lib/db/prisma"
import { UserRole } from "@/lib/enums"
import {
  LoginSchema,
  type LoginSchemaType,
  RegisterSchema,
  type RegisterSchemaType,
} from "@/lib/validations/auth.schema"
import { RateLimitError, toAppError } from "@/lib/core/errors/AppError"
import { enforceRateLimit, getClientIp } from "@/lib/core/rate-limit"

const LOGIN_LIMIT = 10
const LOGIN_WINDOW_MS = 60_000 // 10 attempts / minute / (ip + email)
const REGISTER_LIMIT = 5
const REGISTER_WINDOW_MS = 60 * 60_000 // 5 sign-ups / hour / ip

function clientIp(): string {
  return getClientIp(headers())
}

function rateLimitMessage(error: unknown): string | null {
  const appError = toAppError(error)
  return appError instanceof RateLimitError ? appError.message : null
}

export async function loginAction(values: LoginSchemaType) {
  const validated = LoginSchema.safeParse(values)
  if (!validated.success) {
    return { error: "Invalid input. Please check your email and password." }
  }

  try {
    await enforceRateLimit(
      `login:${clientIp()}:${validated.data.email.toLowerCase()}`,
      LOGIN_LIMIT,
      LOGIN_WINDOW_MS
    )
  } catch (error) {
    return {
      error: rateLimitMessage(error) ?? "Unable to sign in right now. Please try again.",
    }
  }

  const result = await signIn("credentials", {
    email: validated.data.email,
    password: validated.data.password,
    redirect: false,
  })

  if (result?.error) {
    return { error: "Invalid email or password" }
  }

  // Route each role straight to its own portal.
  // Read the role from the freshly-issued JWT (no DB round-trip); fall back
  // to a single lookup only if the session cookie isn't readable yet.
  const session = await auth()
  let role = session?.user?.role as UserRole | undefined
  if (!role) {
    const account = await prisma.user.findUnique({
      where: { email: validated.data.email },
      select: { role: true },
    })
    role = account?.role as UserRole | undefined
  }

  const redirectTo =
    role === UserRole.NGO_ADMIN || role === UserRole.NGO_STAFF
      ? "/admin/dashboard"
      : "/donor/dashboard"

  return { success: true, redirectTo }
}

export async function registerAction(values: RegisterSchemaType) {
  const validated = RegisterSchema.safeParse(values)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    return { error: firstIssue?.message ?? "Invalid input. Please try again." }
  }

  try {
    await enforceRateLimit(`register:${clientIp()}`, REGISTER_LIMIT, REGISTER_WINDOW_MS)
  } catch (error) {
    return {
      error: rateLimitMessage(error) ?? "Unable to register right now. Please try again.",
    }
  }

  try {
    await createUser({
      email: validated.data.email,
      password: validated.data.password,
      name: validated.data.name,
      role: UserRole.DONOR,
    })
  } catch (error) {
    const message =
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
        ? "An account with this email already exists"
        : "Failed to create account. Please try again."
    return { error: message }
  }

  const result = await signIn("credentials", {
    email: validated.data.email,
    password: validated.data.password,
    redirect: false,
  })

  if (result?.error) {
    return { error: "Account created but failed to sign in automatically" }
  }

  return { success: true, redirectTo: "/donor/dashboard" }
}
