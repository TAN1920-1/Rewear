import { prisma } from "@/lib/db/prisma"
import { getPriorityWeight } from "@/lib/services/requirement.service"
import { DonationStatus, Priority } from "@/lib/enums"

export type RecommendationLevel = "HIGH" | "MEDIUM" | "LOW"

export interface RecommendationResult {
  level: RecommendationLevel
  score: number
  message: string
  matchingRequirementId?: number
  matchingRequirementTitle?: string
}

export interface RecommendationInput {
  categoryId: number
  size?: string
  condition?: string
  ngoId: number
}

export async function getRecommendationForItem(
  input: RecommendationInput
): Promise<RecommendationResult> {
  const { categoryId, size, ngoId } = input

  const activeRequirements = await prisma.requirement.findMany({
    where: {
      ngoId,
      active: true,
      categoryId,
    },
    orderBy: [{ priority: "asc" }, { deadline: "asc" }],
    take: 5,
  })

  if (activeRequirements.length === 0) {
    return {
      level: "LOW",
      score: 10,
      message: "Thank you! This item is always welcome as a general donation.",
    }
  }

  const best = activeRequirements[0]
  const required = best.requiredQty
  const fulfilled = best.fulfilledQty
  const remaining = Math.max(0, required - fulfilled)
  const shortagePct = required > 0 ? remaining / required : 0
  const priorityW = getPriorityWeight(best.priority)

  const deadlineBonus =
    best.deadline && best.deadline.getTime() < Date.now() + 1000 * 60 * 60 * 24 * 14 ? 1.5 : 1

  let score = priorityW * 20 * shortagePct * deadlineBonus

  const inv = await prisma.inventoryItem.aggregate({
    where: { ngoId, categoryId },
    _sum: { availableQty: true, reservedQty: true },
  })
  const availableTotal =
    (inv._sum.availableQty ?? 0) + (inv._sum.reservedQty ?? 0)
  if (availableTotal < remaining * 0.25) score += 15
  if (availableTotal === 0) score += 20

  if (size && best) {
    score += 5
  }

  let level: RecommendationLevel = "LOW"
  if (score >= 40) level = "HIGH"
  else if (score >= 18) level = "MEDIUM"

  const priLabel = best.priority
  const msgByLevel: Record<RecommendationLevel, string> = {
    HIGH: `${best.categoryId ? "This category" : "Your donation"} is currently a ${priLabel} PRIORITY requirement with a large shortage. Thank you — your donation will have immediate impact.`,
    MEDIUM: `There is moderate demand for this item. Your contribution will help fulfill the "${best.title}" requirement.`,
    LOW: `Thank you! Your donation is always welcome and will be distributed to a community in need.`,
  }

  return {
    level,
    score: Math.round(score * 10) / 10,
    message: msgByLevel[level],
    matchingRequirementId: best.id,
    matchingRequirementTitle: best.title,
  }
}

export async function getRecommendationsForItems(
  items: Array<{ categoryId: number; size?: string; condition?: string }>,
  ngoId: number
) {
  const results: Array<RecommendationResult & { itemIndex: number }> = []
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    const r = await getRecommendationForItem({
      categoryId: it.categoryId,
      size: it.size,
      condition: it.condition,
      ngoId,
    })
    results.push({ ...r, itemIndex: i })
  }
  return results
}

export async function checkDonationAdvancesInventory(
  donationId: number
): Promise<Array<{ itemId: number; categoryId: number; qty: number; condition: string }>> {
  const d = await prisma.donation.findUnique({
    where: { id: donationId },
    include: { items: true },
  })
  if (!d || d.currentStatus !== DonationStatus.SORTED) return []
  return d.items
    .filter((i) => !i.addedToInventory)
    .map((i) => ({
      itemId: i.id,
      categoryId: i.categoryId,
      qty: i.quantity,
      condition: i.condition,
    }))
}
