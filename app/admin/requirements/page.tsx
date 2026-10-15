import {
  ClipboardList,
  Plus,
  CheckCircle2,
  MinusCircle,
  Search,
} from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { prisma } from "@/lib/db/prisma"
import { UserRole, Priority } from "@/lib/enums"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const priorityColors: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700 border-slate-200",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
  HIGH: "bg-amber-100 text-amber-700 border-amber-200",
  CRITICAL: "bg-rose-100 text-rose-700 border-rose-200",
}

export default async function AdminRequirementsPage() {
  const user = await requireRole(UserRole.NGO_ADMIN, UserRole.NGO_STAFF)
  const ngoId = user.ngoId!

  const [requirements, counts] = await Promise.all([
    prisma.requirement.findMany({
      where: { ngoId },
      orderBy: [
        { active: "desc" },
        {
          priority: "desc",
        },
        { deadline: "asc" },
      ],
      include: { category: { select: { name: true } } },
      take: 100,
    }),
    {
      total: prisma.requirement.count({ where: { ngoId } }),
      active: prisma.requirement.count({ where: { ngoId, active: true } }),
      critical: prisma.requirement.count({
        where: { ngoId, active: true, priority: Priority.CRITICAL },
      }),
    },
  ])

  const totalRequired = requirements.reduce((s, r) => s + r.requiredQty, 0)
  const totalFulfilled = requirements.reduce((s, r) => s + r.fulfilledQty, 0)
  const overallProgress = totalRequired > 0 ? Math.round((totalFulfilled / totalRequired) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border-white/50 bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-indigo-500/15 p-6 shadow-lg backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-400/30 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/25">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Requirements
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Track clothing needs and fulfillment progress.
              </p>
            </div>
          </div>
          <Button className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            New Requirement
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-slate-500 to-slate-600 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total Requirements
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
                {totalFulfilled.toLocaleString()} / {totalRequired.toLocaleString()} items ({overallProgress}%)
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Active
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.active}
            </p>
            <p className="mt-1 text-xs text-slate-500">Open needs</p>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Critical Priority
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.critical}
            </p>
            <p className="mt-1 text-xs text-rose-600">Urgently needed</p>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Items Needed
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {(totalRequired - totalFulfilled).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Remaining to fulfill
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-white/50 shadow-lg">
        <CardHeader className="flex flex-col gap-4 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              All Requirements
            </CardTitle>
            <p className="text-xs text-slate-500">
              {requirements.length} items
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search requirements..."
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
                    Title
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Category
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">
                    Required
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">
                    Fulfilled
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 w-40">
                    Progress
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Priority
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Deadline
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirements.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-slate-500"
                    >
                      No requirements yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  requirements.map((r) => {
                    const progress =
                      r.requiredQty > 0
                        ? Math.min(
                            100,
                            Math.round((r.fulfilledQty / r.requiredQty) * 100)
                          )
                        : 0
                    const isFullyFulfilled = r.fulfilledQty >= r.requiredQty
                    const isPartiallyFulfilled =
                      r.fulfilledQty > 0 && !isFullyFulfilled
                    const isOverdue =
                      r.deadline &&
                      new Date(r.deadline) < new Date() &&
                      !isFullyFulfilled

                    return (
                      <TableRow
                        key={r.id}
                        className={`border-white/40 hover:bg-white/50 ${
                          !r.active ? "bg-slate-50/60 opacity-70" : ""
                        }`}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900 flex items-center gap-2">
                              {r.title}
                              {!r.active && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] py-0"
                                >
                                  Closed
                                </Badge>
                              )}
                              {isOverdue && (
                                <Badge
                                  variant="outline"
                                  className="border-rose-200 bg-rose-50 text-rose-700 text-[10px] py-0"
                                >
                                  Overdue
                                </Badge>
                              )}
                            </p>
                            {r.description && (
                              <p className="text-xs text-slate-500 truncate max-w-xs">
                                {r.description}
                              </p>
                            )}
                            {r.program && (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Program: {r.program}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {r.category.name}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {r.requiredQty}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700">
                          {r.fulfilledQty}
                        </TableCell>
                        <TableCell>
                          <div>
                            <Progress
                              value={progress}
                              className={`h-2 ${
                                isFullyFulfilled
                                  ? "bg-emerald-100 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-500"
                                  : isPartiallyFulfilled
                                    ? "bg-amber-100 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500"
                                    : ""
                              }`}
                            />
                            <p className="mt-1 text-[11px] text-slate-500">
                              {progress}%
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border ${priorityColors[r.priority] ?? ""}`}
                          >
                            {r.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {r.deadline ? (
                            <span
                              className={
                                isOverdue ? "text-rose-600 font-medium" : ""
                              }
                            >
                              {new Date(r.deadline).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 border-slate-200 text-slate-700"
                              disabled={isPartiallyFulfilled}
                            >
                              <MinusCircle className="h-3.5 w-3.5" />
                              Partial
                            </Button>
                            <Button
                              size="sm"
                              className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-sm gap-1"
                              disabled={isFullyFulfilled || !r.active}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Fulfill
                            </Button>
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
