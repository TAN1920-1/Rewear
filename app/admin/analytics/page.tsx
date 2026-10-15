import Link from "next/link"
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  ArrowRight,
  Download,
} from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { prisma } from "@/lib/db/prisma"
import { UserRole } from "@/lib/enums"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts"

const PIE_COLORS = [
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
]

function buildLast6Months() {
  const months: { key: string; label: string; start: Date; end: Date }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short" }),
      start: d,
      end,
    })
  }
  return months
}

export default async function AdminAnalyticsPage() {
  const user = await requireRole(UserRole.NGO_ADMIN, UserRole.NGO_STAFF)
  const ngoId = user.ngoId!
  const months = buildLast6Months()

  const [
    donationsPerMonth,
    itemsDistributedPerMonth,
    inventoryByCategory,
    requirementsByPriority,
  ] = await Promise.all([
    Promise.all(
      months.map((m) =>
        prisma.donation.count({
          where: { ngoId, createdAt: { gte: m.start, lte: m.end } },
        })
      )
    ),
    Promise.all(
      months.map((m) =>
        prisma.distributionItem.aggregate({
          where: {
            distribution: { ngoId, createdAt: { gte: m.start, lte: m.end } },
          },
          _sum: { quantity: true },
        })
      )
    ),
    prisma.inventoryItem.groupBy({
      by: ["categoryId"],
      where: { ngoId },
      _sum: { availableQty: true },
      orderBy: { _sum: { availableQty: "desc" } },
      take: 7,
    }),
    prisma.requirement.groupBy({
      by: ["priority"],
      where: { ngoId, active: true },
      _sum: { requiredQty: true, fulfilledQty: true },
    }),
  ])

  const categoriesById = new Map<number, string>()
  const catIds = inventoryByCategory.map((g) => g.categoryId)
  if (catIds.length > 0) {
    const cats = await prisma.clothingCategory.findMany({
      where: { id: { in: catIds } },
      select: { id: true, name: true },
    })
    for (const c of cats) categoriesById.set(c.id, c.name)
  }

  const donationsChart = months.map((m, i) => ({
    month: m.label,
    donations: donationsPerMonth[i],
  }))

  const distributionsChart = months.map((m, i) => ({
    month: m.label,
    items: itemsDistributedPerMonth[i]?._sum?.quantity ?? 0,
  }))

  const inventoryChart = inventoryByCategory.map((g, i) => ({
    name: categoriesById.get(g.categoryId) ?? `Category #${g.categoryId}`,
    value: g._sum?.availableQty ?? 0,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }))

  const reqChart = requirementsByPriority.map((g) => ({
    priority: g.priority,
    requested: g._sum?.requiredQty ?? 0,
    remaining: Math.max(
      0,
      (g._sum?.requiredQty ?? 0) - (g._sum?.fulfilledQty ?? 0)
    ),
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Analytics & Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Trends, breakdowns, and operational performance metrics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-white/70 backdrop-blur"
            disabled
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            asChild
            className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
          >
            <Link href="/admin/dashboard">
              Back to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <AnalyticsCharts
        donations={donationsChart}
        distributions={distributionsChart}
        inventory={inventoryChart}
        requirements={reqChart}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/50 bg-white/60 p-5 backdrop-blur">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Campaign progress insights
          </p>
          <p className="text-xs text-slate-500">
            Visit the campaigns page to see per-campaign progress bars and donation associations.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2 bg-white/80">
          <Link href="/admin/campaigns">
            Open Campaigns
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
