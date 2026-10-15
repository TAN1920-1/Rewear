import { prisma } from "@/lib/db/prisma"
import { DistributionStatus, DonationStatus, InventoryTransactionType } from "@/lib/enums"

export async function createDistribution(data: {
  ngoId: number
  name: string
  description?: string
  program?: string
  location?: string
  eventDate?: Date
  beneficiaryGroupId?: number
  createdBy: number
}) {
  return prisma.distribution.create({
    data: {
      ngoId: data.ngoId,
      name: data.name,
      description: data.description,
      program: data.program,
      location: data.location,
      eventDate: data.eventDate,
      beneficiaryGroupId: data.beneficiaryGroupId,
      status: DistributionStatus.DRAFT,
      createdBy: data.createdBy,
    },
  })
}

export async function getDistributionById(id: number, ngoId: number) {
  return prisma.distribution.findUnique({
    where: { id, ngoId },
    include: {
      beneficiaryGroup: true,
      items: {
        include: {
          inventoryItem: {
            include: { category: { select: { id: true, name: true } } },
          },
          category: { select: { id: true, name: true } },
          beneficiaryGroup: true,
        },
      },
      createdByUser: { select: { id: true, name: true, role: true } },
    },
  })
}

export async function listDistributions(params: {
  ngoId: number
  status?: DistributionStatus
  beneficiaryGroupId?: number
  page?: number
  pageSize?: number
}) {
  const { ngoId, status, beneficiaryGroupId, page = 1, pageSize = 20 } = params
  const where: any = { ngoId }
  if (status) where.status = status
  if (beneficiaryGroupId) where.beneficiaryGroupId = beneficiaryGroupId

  const [items, total] = await Promise.all([
    prisma.distribution.findMany({
      where,
      include: {
        beneficiaryGroup: { select: { id: true, groupCode: true, program: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.distribution.count({ where }),
  ])

  return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) }
}

export async function completeDistribution(distributionId: number, performedBy: number, ngoId: number) {
  return prisma.$transaction(async (tx: any) => {
    const dist = await tx.distribution.findUnique({
      where: { id: distributionId, ngoId },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    })
    if (!dist) throw new Error("Distribution not found")
    if (dist.status === DistributionStatus.COMPLETED)
      throw new Error("Distribution already completed")
    if (dist.items.length === 0)
      throw new Error("No items allocated to this distribution")

    const now = new Date()

    for (const dItem of dist.items) {
      const inv = dItem.inventoryItem
      if (inv) {
        const newDistributed = inv.distributedQty + dItem.quantity
        const newReserved = Math.max(0, inv.reservedQty - dItem.quantity)
        const newQty = Math.max(0, inv.quantity - dItem.quantity)
        const newAvailable = Math.max(0, newQty - newReserved)

        await tx.inventoryItem.update({
          where: { id: inv.id },
          data: {
            quantity: newQty,
            reservedQty: newReserved,
            availableQty: newAvailable,
            distributedQty: newDistributed,
            status: newAvailable <= 0
              ? "OUT_OF_STOCK"
              : newAvailable <= ((inv as any).category?.defaultReorderThreshold || 20)
              ? "LOW_STOCK"
              : "IN_STOCK",
          },
        })

        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: inv.id,
            distributionItemId: dItem.id,
            type: InventoryTransactionType.DISTRIBUTED,
            quantityChange: -dItem.quantity,
            performedBy,
            ngoId,
          },
        })
      }
    }

    const relatedDonationIds = new Set<number>()
    for (const dItem of dist.items) {
      const txs = await tx.inventoryTransaction.findMany({
        where: { distributionItemId: dItem.id, type: InventoryTransactionType.ALLOCATED },
        select: { donationItemId: true },
      })
      for (const t of txs) {
        if (t.donationItemId) {
          const dItem2 = await tx.donationItem.findUnique({
            where: { id: t.donationItemId },
            select: { donationId: true },
          })
          if (dItem2?.donationId) relatedDonationIds.add(dItem2.donationId)
        }
      }
    }

    for (const donId of relatedDonationIds) {
      const current = await tx.donation.findUnique({
        where: { id: donId },
        select: { currentStatus: true },
      })
      if (
        current &&
        current.currentStatus !== DonationStatus.COMPLETED &&
        current.currentStatus !== DonationStatus.REJECTED
      ) {
        const newStatus = DonationStatus.DISTRIBUTED
        await tx.donation.update({
          where: { id: donId },
          data: { currentStatus: newStatus },
        })
        await tx.donationStatusHistory.create({
          data: {
            donationId: donId,
            status: newStatus,
            changedBy: performedBy,
            note: `Items distributed via event: ${dist.name}`,
          },
        })
        await tx.notification.create({
          data: {
            userId: (await tx.donation.findUnique({ where: { id: donId }, select: { donorId: true } }))
              ?.donorId!,
            title: "Donation items distributed",
            message: `Items from your donation have been distributed in event: ${dist.name}.`,
            relatedType: "donation",
            relatedId: donId,
          },
        })
      }
    }

    return tx.distribution.update({
      where: { id: distributionId },
      data: {
        status: DistributionStatus.COMPLETED,
        completedAt: now,
      },
      include: { items: true },
    })
  })
}

export async function cancelDistribution(distributionId: number, performedBy: number, ngoId: number) {
  return prisma.$transaction(async (tx: any) => {
    const dist = await tx.distribution.findUnique({
      where: { id: distributionId, ngoId },
      include: { items: { include: { inventoryItem: true } } },
    })
    if (!dist) throw new Error("Distribution not found")
    if (dist.status === DistributionStatus.COMPLETED)
      throw new Error("Cannot cancel completed distribution")

    for (const dItem of dist.items) {
      const inv = dItem.inventoryItem
      if (inv) {
        const newReserved = Math.max(0, inv.reservedQty - dItem.quantity)
        const newAvailable = inv.availableQty + dItem.quantity
        await tx.inventoryItem.update({
          where: { id: inv.id },
          data: {
            reservedQty: newReserved,
            availableQty: newAvailable,
            status:
              newAvailable <= 0
                ? "OUT_OF_STOCK"
                : newAvailable <= 20
                ? "LOW_STOCK"
                : "IN_STOCK",
          },
        })
        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: inv.id,
            distributionItemId: dItem.id,
            type: InventoryTransactionType.RETURNED,
            quantityChange: +dItem.quantity,
            performedBy,
            ngoId,
          },
        })
      }
    }

    return tx.distribution.update({
      where: { id: distributionId },
      data: { status: DistributionStatus.CANCELLED },
    })
  })
}
