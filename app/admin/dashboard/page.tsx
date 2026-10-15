import Link from "next/link"
import {
  Heart,
  Package,
  DollarSign,
  ClipboardList,
  Truck,
  Users,
  ArrowRight,
  AlertTriangle,
} from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { prisma } from "@/lib/db/prisma"
import {
  UserRole,
  DonationStatus,
  InventoryStatus,
} from "@/lib/enums"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const donationStatusColors: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
  RECEIVED: "bg-cyan-100 text-cyan-700 border-cyan-200",
  SORTED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  INVENTORY_ADDED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ALLOCATED: "bg-amber-100 text-amber-700 border-amber-200",
  DISTRIBUTED: "bg-purple-100 text-purple-700 border-purple-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
}

export default async function AdminDashboardPage() {
  const user = await requireRole(UserRole.NGO_ADMIN, UserRole.NGO_STAFF)
  const ngoId = user.ngoId!

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    donationsThisMonth,
    itemsReceived,
    inventoryValueData,
    activeRequirementsCount,
    distributionsCompleted,
    donorsCount,
    latestDonations,
    lowStockItems,
  ] = await Promise.all([
    prisma.donation.count({
      where: { ngoId, createdAt: { gte: startOfMonth } },
    }),
    prisma.donation.aggregate({
      where: {
        ngoId,
        createdAt: { gte: startOfMonth },
        currentStatus: {
          in: [
            DonationStatus.RECEIVED,
            DonationStatus.SORTED,
            DonationStatus.INVENTORY_ADDED,
            DonationStatus.ALLOCATED,
            DonationStatus.DISTRIBUTED,
            DonationStatus.COMPLETED,
          ],
        },
      },
      _sum: { totalItems: true },
    }),
    prisma.inventoryItem.aggregate({
      where: { ngoId },
      _sum: { availableQty: true },
    }),
    prisma.requirement.count({
      where: { ngoId, active: true },
    }),
    prisma.distribution.count({
      where: { ngoId, status: "COMPLETED" },
    }),
    prisma.user.count({
      where: {
        role: UserRole.DONOR,
        donationsMade: { some: { ngoId } },
      },
    }),
    prisma.donation.findMany({
      where: { ngoId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { campaign: { select: { name: true } } },
    }),
    prisma.inventoryItem.findMany({
      where: { ngoId, status: InventoryStatus.LOW_STOCK },
      include: { category: { select: { name: true } } },
      take: 10,
      orderBy: { availableQty: "asc" },
    }),
  ])

  const itemsReceivedCount = itemsReceived._sum.totalItems ?? 0
  const inventoryValue = (inventoryValueData._sum.availableQty ?? 0) * 150

  const kpis = [
    {
      title: "Donations This Month",
      value: donationsThisMonth.toLocaleString(),
      icon: Heart,
      gradient: "from-rose-500 to-pink-500",
      iconBg: "bg-rose-50 text-rose-600",
      hint: "New donation submissions",
    },
    {
      title: "Items Received",
      value: itemsReceivedCount.toLocaleString(),
      icon: Package,
      gradient: "from-emerald-500 to-teal-500",
      iconBg: "bg-emerald-50 text-emerald-600",
      hint: "Items processed this month",
    },
    {
      title: "Inventory Value",
      value: `₹${inventoryValue.toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-50 text-amber-600",
      hint: "Approx. value of stock",
    },
    {
      title: "Active Requirements",
      value: activeRequirementsCount.toLocaleString(),
      icon: ClipboardList,
      gradient: "from-blue-500 to-cyan-500",
      iconBg: "bg-blue-50 text-blue-600",
      hint: "Open needs requests",
    },
    {
      title: "Distributions Done",
      value: distributionsCompleted.toLocaleString(),
      icon: Truck,
      gradient: "from-violet-500 to-purple-500",
      iconBg: "bg-violet-50 text-violet-600",
      hint: "Completed distributions",
    },
    {
      title: "Total Donors",
      value: donorsCount.toLocaleString(),
      icon: Users,
      gradient: "from-indigo-500 to-blue-500",
      iconBg: "bg-indigo-50 text-indigo-600",
      hint: "Unique donors engaged",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border-white/50 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/15 p-6 shadow-lg backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal-400/30 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Overview of your NGO operations and impact metrics.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
            >
              <Link href="/admin/donations">
                View Donations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Card
              key={k.title}
              className="glass group border-white/50 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-xl ${k.iconBg}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div
                    className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${k.gradient}`}
                  />
                </div>
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {k.title}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {k.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{k.hint}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass border-white/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Latest Donations
              </CardTitle>
              <p className="text-xs text-slate-500">
                Most recent 10 donation submissions
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/admin/donations">
                All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {latestDonations.length === 0 ? (
                <div className="rounded-2xl bg-white/60 p-8 text-center text-sm text-slate-500">
                  No donations yet.
                </div>
              ) : (
                latestDonations.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/50 px-4 py-3 transition-colors hover:bg-white/70"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {d.donationId} · {d.donorName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {d.donorEmail}
                        {d.campaign ? ` · ${d.campaign.name}` : ""}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className={`border ${donationStatusColors[d.currentStatus] ?? ""}`}
                      >
                        {d.currentStatus.replace("_", " ")}
                      </Badge>
                      <p className="text-[11px] text-slate-500">
                        {d.totalItems} items ·{" "}
                        {d.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Low Stock Inventory
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Items running low — reorder soon
                </p>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/admin/inventory">
                All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.length === 0 ? (
                <div className="rounded-2xl bg-emerald-50/60 p-8 text-center">
                  <p className="text-sm font-medium text-emerald-700">
                    All stock levels healthy!
                  </p>
                  <p className="mt-1 text-xs text-emerald-600">
                    No items are currently low on stock.
                  </p>
                </div>
              ) : (
                lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/50 px-4 py-3 transition-colors hover:bg-white/70"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.category.name}
                        {item.size ? ` · ${item.size}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.condition.replace("_", " ")}
                        {item.location ? ` · ${item.location}` : ""}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-bold text-amber-700">
                        {item.availableQty} avail
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {item.reservedQty} reserved
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
