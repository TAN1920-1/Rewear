import { prisma } from "@/lib/db/prisma"
import { InventoryStatus, InventoryTransactionType } from "@/lib/enums"

export interface InventorySearchParams {
  ngoId: number
  categoryId?: number
  size?: string
  condition?: string
  status?: InventoryStatus
  search?: string
  page?: number
  pageSize?: number
  sortBy?: "category" | "available" | "updated"
  sortDir?: "asc" | "desc"
}

function computeStatus(available: number, reserved: number, threshold = 20): InventoryStatus {
  if (available <= 0) return InventoryStatus.OUT_OF_STOCK
  if (available <= threshold) return InventoryStatus.LOW_STOCK
  if (reserved > available * 0.5) return InventoryStatus.RESERVED
  return InventoryStatus.IN_STOCK
}

export async function searchInventory(params: InventorySearchParams) {
  const {
    ngoId,
    categoryId,
    size,
    condition,
    status,
    search,
    page = 1,
    pageSize = 20,
    sortBy = "updated",
    sortDir = "desc",
  } = params

  const where: any = { ngoId }
  if (categoryId) where.categoryId = categoryId
  if (size) where.size = size
  if (condition) where.condition = condition
  if (status) where.status = status
  if (search) {
    where.OR = [
      { category: { name: { contains: search, mode: "insensitive" } } },
      { batchId: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ]
  }

  const orderBy: any = {}
  if (sortBy === "category") orderBy.category = { name: sortDir }
  else if (sortBy === "available") orderBy.availableQty = sortDir
  else orderBy.updatedAt = sortDir

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true, defaultReorderThreshold: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
    }),
    prisma.inventoryItem.count({ where }),
  ])

  return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) }
}

export async function addInventoryItem(data: {
  ngoId: number
  categoryId: number
  size?: string
  genderAgeGroup?: string
  condition: string
  quantity: number
  location?: string
  batchId?: string
  performedBy: number
  donationItemId?: number
}) {
  return prisma.$transaction(async (tx: any) => {
    const existing = await tx.inventoryItem.findFirst({
      where: {
        ngoId: data.ngoId,
        categoryId: data.categoryId,
        size: data.size ?? null,
        condition: data.condition,
      },
    })

    let inventoryItem
    if (existing) {
      const newQty = existing.quantity + data.quantity
      const newAvailable = existing.availableQty + data.quantity
      const newStatus = computeStatus(newAvailable, existing.reservedQty)
      inventoryItem = await tx.inventoryItem.update({
        where: { id: existing.id },
        data: {
          quantity: newQty,
          availableQty: newAvailable,
          status: newStatus,
          location: data.location ?? existing.location,
        },
      })
    } else {
      const newStatus = computeStatus(data.quantity, 0)
      inventoryItem = await tx.inventoryItem.create({
        data: {
          ngoId: data.ngoId,
          categoryId: data.categoryId,
          size: data.size,
          genderAgeGroup: data.genderAgeGroup,
          condition: data.condition,
          quantity: data.quantity,
          availableQty: data.quantity,
          reservedQty: 0,
          distributedQty: 0,
          location: data.location,
          batchId: data.batchId,
          status: newStatus,
        },
      })
    }

    await tx.inventoryTransaction.create({
      data: {
        inventoryItemId: inventoryItem.id,
        donationItemId: data.donationItemId,
        type: InventoryTransactionType.RECEIVED,
        quantityChange: data.quantity,
        performedBy: data.performedBy,
        ngoId: data.ngoId,
      },
    })

    if (data.donationItemId) {
      await tx.donationItem.update({
        where: { id: data.donationItemId },
        data: { addedToInventory: true },
      })
    }

    return inventoryItem
  })
}

export async function adjustInventory(params: {
  itemId: number
  ngoId: number
  adjustment: number
  performedBy: number
  unitNote?: string
}) {
  return prisma.$transaction(async (tx: any) => {
    const item = await tx.inventoryItem.findUnique({
      where: { id: params.itemId, ngoId: params.ngoId },
    })
    if (!item) throw new Error("Inventory item not found")

    const newQty = Math.max(0, item.quantity + params.adjustment)
    const newAvailable = Math.max(0, item.availableQty + params.adjustment)
    if (newAvailable < 0) throw new Error("Cannot adjust below reserved quantity")

    const newStatus = computeStatus(newAvailable, item.reservedQty)

    const updated = await tx.inventoryItem.update({
      where: { id: item.id },
      data: {
        quantity: newQty,
        availableQty: newAvailable,
        status: newStatus,
      },
    })

    await tx.inventoryTransaction.create({
      data: {
        inventoryItemId: item.id,
        type: InventoryTransactionType.ADJUSTED,
        quantityChange: params.adjustment,
        unitNote: params.unitNote,
        performedBy: params.performedBy,
        ngoId: params.ngoId,
      },
    })

    return updated
  })
}

export async function allocateToDistribution(params: {
  distributionId: number
  inventoryItemId: number
  quantity: number
  performedBy: number
  ngoId: number
  categoryId?: number
  size?: string
  beneficiaryGroupId?: number
}) {
  return prisma.$transaction(async (tx: any) => {
    const item = await tx.inventoryItem.findUnique({
      where: { id: params.inventoryItemId, ngoId: params.ngoId },
    })
    if (!item) throw new Error("Inventory item not found")
    if (item.availableQty < params.quantity)
      throw new Error(`Insufficient stock: available ${item.availableQty}`)

    const newReserved = item.reservedQty + params.quantity
    const newAvailable = item.availableQty - params.quantity
    const newStatus = computeStatus(newAvailable, newReserved)

    await tx.inventoryItem.update({
      where: { id: item.id },
      data: {
        reservedQty: newReserved,
        availableQty: newAvailable,
        status: newStatus,
      },
    })

    const distItem = await tx.distributionItem.create({
      data: {
        distributionId: params.distributionId,
        inventoryItemId: item.id,
        categoryId: params.categoryId ?? item.categoryId,
        size: params.size ?? item.size,
        quantity: params.quantity,
        beneficiaryGroupId: params.beneficiaryGroupId,
      },
    })

    await tx.inventoryTransaction.create({
      data: {
        inventoryItemId: item.id,
        distributionItemId: distItem.id,
        type: InventoryTransactionType.ALLOCATED,
        quantityChange: -params.quantity,
        performedBy: params.performedBy,
        ngoId: params.ngoId,
      },
    })

    const dist = await tx.distribution.findUnique({ where: { id: params.distributionId } })
    if (dist && dist.status !== "ALLOCATED" && dist.status !== "IN_PROGRESS" && dist.status !== "COMPLETED") {
      await tx.distribution.update({
        where: { id: params.distributionId },
        data: { status: "ALLOCATED" },
      })
    }
    await tx.distribution.update({
      where: { id: params.distributionId },
      data: { totalItems: { increment: params.quantity } },
    })

    return distItem
  })
}

export async function releaseAllocation(distributionItemId: number, performedBy: number, ngoId: number) {
  return prisma.$transaction(async (tx: any) => {
    const dItem = await tx.distributionItem.findUnique({
      where: { id: distributionItemId },
      include: { inventoryItem: true, distribution: true },
    })
    if (!dItem) throw new Error("Distribution item not found")
    if (dItem.distribution?.status === "COMPLETED")
      throw new Error("Cannot release allocation from completed distribution")

    const inv = dItem.inventoryItem
    if (inv) {
      const newReserved = Math.max(0, inv.reservedQty - dItem.quantity)
      const newAvailable = inv.availableQty + dItem.quantity
      const newStatus = computeStatus(newAvailable, newReserved)
      await tx.inventoryItem.update({
        where: { id: inv.id },
        data: { reservedQty: newReserved, availableQty: newAvailable, status: newStatus },
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

    if (dItem.distribution) {
      const newTotal = Math.max(0, dItem.distribution.totalItems - dItem.quantity)
      const hasMore = await tx.distributionItem.count({
        where: { distributionId: dItem.distributionId, NOT: { id: dItem.id } },
      })
      await tx.distribution.update({
        where: { id: dItem.distributionId },
        data: {
          totalItems: newTotal,
          status: hasMore > 0 ? dItem.distribution.status : "DRAFT",
        },
      })
    }

    return tx.distributionItem.delete({ where: { id: distributionItemId } })
  })
}

export async function getInventoryItemHistory(itemId: number, ngoId: number) {
  return prisma.inventoryTransaction.findMany({
    where: { inventoryItemId: itemId, ngoId },
    include: {
      performedByUser: { select: { id: true, name: true, role: true } },
      donationItem: { include: { donation: { select: { donationId: true } } } },
      distributionItem: { include: { distribution: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getLowStockItems(ngoId: number, limit = 10) {
  return prisma.inventoryItem.findMany({
    where: {
      ngoId,
      OR: [
        { status: InventoryStatus.LOW_STOCK },
        { status: InventoryStatus.OUT_OF_STOCK },
      ],
    },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { availableQty: "asc" },
    take: limit,
  })
}
