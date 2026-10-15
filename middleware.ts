import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"

/**
 * Edge-safe middleware. Uses the Prisma/bcrypt-free `authConfig` so the
 * Edge bundle stays lean (see `auth.config.ts` for the rationale).
 */
export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: [
    "/donor/:path*",
    "/admin/:path*",
  ],
}
