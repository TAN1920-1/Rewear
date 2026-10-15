"use server"

import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/guards"
import { CreateDonationSchema, CreateDonationSchemaType } from "@/lib/validations/donation.schema"
import { DonationStatus } from "@/lib/enums"
import { ZodError } from "zod"
import { advanceDonationStatus } from "@/lib/services/donation.service"
import { revalidatePath } from "next/cache"

export interface ServerActionResult<T = unknown> {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  data?: T
}

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
    return { success: false, error: err?.message || "Failed to load form options." }
  }
}

export async function submitDonationAction(
  values: CreateDonationSchemaType
): Promise<ServerActionResult<{ id: number }>> {
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

    const sampleCategory = await prisma.clothingCategory.findFirst({
      where: { id: { in: validItems.map((i) => i.categoryId) } },
      select: { ngoId: true },
    })

    const ngoId = sampleCategory?.ngoId ?? 1
    const totalItems = validItems.reduce((sum, it) => sum + it.quantity, 0)

    const donationCount = await prisma.donation.count()
    const year = new Date().getFullYear()
    const donationId = `DON-${year}-${String(donationCount + 1).padStart(6, "0")}`

    const donation = await prisma.donation.create({
      data: {
        donationId,
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
      select: { id: true },
    })

    return { success: true, data: { id: donation.id } }
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
      error: err?.message || "Failed to submit donation. Please try again.",
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
    if (!user || (user.role !== "NGO_ADMIN" && user.role !== "NGO_STAFF")) {
      return { success: false, error: "Unauthorized" }
    }

    await advanceDonationStatus({
      donationId,
      ngoId: user.ngoId!,
      nextStatus,
      changedBy: user.id,
      note,
    })

    revalidatePath("/admin/donations")
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (err: any) {
    console.error("advanceDonationStatusAction error", err)
    return { success: false, error: err?.message || "Failed to advance status" }
  }
}
