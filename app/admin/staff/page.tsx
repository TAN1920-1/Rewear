import Link from "next/link"
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ArrowRight,
  MoreHorizontal,
  User as UserIcon,
} from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { prisma } from "@/lib/db/prisma"
import { UserRole } from "@/lib/enums"
import { formatDateTime } from "@/lib/utils/cn"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function AdminStaffPage() {
  const user = await requireRole(UserRole.NGO_ADMIN)
  const ngoId = user.ngoId!

  const staffMembers = await prisma.user.findMany({
    where: {
      ngoId,
      role: { in: [UserRole.NGO_ADMIN, UserRole.NGO_STAFF] },
    },
    include: {
      staffAssignment: true,
      changedStatuses: { take: 0, select: { id: true } },
      _count: {
        select: {
          changedStatuses: true,
          createdDistributions: true,
          createdRequirements: true,
          performedTransactions: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  })

  const totalAdmins = staffMembers.filter((s) => s.role === UserRole.NGO_ADMIN)
    .length
  const totalStaff = staffMembers.filter((s) => s.role === UserRole.NGO_STAFF)
    .length

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Staff Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Invite, assign roles, and manage NGO staff accounts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-white/80 backdrop-blur"
            disabled
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Team Members
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {staffMembers.length}
                </p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  NGO Admins
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {totalAdmins}
                </p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Staff Users
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {totalStaff}
                </p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
                <Shield className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-white/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-5 w-5 text-emerald-600" />
            Team Directory
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            All staff and admin members with access to the NGO admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/40 bg-emerald-50/50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 font-medium">Member</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium text-center">
                    Actions Taken
                  </th>
                  <th className="px-6 py-3 font-medium text-center">
                    Distributions
                  </th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium text-right">
                    Management
                  </th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-slate-500"
                    >
                      <UserIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                      No staff members configured yet. Invite your first team
                      member to get started.
                    </td>
                  </tr>
                ) : (
                  staffMembers.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-white/40 last:border-0 hover:bg-white/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white shadow">
                            {s.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              {s.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {s.email}
                              {s.phone ? ` · ${s.phone}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {s.role === UserRole.NGO_ADMIN ? (
                          <Badge className="border-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                            <ShieldAlert className="mr-1.5 h-3 w-3" />
                            NGO Admin
                          </Badge>
                        ) : (
                          <Badge className="border-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                            <Shield className="mr-1.5 h-3 w-3" />
                            NGO Staff
                          </Badge>
                        )}
                        {s.staffAssignment && (
                          <p className="mt-1.5 text-xs text-slate-500">
                            Assigned: {new Date(s.staffAssignment.assignedAt).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                        {s._count.changedStatuses + s._count.performedTransactions}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                        {s._count.createdDistributions}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatDateTime(s.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              Manage Member
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled>
                              Change Role…
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              Edit Profile…
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled className="text-rose-600">
                              Disable Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
