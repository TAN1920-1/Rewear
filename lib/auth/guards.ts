import * as bcrypt from "bcryptjs"
import { cache } from "react"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth/auth"
import { UserRole } from "@/lib/enums"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createUser(data: {
  email: string
  password: string
  name: string
  role: UserRole
  phone?: string
  ngoId?: number
}) {
  const passwordHash = await hashPassword(data.password)
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
      phone: data.phone,
      ngoId: data.ngoId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      ngoId: true,
      isActive: true,
      phone: true,
    },
  })
}

/** Minimal authenticated identity derived purely from the signed JWT. */
export interface SessionUser {
  id: number
  email: string
  name: string
  role: UserRole
  ngoId: number | null
}

/**
 * Decode the JWT session into a typed user — NO database round-trip.
 *
 * Wrapped in `cache()` so the cookie is decoded at most once per request
 * regardless of how many layouts/pages call it. This is what makes role
 * guards effectively free on the hot navigation path.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  return {
    id: Number(session.user.id),
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: session.user.role as UserRole,
    ngoId: session.user.ngoId ? Number(session.user.ngoId) : null,
  }
})

/**
 * Full user record (incl. `phone`/`isActive`) — hits the database once per
 * request, then deduped by `cache()`. Use only where extended fields are
 * actually needed; prefer `requireRole`/`getSessionUser` everywhere else.
 */
export const getCurrentUser = cache(async () => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return null

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      ngoId: true,
      isActive: true,
      phone: true,
    },
  })

  if (!user || !user.isActive) return null
  return {
    ...user,
    role: user.role as UserRole,
  }
})

export async function requireAuthenticated(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuthenticated()
  if (!roles.includes(user.role)) {
    redirect("/forbidden")
  }
  return user
}
