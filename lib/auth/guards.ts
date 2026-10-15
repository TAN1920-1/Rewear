import * as bcrypt from "bcryptjs"
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

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = Number(session.user.id)
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
}

export async function requireAuthenticated() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireAuthenticated()
  if (!roles.includes(user.role as UserRole)) {
    redirect("/forbidden")
  }
  return user
}
