import { getEmailProvider, getEmailProviderKind } from "@/lib/core/email"
import type { SendEmailInput } from "@/lib/core/interfaces/IEmailProvider"

export interface DonationEmailItem {
  categoryName: string
  size?: string | null
  condition: string
  quantity: number
  description?: string | null
}

export interface ManagerNotificationInput {
  donationCode: string
  donorName: string
  donorEmail: string
  donorPhone?: string | null
  pickupAddress?: string | null
  notes?: string | null
  campaignName?: string | null
  items: DonationEmailItem[]
  totalItems: number
  submittedAt: Date
  ngoName: string
  approveUrl: string
  rejectUrl: string
  expiresAt: Date
}

export interface DonorDecisionInput {
  to: string
  donorName: string
  donationCode: string
  decision: "APPROVED" | "REJECTED"
  reason?: string | null
  ngoName: string
  trackUrl: string
}

/** Generic low-level send. Returns which provider handled the message. */
export async function sendEmail(input: SendEmailInput): Promise<{ provider: string }> {
  const provider = getEmailProvider()
  await provider.send(input)
  return { provider: provider.name }
}

/* ------------------------------------------------------------------ */
/* Manager notification                                                */
/* ------------------------------------------------------------------ */

export async function sendManagerDonationNotification(
  input: ManagerNotificationInput
): Promise<{ provider: string }> {
  const {
    donationCode,
    donorName,
    donorEmail,
    donorPhone,
    pickupAddress,
    notes,
    campaignName,
    items,
    totalItems,
    submittedAt,
    ngoName,
    approveUrl,
    rejectUrl,
    expiresAt,
  } = input

  const itemRows = items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${esc(i.categoryName)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${esc(i.size || "—")}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${esc(
            i.condition.replace(/_/g, " ")
          )}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;">${i.quantity}</td>
        </tr>`
    )
    .join("")

  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;">
      A new cloth donation has been submitted and needs your approval.
    </p>

    <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;color:#0f172a;">
      <tr><td style="padding:6px 0;width:170px;color:#64748b;">Donation ID</td><td style="padding:6px 0;font-weight:600;">${esc(
        donationCode
      )}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">NGO</td><td style="padding:6px 0;">${esc(ngoName)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Submitted</td><td style="padding:6px 0;">${esc(
        submittedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      )} IST</td></tr>
      ${campaignName ? `<tr><td style="padding:6px 0;color:#64748b;">Campaign</td><td style="padding:6px 0;">${esc(campaignName)}</td></tr>` : ""}
      <tr><td style="padding:6px 0;color:#64748b;">Total pieces</td><td style="padding:6px 0;font-weight:600;">${totalItems}</td></tr>
    </table>

    <h3 style="margin:24px 0 8px;font-size:15px;color:#0f172a;">Donor contact</h3>
    <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;color:#0f172a;">
      <tr><td style="padding:6px 0;width:170px;color:#64748b;">Name</td><td style="padding:6px 0;">${esc(donorName)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Email</td><td style="padding:6px 0;"><a href="mailto:${esc(
        donorEmail
      )}" style="color:#0d9488;">${esc(donorEmail)}</a></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Phone</td><td style="padding:6px 0;">${
        donorPhone ? esc(donorPhone) : "—"
      }</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;vertical-align:top;">Pickup / drop-off</td><td style="padding:6px 0;">${
        pickupAddress ? esc(pickupAddress).replace(/\n/g, "<br/>") : "—"
      }</td></tr>
      ${notes ? `<tr><td style="padding:6px 0;color:#64748b;vertical-align:top;">Notes</td><td style="padding:6px 0;">${esc(
        notes
      ).replace(/\n/g, "<br/>")}</td></tr>` : ""}
    </table>

    <h3 style="margin:24px 0 8px;font-size:15px;color:#0f172a;">Cloth details</h3>
    <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;color:#0f172a;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#f1f5f9;text-align:left;">
          <th style="padding:8px 10px;font-weight:600;">Category</th>
          <th style="padding:8px 10px;font-weight:600;">Size</th>
          <th style="padding:8px 10px;font-weight:600;">Condition</th>
          <th style="padding:8px 10px;font-weight:600;text-align:right;">Qty</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="margin:28px 0 8px;text-align:center;">
      <a href="${approveUrl}" style="display:inline-block;padding:12px 28px;margin:0 6px 10px;border-radius:10px;background:#059669;color:#ffffff;font-weight:600;text-decoration:none;">Approve donation</a>
      <a href="${rejectUrl}" style="display:inline-block;padding:12px 28px;margin:0 6px 10px;border-radius:10px;background:#ffffff;color:#be123c;border:1px solid #fecdd3;font-weight:600;text-decoration:none;">Reject donation</a>
    </div>

    <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
      These links are single-use and expire on ${esc(
        expiresAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      )} IST. No login required.
    </p>
  `

  return sendEmail({
    to: getManagerRecipients(),
    subject: `[Action required] New donation ${donationCode} from ${donorName}`,
    html: emailLayout("New donation awaiting approval", body, ngoName),
    replyTo: donorEmail,
  })
}

/* ------------------------------------------------------------------ */
/* Donor decision confirmation                                         */
/* ------------------------------------------------------------------ */

export async function sendDonorDecisionEmail(
  input: DonorDecisionInput
): Promise<{ provider: string }> {
  const { to, donorName, donationCode, decision, reason, ngoName, trackUrl } = input
  const approved = decision === "APPROVED"

  const headline = approved
    ? `Great news — your donation has been accepted!`
    : `An update about your donation`

  const message = approved
    ? `Thank you, ${esc(donorName)}. Our team has reviewed and <strong>accepted</strong> your donation <strong>${esc(
        donationCode
      )}</strong>. We will be in touch regarding pickup/handover and you can follow its journey online.`
    : `Dear ${esc(donorName)}, after review we are unable to accept your donation <strong>${esc(
        donationCode
      )}</strong> at this time.${
        reason ? ` Reason: <em>${esc(reason)}</em>.` : ""
      } We sincerely appreciate your kindness and hope to welcome a future donation.`

  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;">${message}</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="${trackUrl}" style="display:inline-block;padding:12px 28px;border-radius:10px;background:#0d9488;color:#ffffff;font-weight:600;text-decoration:none;">Track your donation</a>
    </div>
    <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">With gratitude,<br/>${esc(ngoName)}</p>
  `

  return sendEmail({
    to,
    subject: approved
      ? `Your donation ${donationCode} has been accepted`
      : `Update on your donation ${donationCode}`,
    html: emailLayout(headline, body, ngoName),
  })
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getManagerRecipients(): string[] {
  const raw = process.env.MANAGER_EMAIL
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  }
  // Sensible fallback so the flow never silently dies if MANAGER_EMAIL is unset.
  return ["tanishqgames203@gmail.com"]
}

export function getEmailDeliveryKind(): "smtp" | "log" {
  return getEmailProviderKind()
}

function emailLayout(heading: string, body: string, ngoName: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#10b981,#0d9488);padding:22px 28px;">
        <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;">${esc(
          ngoName
        )}</p>
        <p style="margin:2px 0 0;color:rgba(255,255,255,0.85);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Clothing donation programme</p>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 18px;font-size:20px;color:#0f172a;">${esc(heading)}</h1>
        ${body}
      </div>
      <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">This is an automated message from the ${esc(
          ngoName
        )} donation platform.</p>
      </div>
    </div>
  </body>
</html>`
}

/** Escape untrusted values before interpolation into HTML. */
function esc(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
