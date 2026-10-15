import type { NextAuthConfig } from "next-auth"
import type { UserRole } from "@/lib/enums"

/**
 * Edge-safe NextAuth configuration.
 *
 * This module MUST NOT import Prisma or bcryptjs: it is loaded by
 * `middleware.ts`, which runs in the Edge runtime where Node-only APIs
 * (and the Prisma query engine) are unavailable. The Credentials provider
 * — the only Node-dependent piece — lives in `auth.ts` instead.
 *
 * The `jwt`/`session` callbacks only ever read from the token, so they are
 * safe to run on the Edge.
 */
export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    /**
     * Gatekeeper executed by the Edge middleware for every matched route
     * (`/admin/**`, `/donor/**`). Returning `false` makes NextAuth redirect
     * unauthenticated users to `pages.signIn` before any page renders —
     * this is the layer that was previously missing.
     */
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user)
      const { pathname } = request.nextUrl
      const isProtected =
        pathname.startsWith("/admin") || pathname.startsWith("/donor")
      return isProtected ? isLoggedIn : true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.ngoId = user.ngoId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.ngoId = (token.ngoId as string | null) ?? null
      }
      return session
    },
  },
} satisfies NextAuthConfig
