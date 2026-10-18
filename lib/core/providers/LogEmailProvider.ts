import type { IEmailProvider, SendEmailInput } from "@/lib/core/interfaces/IEmailProvider"

/**
 * Development fallback used ONLY when SMTP credentials are absent.
 *
 * It does not deliver mail — it prints the fully-rendered message (including
 * any approve/reject links) to the server console so the end-to-end workflow
 * can be exercised locally without a mail account. In production, configure
 * SMTP_* env vars and this provider is never selected.
 */
export class LogEmailProvider implements IEmailProvider {
  readonly name = "log"

  async send({ to, subject, html, text }: SendEmailInput): Promise<void> {
    const recipients = Array.isArray(to) ? to.join(", ") : to
    // eslint-disable-next-line no-console
    console.warn(
      [
        "",
        "──────────────────────── EMAIL (not delivered — SMTP not configured) ────────────────────────",
        `To      : ${recipients}`,
        `Subject : ${subject}`,
        "",
        text ?? html,
        "──────────────────────────────────────────────────────────────────────────────────────────────",
        "Configure SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD (and EMAIL_FROM) to send real email.",
        "",
      ].join("\n")
    )
  }
}
