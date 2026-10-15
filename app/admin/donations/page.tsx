import Link from "next/link"
import {
  Heart,
  ArrowRight,
  ChevronRight,
  Ban,
  Link as LinkIcon,
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
import { DonationActionsCell } from "./DonationActionsCell"

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

const STATUS_FLOW: Record<string, string | null> = {
  SUBMITTED: "RECEIVED",
  RECEIVED: "SORTED",
  SORTED: "INVENTORY_ADDED",
  INVENTORY_ADDED: "ALLOCATED",
  ALLOCATED: "DISTRIBUTED",
  DISTRIBUTED: "COMPLETED",
  COMPLETED: null,
  REJECTED: null,
}

export default async function AdminDonationsPage() {
  const user = await requireRole(UserRole.NGO_ADMIN, UserRole.NGO_STAFF)
  const ngoId = user.ngoId!

  const [donations, campaigns, counts] = await Promise.all([
    prisma.donation.findMany({
      where: { ngoId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { campaign: { select: { id: true, name: true } } },
    }),
    prisma.campaign.findMany({
      where: { ngoId, status: "ACTIVE" },
      select: { id: true, name: true },
    }),
    {
      total: prisma.donation.count({ where: { ngoId } }),
      submitted: prisma.donation.count({
        where: { ngoId, currentStatus: "SUBMITTED" },
      }),
      received: prisma.donation.count({
        where: { ngoId, currentStatus: "RECEIVED" },
      }),
      completed: prisma.donation.count({
        where: { ngoId, currentStatus: "COMPLETED" },
      }),
    },
  ])

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border-white/50 bg-gradient-to-br from-rose-500/15 via-pink-500/10 to-red-500/15 p-6 shadow-lg backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-pink-400/30 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25">
              <Heart className="h-6 w-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Donations Management
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Track, process, and advance all incoming donations.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Donations", value: counts.total, gradient: "from-slate-500 to-slate-600" },
          { label: "Awaiting Pickup", value: counts.submitted, gradient: "from-blue-500 to-cyan-500" },
          { label: "Received", value: counts.received, gradient: "from-amber-500 to-orange-500" },
          { label: "Completed", value: counts.completed, gradient: "from-emerald-500 to-teal-500" },
        ].map((s) => (
          <Card key={s.label} className="glass border-white/50">
            <CardContent className="p-5">
              <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${s.gradient} mb-3`} />
              <p className="text-xs uppercase tracking-wider text-slate-500">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass border-white/50 shadow-lg">
        <CardHeader className="flex flex-col gap-4 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              All Donations
            </CardTitle>
            <p className="text-xs text-slate-500">
              Showing latest {donations.length} donations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search donations..."
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
                    Donation ID
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Donor
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Items
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Campaign
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Submitted
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-slate-500"
                    >
                      No donations found yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  donations.map((d) => {
                    const nextStatus = STATUS_FLOW[d.currentStatus]
                    return (
                      <TableRow
                        key={d.id}
                        className="border-white/40 hover:bg-white/50"
                      >
                        <TableCell className="font-mono text-sm font-semibold text-slate-900">
                          {d.donationId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">
                              {d.donorName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {d.donorEmail}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          {d.totalItems}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border ${donationStatusColors[d.currentStatus] ?? ""}`}
                          >
                            {d.currentStatus.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {d.campaign ? (
                            <Badge variant="secondary" className="border-0">
                              {d.campaign.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {d.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DonationActionsCell
                            donationId={d.id}
                            trackingId={d.donationId}
                            currentStatus={d.currentStatus}
                            nextStatus={nextStatus}
                          />
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
