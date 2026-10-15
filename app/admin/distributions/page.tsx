import {
  Truck,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  Users,
  Search,
} from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { prisma } from "@/lib/db/prisma"
import { UserRole, DistributionStatus } from "@/lib/enums"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const distributionStatusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  ALLOCATED: "bg-blue-100 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
}

export default async function AdminDistributionsPage() {
  const user = await requireRole(UserRole.NGO_ADMIN, UserRole.NGO_STAFF)
  const ngoId = user.ngoId!

  const [distributions, counts] = await Promise.all([
    prisma.distribution.findMany({
      where: { ngoId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        beneficiaryGroup: {
          select: { groupCode: true, program: true },
        },
      },
      take: 100,
    }),
    {
      total: prisma.distribution.count({ where: { ngoId } }),
      inProgress: prisma.distribution.count({
        where: { ngoId, status: DistributionStatus.IN_PROGRESS },
      }),
      completed: prisma.distribution.count({
        where: { ngoId, status: DistributionStatus.COMPLETED },
      }),
      draft: prisma.distribution.count({
        where: { ngoId, status: DistributionStatus.DRAFT },
      }),
    },
  ])

  const totalItemsDistributed = distributions
    .filter((d) => d.status === DistributionStatus.COMPLETED)
    .reduce((sum, d) => sum + d.totalItems, 0)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border-white/50 bg-gradient-to-br from-orange-500/15 via-red-500/10 to-amber-500/15 p-6 shadow-lg backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-amber-400/30 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Distributions
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage donation distribution events and deliveries.
              </p>
            </div>
          </div>
          <Button className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            New Distribution
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-slate-500 to-slate-600 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total Events
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.total}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Total distributions created
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-slate-400 to-slate-500 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Draft
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.draft}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Being planned
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 mb-3" />
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-amber-600" />
              <p className="text-xs uppercase tracking-wider text-slate-500">
                In Progress
              </p>
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.inProgress}
            </p>
            <p className="mt-1 text-xs text-amber-600">
              Currently distributing
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mb-3" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Completed
              </p>
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.completed}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {totalItemsDistributed.toLocaleString()} items delivered
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-white/50 shadow-lg">
        <CardHeader className="flex flex-col gap-4 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Distribution Events
            </CardTitle>
            <p className="text-xs text-slate-500">
              {distributions.length} events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search distributions..."
                className="pl-9 w-64 bg-white/70 border-white/50"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/40">
                  <TableHead className="font-semibold text-slate-700">
                    Name
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Beneficiary Group
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Program
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Event Date
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">
                    Items
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-slate-500"
                    >
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-600 mb-4">
                          <Truck className="h-7 w-7" />
                        </div>
                        <p className="text-sm font-medium text-slate-900">
                          No distributions yet
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Create a distribution event to start delivering donations to beneficiaries.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  distributions.map((d) => {
                    const statusColor =
                      distributionStatusColors[d.status] ??
                      distributionStatusColors.DRAFT
                    const canStart =
                      d.status === DistributionStatus.DRAFT ||
                      d.status === DistributionStatus.ALLOCATED
                    const canComplete =
                      d.status === DistributionStatus.IN_PROGRESS
                    const isCompleted = d.status === DistributionStatus.COMPLETED

                    return (
                      <TableRow
                        key={d.id}
                        className={`border-white/40 hover:bg-white/50 ${
                          isCompleted ? "bg-emerald-50/40" : ""
                        }`}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">
                              {d.name}
                            </p>
                            {d.location && (
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Calendar className="h-3 w-3" />
                                {d.location}
                              </p>
                            )}
                            {d.description && (
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                {d.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {d.beneficiaryGroup ? (
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-mono text-xs text-slate-700">
                                {d.beneficiaryGroup.groupCode}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {d.program ??
                            d.beneficiaryGroup?.program ?? (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {d.eventDate ? (
                            <div>
                              <p className="font-medium text-sm">
                                {new Date(d.eventDate).toLocaleDateString()}
                              </p>
                              {d.completedAt && (
                                <p className="text-[11px] text-emerald-600 mt-0.5">
                                  Completed{" "}
                                  {new Date(
                                    d.completedAt
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">
                              Not scheduled
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {d.totalItems}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border ${statusColor}`}
                          >
                            {d.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1.5">
                            {canStart && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                              >
                                <Play className="h-3.5 w-3.5" />
                                Start
                              </Button>
                            )}
                            {canComplete && (
                              <Button
                                size="sm"
                                className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-sm gap-1"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Complete
                              </Button>
                            )}
                            {isCompleted && (
                              <Badge
                                variant="secondary"
                                className="border-0 bg-emerald-50 text-emerald-700"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Done
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
