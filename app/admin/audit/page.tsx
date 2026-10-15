import Link from "next/link"
import {
  ScrollText,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Shield,
  User,
} from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { prisma } from "@/lib/db/prisma"
import { UserRole } from "@/lib/enums"
import { formatDateTime } from "@/lib/utils/cn"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const ACTION_BADGE: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  UPDATE: "bg-amber-100 text-amber-700 border-amber-200",
  DELETE: "bg-rose-100 text-rose-700 border-rose-200",
  ADVANCE: "bg-teal-100 text-teal-700 border-teal-200",
  COMPLETE: "bg-violet-100 text-violet-700 border-violet-200",
  CANCEL: "bg-slate-100 text-slate-700 border-slate-200",
  LOGIN: "bg-blue-100 text-blue-700 border-blue-200",
}

export default async function AdminAuditPage() {
  const user = await requireRole(UserRole.NGO_ADMIN, UserRole.NGO_STAFF)
  const ngoId = user.ngoId!

  const logs = await prisma.auditLog.findMany({
    where: { ngoId },
    include: { actor: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Audit Log
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete tamper-proof history of all admin and staff actions.
          </p>
        </div>
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

      <Card className="glass border-white/50 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Shield className="h-5 w-5 text-emerald-600" />
              Recent Activity ({logs.length} records)
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Filter actions…"
                  className="h-10 w-full pl-9 bg-white/80 backdrop-blur sm:w-64"
                  disabled
                />
              </div>
              <Button variant="outline" className="gap-2 bg-white/80" disabled>
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/40 bg-emerald-50/50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 font-medium">Timestamp</th>
                  <th className="px-6 py-3 font-medium">Actor</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                  <th className="px-6 py-3 font-medium">Target</th>
                  <th className="px-6 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-slate-500"
                    >
                      <ScrollText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                      No audit records yet. Actions will appear here as staff
                      and admins use the platform.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-white/40 last:border-0 hover:bg-white/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTime(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold text-white">
                            {log.actor
                              ? log.actor.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()
                              : "SY"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              {log.actor?.name ?? "System"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {log.actor?.email ?? log.actorRole ?? "Automated"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={`border ${ACTION_BADGE[log.action] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700">
                          <span className="font-medium">{log.targetType}</span>
                          {log.targetId != null && (
                            <span className="ml-2 text-slate-500">
                              #{log.targetId}
                            </span>
                          )}
                        </div>
                        {log.metadata && (
                          <p className="mt-0.5 truncate text-xs text-slate-500 max-w-xs">
                            {log.metadata.slice(0, 80)}
                            {log.metadata.length > 80 ? "…" : ""}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {log.ipAddress ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
