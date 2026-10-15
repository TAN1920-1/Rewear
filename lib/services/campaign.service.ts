import { prisma } from "@/lib/db/prisma"
import { CampaignStatus } from "@/lib/enums"

export async function listActiveCampaigns() {
  return prisma.campaign.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      createdByUser: {
        select: {
          id: true,
          name: true,
        },
      },
      ngo: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  })
}

export async function listCampaigns(params: {
  ngoId: number
  status?: CampaignStatus
  page?: number
  pageSize?: number
}) {
  const { ngoId, status, page = 1, pageSize = 20 } = params
  const where: any = { ngoId }
  if (status) where.status = status

  const [items, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        createdByUser: { select: { id: true, name: true } },
        _count: { select: { donations: true, campaignDonations: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
    }),
    prisma.campaign.count({ where }),
  ])

  const enriched = await Promise.all(
    items.map(async (c) => {
      const progress = await computeCampaignProgress(c.id, ngoId)
      return { ...c, ...progress }
    })
  )

  return { items: enriched, total, page, pageSize, pageCount: Math.ceil(total / pageSize) }
}

export async function computeCampaignProgress(campaignId: number, ngoId: number) {
  const [campaign, assocSum, count] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id: campaignId, ngoId },
      select: { targetQty: true },
    }),
    prisma.campaignDonation.aggregate({
      where: { campaignId },
      _sum: { itemsCount: true },
    }),
    prisma.campaignDonation.count({ where: { campaignId } }),
  ])

  const itemsCount = assocSum._sum.itemsCount ?? 0
  const target = campaign?.targetQty ?? 0
  const progressPct = target > 0 ? Math.min(100, Math.round((itemsCount / target) * 1000) / 10) : 0
  const remaining = Math.max(0, target - itemsCount)

  return {
    targetQty: target,
    itemsDonated: itemsCount,
    donationsAssociated: count,
    progressPct,
    remainingQty: remaining,
  }
}

export async function getCampaignById(id: number, ngoId: number) {
  const base = await prisma.campaign.findUnique({
    where: { id, ngoId },
    include: {
      createdByUser: { select: { id: true, name: true } },
      campaignDonations: {
        include: {
          donation: {
            select: {
              id: true,
              donationId: true,
              donorName: true,
              totalItems: true,
              createdAt: true,
              currentStatus: true,
            },
          },
        },
        orderBy: { assignedAt: "desc" },
        take: 50,
      },
    },
  })
  if (!base) return null
  const progress = await computeCampaignProgress(id, ngoId)
  return { ...base, ...progress }
}

export async function createCampaign(data: {
  ngoId: number
  name: string
  slug?: string
  description?: string
  coverImageUrl?: string
  targetQty: number
  startDate?: Date
  endDate?: Date
  priority: string
  status?: CampaignStatus
  createdBy: number
}) {
  const slug =
    data.slug ??
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")

  return prisma.campaign.create({
    data: {
      ngoId: data.ngoId,
      name: data.name,
      slug,
      description: data.description,
      coverImageUrl: data.coverImageUrl,
      targetQty: data.targetQty,
      startDate: data.startDate,
      endDate: data.endDate,
      priority: data.priority,
      status: data.status ?? CampaignStatus.DRAFT,
      createdBy: data.createdBy,
    },
  })
}

export async function associateDonationToCampaign(
  campaignId: number,
  donationId: number,
  ngoId: number
) {
  return prisma.$transaction(async (tx: any) => {
    const donation = await tx.donation.findUnique({
      where: { id: donationId, ngoId },
      select: { totalItems: true, campaignId: true },
    })
    if (!donation) throw new Error("Donation not found")

    const campaign = await tx.campaign.findUnique({
      where: { id: campaignId, ngoId },
    })
    if (!campaign) throw new Error("Campaign not found")

    const existing = await tx.campaignDonation.findUnique({
      where: { campaignId_donationId: { campaignId, donationId } },
    })
    if (existing) return existing

    if (donation.campaignId && donation.campaignId !== campaignId) {
      await tx.campaignDonation.deleteMany({
        where: { donationId },
      })
    }

    const [assoc] = await Promise.all([
      tx.campaignDonation.create({
        data: {
          campaignId,
          donationId,
          itemsCount: donation.totalItems,
        },
      }),
      tx.donation.update({
        where: { id: donationId },
        data: { campaignId },
      }),
    ])

    return assoc
  })
}

export async function updateCampaign(
  id: number,
  ngoId: number,
  data: Partial<{
    name: string
    description: string
    coverImageUrl: string
    targetQty: number
    startDate: Date
    endDate: Date
    priority: string
    status: CampaignStatus
  }>
) {
  return prisma.campaign.update({ where: { id, ngoId }, data })
}

