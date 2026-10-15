import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import * as bcrypt from "bcryptjs"
import { prisma } from "@/lib/db/prisma"
import { authConfig } from "@/lib/auth/auth.config"
import type { UserRole } from "@/lib/enums"

/**
 * Full (Node runtime) NextAuth instance.
 *
 * Extends the Edge-safe `authConfig` with the Credentials provider, which
 * touches Prisma + bcrypt and therefore must never reach the Edge runtime.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
            ngoId: true,
            isActive: true,
          },
        })

        if (!user || !user.passwordHash || !user.isActive) return null

        const isPasswordValid = await bcrypt.compare(
          String(credentials.password),
          user.passwordHash
        )

        if (!isPasswordValid) return null

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          ngoId: user.ngoId ? String(user.ngoId) : null,
        }
      },
    }),
  ],
})
