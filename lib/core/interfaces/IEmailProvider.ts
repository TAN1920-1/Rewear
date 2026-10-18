/**
 * Email provider abstraction.
 *
 * OOP pillars:
 *  - Abstraction : callers depend only on `IEmailProvider`, never on
 *                  nodemailer/SMTP details.
 *  - Polymorphism: `SmtpEmailProvider` and `LogEmailProvider` are
 *                  interchangeable at runtime (selected via `getEmailProvider`).
 *
 * Credentials live exclusively in environment variables (see `.env.example`);
 * nothing here ever reaches the browser bundle.
 */

export interface SendEmailInput {
  /** One or more recipients. */
  to: string | string[]
  subject: string
  html: string
  text?: string
  /** Optional Reply-To (e.g. the donor's address on manager notifications). */
  replyTo?: string
}

export interface IEmailProvider {
  /** Human-readable provider name (for logs / diagnostics). */
  readonly name: string
  /** Deliver an email. Throws on hard failure. */
  send(input: SendEmailInput): Promise<void>
}
