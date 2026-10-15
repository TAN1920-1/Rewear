import { prisma } from "@/lib/db/prisma"
import { Priority } from "@/lib/enums"

export interface RequirementWithProgress {
  id: number
  ngoId: number
  categoryId: number
  title: string
  description?: string | null
  requiredQty: number
  priority: string
  deadline?: Date | null
  program?: string | null
  fulfilledQty: number
  active: boolean
  createdAt: Date
  updatedAt: Date
  category?: { id: number; name: string; slug: string } | null
  remainingQty: number
  progressPct: number
}

export async function listRequirementsWithProgress(params: {
  ngoId: number
  activeOnly?: boolean
  priority?: Priority
  categoryId?: number
  page?: number
  pageSize?: number
}) {
  const {
    ngoId,
    activeOnly = false,
    priority,
    categoryId,
    page = 1,
    pageSize = 20,
  } = params

  const where: any = { ngoId }
  if (activeOnly) where.active = true
  if (priority) where.priority = priority
  if (categoryId) where.categoryId = categoryId

  const [raw, total] = await Promise.all([
    prisma.requirement.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [
        { priority: "asc" },
        { deadline: "asc" },
        { createdAt: "desc" },
      ],
    }),
    prisma.requirement.count({ where }),
  ])

  const items: RequirementWithProgress[] = await Promise.all(
    raw.map(async (r) => {
      const computed = await computeFulfilledQty(r.id, ngoId)
      return {
        ...r,
        fulfilledQty: computed,
        remainingQty: Math.max(0, r.requiredQty - computed),
        progressPct: r.requiredQty > 0
          ? Math.min(100, Math.round((computed / r.requiredQty) * 1000) / 10)
          : 0,
      }
    })
  )

  return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) }
}

export async function computeFulfilledQty(requirementId: number, ngoId: number) {
  const req = await prisma.requirement.findUnique({
    where: { id: requirementId, ngoId },
    select: { categoryId: true, requiredQty: true },
  })
  if (!req) return 0

  const [fromInventory, fromDonations] = await Promise.all([
    prisma.inventoryItem.aggregate({
      where: { ngoId, categoryId: req.categoryId },
      _sum: { availableQty: true, reservedQty: true, distributedQty: true },
    }),
    prisma.donationItem.aggregate({
      where: {
        donation: { ngoId, currentStatus: { in: ["RECEIVED", "SORTED", "INVENTORY_ADDED", "ALLOCATED", "DISTRIBUTED", "COMPLETED"] } },
        categoryId: req.categoryId,
      },
      _sum: { quantity: true },
    }),
  ])

  const invTotal =
    (fromInventory._sum.availableQty ?? 0) +
    (fromInventory._sum.reservedQty ?? 0) +
    (fromInventory._sum.distributedQty ?? 0)
  const donTotal = fromDonations._sum.quantity ?? 0

  return Math.min(req.requiredQty, Math.max(invTotal, donTotal))
}

export async function createRequirement(data: {
  ngoId: number
  categoryId: number
  title: string
  description?: string
  requiredQty: number
  priority: Priority
  deadline?: Date
  program?: string
  createdBy: number
}) {
  return prisma.requirement.create({
    data: {
      ngoId: data.ngoId,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      requiredQty: data.requiredQty,
      priority: data.priority,
      deadline: data.deadline,
      program: data.program,
      createdBy: data.createdBy,
    },
  })
}

export async function updateRequirement(
  id: number,
  ngoId: number,
  data: Partial<{
    title: string
    description: string
    requiredQty: number
    priority: Priority
    deadline: Date | null
    program: string
    active: boolean
    categoryId: number
  }>
) {
  return prisma.requirement.update({
    where: { id, ngoId },
    data,
  })
}

export async function deleteRequirement(id: number, ngoId: number) {
  return prisma.requirement.delete({ where: { id, ngoId } })
}

export async function getTopRequirements(ngoId: number, limit = 5) {
  const result = await listRequirementsWithProgress({
    ngoId,
    activeOnly: true,
    page: 1,
    pageSize: limit,
  })
  return result.items
}

const priorityWeight: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

export function priorityLabel(p: Priority | string) {
  switch (p) {
    case Priority.CRITICAL:
      return "Critical"
    case Priority.HIGH:
      return "High"
    case Priority.MEDIUM:
      return "Medium"
    case Priority.LOW:
      return "Low"
    default:
      return p
  }
}

export function priorityBadgeClass(p: Priority | string) {
  switch (p) {
    case Priority.CRITICAL:
      return "bg-rose-100 text-rose-700 border-rose-200"
    case Priority.HIGH:
      return "bg-amber-100 text-amber-700 border-amber-200"
    case Priority.MEDIUM:
      return "bg-blue-100 text-blue-700 border-blue-200"
    case Priority.LOW:
      return "bg-slate-100 text-slate-700 border-slate-200"
    default:
      return "bg-slate-100 text-slate-700 border-slate-200"
  }
}

export function getPriorityWeight(p: string): number {
  return priorityWeight[p] ?? 0
}
