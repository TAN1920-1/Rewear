import nodemailer, { type Transporter } from "nodemailer"
import type { IEmailProvider, SendEmailInput } from "@/lib/core/interfaces/IEmailProvider"

/**
 * SMTP email provider (nodemailer).
 *
 * Works with any SMTP relay: a dedicated Gmail account (App Password),
 * Resend's SMTP endpoint (`smtp.resend.com`), SendGrid, Mailgun, etc.
 * Encapsulation: the transporter is created once and reused (connection
 * pooling) — never re-created per send.
 */
export class SmtpEmailProvider implements IEmailProvider {
  readonly name = "smtp"
  private transporter: Transporter

  constructor() {
    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT ?? 587)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASSWORD

    if (!host || !user || !pass) {
      throw new Error(
        "SMTP is not fully configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASSWORD."
      )
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      // Port 465 uses implicit TLS; 587/25 use STARTTLS.
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: { user, pass },
      pool: true,
      maxConnections: 3,
    })
  }

  async send({ to, subject, html, text, replyTo }: SendEmailInput): Promise<void> {
    const from =
      process.env.EMAIL_FROM ??
      `REWEAR Donations <${process.env.SMTP_USER}>`

    await this.transporter.sendMail({
      from,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      text: text ?? htmlToText(html),
      replyTo: replyTo || undefined,
    })
  }
}

/** Very small HTML → plaintext fallback so every mail is multipart. */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
