import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { UserRole } from "@/lib/enums"
import {
  AuthError,
  ForbiddenError,
  NotFoundError,
  toAppError,
} from "@/lib/core/errors/AppError"
import { enforceRateLimit } from "@/lib/core/rate-limit"
import {
  buildReceiptNumber,
  generateDonationReceiptPDF,
} from "@/lib/services/pdf.service"

export const runtime = "nodejs"

/**
 * Secured PDF receipt download.
 *
 * Authorization is enforced server-side on the fetched record:
 *  - DONOR   → only their own donation
 *  - STAFF   → only donations belonging to their NGO
 *  - ADMIN   → only donations belonging to their NGO
 * Downloading creates (once) a stable `DonationReceipt` row.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { donationId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new AuthError()

    const userId = Number(session.user.id)
    const role = session.user.role as UserRole
    const ngoId = session.user.ngoId ? Number(session.user.ngoId) : null

    await enforceRateLimit(`receipt:${userId}`, 30, 60_000)

    const donation = await prisma.donation.findUnique({
      where: { donationId: params.donationId.trim().toUpperCase() },
      include: {
        items: { include: { category: true } },
        ngo: true,
        donor: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    if (!donation) throw new NotFoundError("Donation not found.")

    if (role === UserRole.DONOR) {
      if (donation.donorId !== userId) throw new ForbiddenError()
    } else if (role === UserRole.NGO_ADMIN || role === UserRole.NGO_STAFF) {
      if (ngoId === null || donation.ngoId !== ngoId) throw new ForbiddenError()
    } else {
      throw new ForbiddenError()
    }

    // Stable, deterministic receipt number (idempotent across retries).
    const receiptNumber = buildReceiptNumber(donation.donationId, donation.id)
    await prisma.donationReceipt.upsert({
      where: { donationId: donation.id },
      create: {
        donationId: donation.id,
        ngoId: donation.ngoId,
        generatedBy: userId,
        receiptNumber,
      },
      update: {},
      select: { id: true },
    })

    const pdf = await generateDonationReceiptPDF({
      donation,
      ngo: donation.ngo,
      donor: donation.donor,
      receiptNo: receiptNumber,
      generatedAt: new Date(),
    })

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${donation.donationId}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    const appError = toAppError(error)
    return NextResponse.json(appError.toJSON(), { status: appError.statusCode })
  }
}
