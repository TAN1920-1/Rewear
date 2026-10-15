import type { UserRole } from "@/lib/enums"
import type { DefaultSession, DefaultJWT } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: UserRole
      ngoId: string | null
    } & DefaultSession["user"]
  }

  interface JWT extends DefaultJWT {
    id: string
    role: UserRole
    ngoId: string | null
  }

  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    ngoId: string | null
  }
}
