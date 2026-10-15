import {
  Megaphone,
  Plus,
  Calendar,
  Target,
  Package,
  Search,
} from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { prisma } from "@/lib/db/prisma"
import { UserRole, CampaignStatus, Priority } from "@/lib/enums"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

const campaignStatusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PAUSED: "bg-amber-100 text-amber-700 border-amber-200",
  COMPLETED: "bg-blue-100 text-blue-700 border-blue-200",
  ARCHIVED: "bg-slate-100 text-slate-500 border-slate-200",
}

const priorityColors: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700 border-slate-200",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
  HIGH: "bg-amber-100 text-amber-700 border-amber-200",
  CRITICAL: "bg-rose-100 text-rose-700 border-rose-200",
}

export default async function AdminCampaignsPage() {
  const user = await requireRole(UserRole.NGO_ADMIN, UserRole.NGO_STAFF)
  const ngoId = user.ngoId!

  const [campaigns, counts] = await Promise.all([
    prisma.campaign.findMany({
      where: { ngoId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: { donations: true, campaignDonations: true },
        },
        campaignDonations: {
          select: { itemsCount: true },
        },
      },
      take: 50,
    }),
    {
      total: prisma.campaign.count({ where: { ngoId } }),
      active: prisma.campaign.count({
        where: { ngoId, status: CampaignStatus.ACTIVE },
      }),
      completed: prisma.campaign.count({
        where: { ngoId, status: CampaignStatus.COMPLETED },
      }),
    },
  ])

  const totalTargetQty = campaigns.reduce((s, c) => s + c.targetQty, 0)
  const totalItemsCollected = campaigns.reduce(
    (s, c) => s + c.campaignDonations.reduce((a, d) => a + d.itemsCount, 0),
    0
  )
  const overallProgress =
    totalTargetQty > 0 ? Math.round((totalItemsCollected / totalTargetQty) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border-white/50 bg-gradient-to-br from-violet-500/15 via-purple-500/10 to-fuchsia-500/15 p-6 shadow-lg backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-400/30 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Campaigns
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Create and manage donation drive campaigns.
              </p>
            </div>
          </div>
          <Button className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-slate-500 to-slate-600 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total Campaigns
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.total}
            </p>
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-1">
                Overall Progress
              </p>
              <Progress value={overallProgress} className="h-2" />
              <p className="mt-1 text-xs font-medium text-slate-600">
                {totalItemsCollected.toLocaleString()} / {totalTargetQty.toLocaleString()} items ({overallProgress}%)
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Active
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.active}
            </p>
            <p className="mt-1 text-xs text-emerald-600">
              Currently running
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Completed
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.completed}
            </p>
            <p className="mt-1 text-xs text-blue-600">
              Successfully finished
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total Donations to Campaigns
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {campaigns.reduce((s, c) => s + c._count.campaignDonations, 0)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {totalItemsCollected.toLocaleString()} items collected
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-white/50 shadow-lg">
        <CardHeader className="flex flex-col gap-4 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              All Campaigns
            </CardTitle>
            <p className="text-xs text-slate-500">
              {campaigns.length} campaigns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search campaigns..."
                className="pl-9 w-64 bg-white/70 border-white/50"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="rounded-2xl bg-white/60 p-12 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-600 mb-4">
                <Megaphone className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium text-slate-900">
                No campaigns yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Create your first donation drive campaign to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {campaigns.map((c) => {
                const itemsCollected = c.campaignDonations.reduce(
                  (a, d) => a + d.itemsCount,
                  0
                )
                const progress =
                  c.targetQty > 0
                    ? Math.min(100, Math.round((itemsCollected / c.targetQty) * 100))
                    : 0
                const statusColor = campaignStatusColors[c.status] ?? ""
                const priorityColor = priorityColors[c.priority] ?? ""

                return (
                  <Card
                    key={c.id}
                    className="glass group border-white/50 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <div className="relative h-32 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 overflow-hidden">
                      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-400/30 blur-2xl" />
                      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-purple-400/30 blur-2xl" />
                      <div className="relative h-full p-4 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline" className={`border ${statusColor}`}>
                            {c.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline" className={`border ${priorityColor}`}>
                            {c.priority}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 drop-shadow-sm line-clamp-1">
                            {c.name}
                          </h3>
                          {c.slug && (
                            <p className="text-xs font-mono text-slate-600/80">
                              /{c.slug}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      {c.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 min-h-[2.5rem]">
                          {c.description}
                        </p>
                      )}

                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              Target
                            </span>
                            <span className="font-semibold text-slate-900">
                              {itemsCollected.toLocaleString()} /{" "}
                              {c.targetQty.toLocaleString()}
                            </span>
                          </div>
                          <Progress
                            value={progress}
                            className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-purple-500"
                          />
                          <p className="mt-1 text-[11px] text-right font-medium text-slate-600">
                            {progress}% complete
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/40">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Package className="h-3.5 w-3.5" />
                            <span>
                              {c._count.campaignDonations} donations
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 justify-end">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {c.startDate
                                ? new Date(c.startDate).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "No date"}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-slate-200"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-br from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 shadow-sm"
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
