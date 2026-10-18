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

    // Message bodies contain single-use approval links (i.e. live tokens).
    // They may be printed during local development to exercise the workflow,
    // but NEVER in production — a misconfigured deployment must not leak
    // approval tokens into logs. Only a delivery summary is emitted there.
    const body =
      process.env.NODE_ENV === "production"
        ? "[body suppressed in production — configure SMTP_* so this message is delivered instead of logged]"
        : text ?? html

    // eslint-disable-next-line no-console
    console.warn(
      [
        "",
        "──────────────────────── EMAIL (not delivered — SMTP not configured) ────────────────────────",
        `To      : ${recipients}`,
        `Subject : ${subject}`,
        "",
        body,
        "──────────────────────────────────────────────────────────────────────────────────────────────",
        "Configure SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD (and EMAIL_FROM) to send real email.",
        "",
      ].join("\n")
    )
  }
}
