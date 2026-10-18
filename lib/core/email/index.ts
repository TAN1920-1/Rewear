import type { IEmailProvider } from "@/lib/core/interfaces/IEmailProvider"
import { SmtpEmailProvider } from "@/lib/core/providers/SmtpEmailProvider"
import { LogEmailProvider } from "@/lib/core/providers/LogEmailProvider"

/**
 * Email provider factory (polymorphism at the seam).
 * Prefers SMTP when credentials are present; otherwise falls back to a
 * console logger so development works without a mail account.
 */
let cached: IEmailProvider | null = null

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
  )
}

export function getEmailProvider(): IEmailProvider {
  if (cached) return cached
  cached = isEmailConfigured() ? new SmtpEmailProvider() : new LogEmailProvider()
  return cached
}

export type EmailProviderKind = "smtp" | "log"

export function getEmailProviderKind(): EmailProviderKind {
  return isEmailConfigured() ? "smtp" : "log"
}
