import { prisma } from "@/lib/db/prisma"
import type { DonationStatus } from "@/lib/enums"
import { createNotification } from "@/lib/services/notification.service"

export async function getDonationsByDonorId(
  donorId: number,
  status?: DonationStatus
) {
  return prisma.donation.findMany({
    where: {
      donorId,
      ...(status ? { currentStatus: status } : {}),
    },
    include: {
      items: {
        include: {
          category: true,
        },
      },
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
      receipt: {
        select: {
          id: true,
          receiptNumber: true,
          pdfUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getDonationById(id: number) {
  return prisma.donation.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          category: true,
        },
      },
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
      statusHistory: {
        include: {
          changedByUser: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      receipt: {
        select: {
          id: true,
          receiptNumber: true,
          pdfUrl: true,
          issuedAt: true,
        },
      },
      donor: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  })
}

export async function getDonationByDonationId(donationId: string) {
  return prisma.donation.findUnique({
    where: { donationId },
    include: {
      items: { include: { category: true } },
      campaign: { select: { id: true, name: true } },
      statusHistory: {
        include: { changedByUser: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      donor: { select: { id: true, name: true } },
    },
  })
}

export async function listCategories() {
  return prisma.clothingCategory.findMany({
    orderBy: {
      name: "asc",
    },
  })
}

export interface CreateDonationPayload {
  donorId: number
  ngoId: number
  donorName: string
  donorEmail: string
  donorPhone?: string
  pickupAddress?: string
  notes?: string
  campaignId?: number
  items: Array<{
    categoryId: number
    size?: string
    condition: string
    quantity: number
    description?: string
  }>
}

export async function createDonation(payload: CreateDonationPayload) {
  const totalItems = payload.items.reduce((sum, item) => sum + item.quantity, 0)

  const donationCount = await prisma.donation.count()
  const year = new Date().getFullYear()
  const donationId = `DON-${year}-${String(donationCount + 1).padStart(6, "0")}`

  return prisma.$transaction(async (tx: any) => {
    const donation = await tx.donation.create({
      data: {
        donationId,
        donorId: payload.donorId,
        ngoId: payload.ngoId,
        donorName: payload.donorName,
        donorEmail: payload.donorEmail,
        donorPhone: payload.donorPhone,
        pickupAddress: payload.pickupAddress,
        notes: payload.notes,
        campaignId: payload.campaignId,
        totalItems,
        currentStatus: "SUBMITTED",
        items: {
          create: payload.items.map((item) => ({
            categoryId: item.categoryId,
            size: item.size,
            condition: item.condition,
            quantity: item.quantity,
            description: item.description,
          })),
        },
        statusHistory: {
          create: {
            status: "SUBMITTED",
            changedBy: payload.donorId,
            note: "Donation submitted by donor",
          },
        },
        ...(payload.campaignId
          ? {
              campaignDonations: {
                create: {
                  campaignId: payload.campaignId,
                  itemsCount: totalItems,
                },
              },
            }
          : {}),
      },
      include: { items: true },
    })

    const ngoStaff = await tx.user.findMany({
      where: { ngoId: payload.ngoId, role: { in: ["NGO_ADMIN", "NGO_STAFF"] } },
      select: { id: true },
    })
    for (const s of ngoStaff) {
      await tx.notification.create({
        data: {
          userId: s.id,
          title: "New donation submitted",
          message: `Donation ${donationId} from ${payload.donorName} with ${totalItems} items.`,
          relatedType: "donation",
          relatedId: donation.id,
        },
      })
    }
    await tx.notification.create({
      data: {
        userId: payload.donorId,
        title: "Donation received",
        message: `Thank you! Your donation ${donationId} has been registered.`,
        relatedType: "donation",
        relatedId: donation.id,
      },
    })

    return donation
  })
}

export interface SearchDonationsParams {
  ngoId: number
  search?: string
  status?: DonationStatus
  categoryId?: number
  dateFrom?: Date
  dateTo?: Date
  donorId?: number
  page?: number
  pageSize?: number
  sortBy?: "date" | "items" | "status"
  sortDir?: "asc" | "desc"
}

export async function searchDonations(params: SearchDonationsParams) {
  const {
    ngoId,
    search,
    status,
    categoryId,
    dateFrom,
    dateTo,
    donorId,
    page = 1,
    pageSize = 20,
    sortBy = "date",
    sortDir = "desc",
  } = params

  const where: any = { ngoId }
  if (search) {
    where.OR = [
      { donationId: { contains: search, mode: "insensitive" } },
      { donorName: { contains: search, mode: "insensitive" } },
      { donorEmail: { contains: search, mode: "insensitive" } },
    ]
  }
  if (status) where.currentStatus = status
  if (donorId) where.donorId = donorId
  if (dateFrom) where.createdAt = { ...(where.createdAt ?? {}), gte: dateFrom }
  if (dateTo) where.createdAt = { ...(where.createdAt ?? {}), lte: dateTo }
  if (categoryId) {
    where.items = { some: { categoryId } }
  }

  const orderBy: any = {}
  if (sortBy === "items") orderBy.totalItems = sortDir
  else if (sortBy === "status") orderBy.currentStatus = sortDir
  else orderBy.createdAt = sortDir

  const [items, total] = await Promise.all([
    prisma.donation.findMany({
      where,
      include: {
        donor: { select: { id: true, name: true, email: true } },
        campaign: { select: { id: true, name: true } },
        items: { select: { id: true, quantity: true, category: { select: { name: true } } } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
    }),
    prisma.donation.count({ where }),
  ])

  return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) }
}

const STATUS_ORDER: DonationStatus[] = [
  "SUBMITTED",
  "RECEIVED",
  "SORTED",
  "INVENTORY_ADDED",
  "ALLOCATED",
  "DISTRIBUTED",
  "COMPLETED",
] as unknown as DonationStatus[]

export function canAdvanceStatus(
  current: DonationStatus | string,
  next: DonationStatus | string
): boolean {
  if (next === "REJECTED") return current !== "COMPLETED"
  const curIdx = STATUS_ORDER.indexOf(current as DonationStatus)
  const nextIdx = STATUS_ORDER.indexOf(next as DonationStatus)
  if (curIdx === -1 || nextIdx === -1) return false
  return nextIdx === curIdx + 1
}

export function getNextStatusOptions(current: DonationStatus | string): Array<{ value: string; label: string }> {
  if (current === "COMPLETED" || current === "REJECTED") return []
  const curIdx = STATUS_ORDER.indexOf(current as DonationStatus)
  if (curIdx === -1) return []
  const options: Array<{ value: string; label: string }> = []
  if (curIdx + 1 < STATUS_ORDER.length) {
    options.push({
      value: STATUS_ORDER[curIdx + 1],
      label: `Mark as ${STATUS_ORDER[curIdx + 1].replace(/_/g, " ")}`,
    })
  }
  if (current !== "REJECTED" && current !== "COMPLETED") {
    options.push({ value: "REJECTED", label: "Reject Donation" })
  }
  return options
}

export async function advanceDonationStatus(params: {
  donationId: number
  ngoId: number
  nextStatus: DonationStatus | string
  changedBy: number
  note?: string
}) {
  const { donationId, ngoId, nextStatus, changedBy, note } = params
  return prisma.$transaction(async (tx: any) => {
    const donation = await tx.donation.findUnique({
      where: { id: donationId, ngoId },
      select: { id: true, currentStatus: true, donorId: true, donationId: true, items: true },
    })
    if (!donation) throw new Error("Donation not found")

    if (!canAdvanceStatus(donation.currentStatus, nextStatus) && nextStatus !== "REJECTED")
      throw new Error(`Cannot advance from ${donation.currentStatus} to ${nextStatus}`)

    const updated = await tx.donation.update({
      where: { id: donationId },
      data: {
        currentStatus: nextStatus,
        ...(nextStatus === "REJECTED"
          ? { rejectionReason: note ?? "Rejected by staff" }
          : {}),
      },
    })

    await tx.donationStatusHistory.create({
      data: {
        donationId,
        status: nextStatus,
        changedBy,
        note: note ?? `Status updated to ${String(nextStatus).replace(/_/g, " ")}`,
      },
    })

    const donorMsgMap: Record<string, string> = {
      RECEIVED: `Your donation ${donation.donationId} has been received at our facility. Thank you!`,
      SORTED: `Your donation ${donation.donationId} has been sorted and processed.`,
      INVENTORY_ADDED: `Items from ${donation.donationId} have been added to our inventory.`,
      ALLOCATED: `Your donation ${donation.donationId} has been allocated for an upcoming distribution.`,
      DISTRIBUTED: `Great news! Items from ${donation.donationId} have been distributed to beneficiaries.`,
      COMPLETED: `Your donation ${donation.donationId} journey is complete. Thank you for making a difference!`,
      REJECTED: `Your donation ${donation.donationId} could not be accepted. Contact us for details.`,
    }

    const titleMap: Record<string, string> = {
      RECEIVED: "Donation Received",
      SORTED: "Donation Sorted",
      INVENTORY_ADDED: "Added to Inventory",
      ALLOCATED: "Allocated for Distribution",
      DISTRIBUTED: "Items Distributed",
      COMPLETED: "Donation Complete",
      REJECTED: "Donation Rejected",
    }

    if (donorMsgMap[nextStatus]) {
      await tx.notification.create({
        data: {
          userId: donation.donorId,
          title: titleMap[nextStatus] ?? "Status Update",
          message: donorMsgMap[nextStatus],
          relatedType: "donation",
          relatedId: donation.id,
        },
      })
    }

    return updated
  })
}

export async function getDonorKPIs(donorId: number) {
  const donations = await getDonationsByDonorId(donorId)
  const totalDonations = donations.length
  const totalItems = donations.reduce((s, d) => s + d.totalItems, 0)
  const campaignIds = new Set<number>()
  for (const d of donations) if (d.campaignId) campaignIds.add(d.campaignId)
  const campaignsSupported = campaignIds.size

  return {
    totalDonations,
    totalItems,
    campaignsSupported,
    recentDonations: donations.slice(0, 5),
  }
}

export async function getDonationReceiptData(donationId: number, ngoId: number) {
  const d = await prisma.donation.findUnique({
    where: { id: donationId, ngoId },
    include: {
      items: { include: { category: true } },
      donor: true,
      ngo: true,
      receipt: true,
    },
  })
  if (!d) return null
  return d
}

export async function generateReceiptRecord(params: {
  donationId: number
  ngoId: number
  generatedBy: number
  receiptNumber?: string
}) {
  const { donationId, ngoId, generatedBy } = params
  const count = await prisma.donationReceipt.count({ where: { ngoId } })
  const receiptNumber =
    params.receiptNumber ?? `REC-${new Date().getFullYear()}-${String(count + 1).padStart(8, "0")}`
  return prisma.donationReceipt.create({
    data: { donationId, ngoId, generatedBy, receiptNumber },
  })
}

