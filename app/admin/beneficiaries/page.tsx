import {
  Users,
  Plus,
  Truck,
  Hash,
  Search,
} from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { prisma } from "@/lib/db/prisma"
import { UserRole } from "@/lib/enums"
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

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-slate-100 text-slate-600 border-slate-200",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  ARCHIVED: "bg-slate-100 text-slate-500 border-slate-200",
}

export default async function AdminBeneficiariesPage() {
  const user = await requireRole(UserRole.NGO_ADMIN, UserRole.NGO_STAFF)
  const ngoId = user.ngoId!

  const [beneficiaryGroups, totalGroups, totalCompletedDistributions] = await Promise.all([
    prisma.beneficiaryGroup.findMany({
      where: { ngoId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { distributions: true },
        },
      },
      take: 100,
    }),
    prisma.beneficiaryGroup.count({ where: { ngoId } }),
    prisma.distribution.count({
      where: { ngoId, status: "COMPLETED" },
    }),
  ])

  const counts = {
    total: totalGroups,
    totalDistributions: totalCompletedDistributions,
  }

  const totalBeneficiaries = beneficiaryGroups.reduce(
    (sum, g) => sum + (g.size ? parseInt(String(g.size).replace(/[^0-9]/g, "")) || 0 : 0),
    0
  )
  const totalDistributionsForGroups = beneficiaryGroups.reduce(
    (sum, g) => sum + g._count.distributions,
    0
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border-white/50 bg-gradient-to-br from-cyan-500/15 via-sky-500/10 to-blue-500/15 p-6 shadow-lg backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-sky-400/30 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/25">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Beneficiary Groups
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage groups and communities receiving donations.
              </p>
            </div>
          </div>
          <Button className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Group
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-slate-500 to-slate-600 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total Groups
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.total}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Registered beneficiary groups
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              People Reached
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {totalBeneficiaries.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-cyan-600">
              Estimated individuals
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mb-3" />
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-600" />
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Distributions Done
              </p>
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {totalDistributionsForGroups}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              To beneficiary groups
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Avg per Group
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.total > 0
                ? (totalDistributionsForGroups / counts.total).toFixed(1)
                : "0"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Distributions per group
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-white/50 shadow-lg">
        <CardHeader className="flex flex-col gap-4 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              All Beneficiary Groups
            </CardTitle>
            <p className="text-xs text-slate-500">
              {beneficiaryGroups.length} groups
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search groups..."
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
                    Group Code
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Program
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Age Group
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">
                    Size
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">
                    Distributions
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Notes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beneficiaryGroups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-slate-500"
                    >
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-50 text-cyan-600 mb-4">
                          <Users className="h-7 w-7" />
                        </div>
                        <p className="text-sm font-medium text-slate-900">
                          No beneficiary groups yet
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Add your first community or group to start distributing donations.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  beneficiaryGroups.map((g) => {
                    const statusKey = (g.status ?? "ACTIVE").toUpperCase()
                    const statusBadgeColor =
                      statusColors[statusKey] ?? statusColors.ACTIVE

                    return (
                      <TableRow
                        key={g.id}
                        className="border-white/40 hover:bg-white/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-500/15 to-sky-500/15 text-cyan-700">
                              <Hash className="h-4 w-4" />
                            </div>
                            <span className="font-mono text-sm font-semibold text-slate-900">
                              {g.groupCode}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {g.program ? (
                            <Badge variant="secondary" className="border-0 font-normal">
                              {g.program}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {g.ageGroup ?? (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {g.size ?? (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border ${statusBadgeColor}`}
                          >
                            {g.status ?? "ACTIVE"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-900">
                              {g._count.distributions}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {g.notes ? (
                            <p className="text-xs text-slate-600 line-clamp-1">
                              {g.notes}
                            </p>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
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
