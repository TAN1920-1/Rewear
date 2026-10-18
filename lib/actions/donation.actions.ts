"use server"

import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/guards"
import { CreateDonationSchema, CreateDonationSchemaType } from "@/lib/validations/donation.schema"
import { DonationStatus } from "@/lib/enums"
import { ZodError, z } from "zod"
import { advanceDonationStatus } from "@/lib/services/donation.service"
import { sendDonationSubmittedNotifications } from "@/lib/services/donation-approval.service"
import { revalidatePath } from "next/cache"
import { generateDonationId, isUniqueConstraintError } from "@/lib/utils/donation-id"

export interface ServerActionResult<T = unknown> {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  data?: T
}

/** Bounded retries when a randomly generated tracking ID happens to collide. */
const DONATION_ID_MAX_ATTEMPTS = 5

const AdvanceStatusSchema = z.object({
  donationId: z.coerce.number().int().positive(),
  nextStatus: z.nativeEnum(DonationStatus),
  note: z.string().max(500).optional(),
})

export async function getDonationFormOptions(): Promise<
  ServerActionResult<{
    categories: Array<{ id: number; name: string; slug: string; ngoId: number }>
    campaigns: Array<{ id: number; name: string }>
    user: { id: number; name: string; email: string; phone: string | null } | null
  }>
> {
  try {
    const [categories, campaigns, user] = await Promise.all([
      prisma.clothingCategory.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, ngoId: true },
      }),
      prisma.campaign.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { startDate: "desc" },
      }),
      getCurrentUser(),
    ])
    return {
      success: true,
      data: {
        categories,
        campaigns,
        user: user
          ? { id: user.id, name: user.name, email: user.email, phone: user.phone ?? null }
          : null,
      },
    }
  } catch (err: any) {
    console.error("getDonationFormOptions error", err)
    return { success: false, error: "Failed to load donation options. Please try again." }
  }
}

export async function submitDonationAction(
  values: CreateDonationSchemaType
): Promise<ServerActionResult<{ id: number; donationId: string; emailSent: boolean }>> {
  try {
    const validated = CreateDonationSchema.parse(values)
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Authentication required. Please sign in." }
    }

    const validItems = validated.items.filter((i) => i.categoryId > 0)
    if (validItems.length === 0) {
      return {
        success: false,
        error: "Please add at least one item with a valid category.",
      }
    }

    // Ownership is derived from the authenticated session; the NGO is resolved
    // from the chosen categories rather than trusted from the client.
    const sampleCategory = await prisma.clothingCategory.findFirst({
      where: { id: { in: validItems.map((i) => i.categoryId) } },
      select: { ngoId: true },
    })
    if (!sampleCategory) {
      return {
        success: false,
        error: "One or more selected categories are invalid. Please review your items.",
      }
    }

    const ngoId = sampleCategory.ngoId
    const totalItems = validItems.reduce((sum, it) => sum + it.quantity, 0)

    // The tracking ID is generated server-side from a CSPRNG and the whole
    // record (items + status history) is written in a single atomic create.
    // On the rare unique-constraint collision we simply draw a new ID.
    let donation: { id: number; donationId: string } | undefined
    for (let attempt = 0; attempt < DONATION_ID_MAX_ATTEMPTS; attempt++) {
      try {
        donation = await prisma.donation.create({
          data: {
            donationId: generateDonationId(),
            donorId: user.id,
            ngoId,
            donorName: validated.donorName,
            donorEmail: validated.donorEmail,
            donorPhone: validated.donorPhone || undefined,
            pickupAddress: validated.pickupAddress || undefined,
            notes: validated.notes || undefined,
            campaignId: validated.campaignId,
            totalItems,
            currentStatus: DonationStatus.SUBMITTED,
            items: {
              create: validItems.map((item) => ({
                categoryId: item.categoryId,
                size: item.size,
                condition: item.condition,
                quantity: item.quantity,
                description: item.description || undefined,
              })),
            },
            statusHistory: {
              create: {
                status: DonationStatus.SUBMITTED,
                changedBy: user.id,
                note: "Donation submitted by donor",
              },
            },
            ...(validated.campaignId
              ? {
                  campaignDonations: {
                    create: {
                      campaignId: validated.campaignId,
                      itemsCount: totalItems,
                    },
                  },
                }
              : {}),
          },
          select: { id: true, donationId: true },
        })
        break
      } catch (err) {
        if (isUniqueConstraintError(err) && attempt < DONATION_ID_MAX_ATTEMPTS - 1) {
          continue
        }
        throw err
      }
    }

    if (!donation) {
      return {
        success: false,
        error: "Could not register your donation right now. Please try again.",
      }
    }

    // Email-based approval: mint a single-use token and notify the manager.
    // The donation is already committed, so a mail outage can never duplicate
    // or roll it back — the outcome is only reported back to the caller.
    const emailResult = await sendDonationSubmittedNotifications(donation.id)

    return {
      success: true,
      data: { id: donation.id, donationId: donation.donationId, emailSent: emailResult.emailSent },
    }
  } catch (err: any) {
    if (err instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      for (const [k, v] of Object.entries(err.formErrors.fieldErrors)) {
        if (Array.isArray(v)) fieldErrors[k] = v as string[]
      }
      return {
        success: false,
        error: "Please fix the validation errors below.",
        fieldErrors,
      }
    }
    console.error("submitDonationAction error", err)
    return {
      success: false,
      error: "Failed to submit donation. Please try again.",
    }
  }
}

export async function advanceDonationStatusAction(
  donationId: number,
  nextStatus: string,
  note?: string
): Promise<ServerActionResult> {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "NGO_ADMIN" && user.role !== "NGO_STAFF") || !user.ngoId) {
      return { success: false, error: "Unauthorized" }
    }

    const parsed = AdvanceStatusSchema.safeParse({ donationId, nextStatus, note })
    if (!parsed.success) {
      return { success: false, error: "Invalid status update request." }
    }

    await advanceDonationStatus({
      donationId: parsed.data.donationId,
      ngoId: user.ngoId,
      nextStatus: parsed.data.nextStatus,
      changedBy: user.id,
      note: parsed.data.note,
    })

    revalidatePath("/admin/donations")
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (err: any) {
    console.error("advanceDonationStatusAction error", err)
    return { success: false, error: "Failed to advance status. Please try again." }
  }
}
