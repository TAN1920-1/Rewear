import Link from "next/link"
import { Gift, Package, Clock, CheckCircle2, ArrowRight, History, PlusCircle } from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { getDonationsByDonorId } from "@/lib/services/donation.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserRole, DonationStatus } from "@/lib/enums"

const statusBadgeVariant: Record<DonationStatus, "default" | "secondary" | "outline" | "destructive"> = {
  [DonationStatus.SUBMITTED]: "secondary",
  [DonationStatus.RECEIVED]: "outline",
  [DonationStatus.SORTED]: "outline",
  [DonationStatus.INVENTORY_ADDED]: "default",
  [DonationStatus.ALLOCATED]: "outline",
  [DonationStatus.DISTRIBUTED]: "default",
  [DonationStatus.COMPLETED]: "default",
  [DonationStatus.REJECTED]: "destructive",
}

export default async function DonorDashboardPage() {
  const user = await requireRole(UserRole.DONOR)
  const donations = await getDonationsByDonorId(user.id)

  const totalDonations = donations.length
  const totalItems = donations.reduce((sum, d) => sum + d.totalItems, 0)
  const activeCount = donations.filter(
    (d) =>
      d.currentStatus === DonationStatus.RECEIVED ||
      d.currentStatus === DonationStatus.SORTED ||
      d.currentStatus === DonationStatus.INVENTORY_ADDED ||
      d.currentStatus === DonationStatus.ALLOCATED ||
      d.currentStatus === DonationStatus.DISTRIBUTED
  ).length
  const pendingCount = donations.filter(
    (d) => d.currentStatus === DonationStatus.SUBMITTED
  ).length

  const recentDonations = donations.slice(0, 5)

  const kpis = [
    {
      title: "Total Donations",
      value: totalDonations,
      icon: <Gift className="h-5 w-5" />,
      gradient: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Total Items",
      value: totalItems,
      icon: <Package className="h-5 w-5" />,
      gradient: "from-teal-500 to-cyan-600",
      bg: "bg-teal-50 text-teal-600",
    },
    {
      title: "In Progress",
      value: activeCount,
      icon: <Clock className="h-5 w-5" />,
      gradient: "from-cyan-500 to-sky-600",
      bg: "bg-cyan-50 text-cyan-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, {user?.name}. Here&apos;s an overview of your donations.
          </p>
        </div>
        <Button asChild className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25">
          <Link href="/donor/donations/new">
            <Package className="h-4 w-4" />
            New Donation
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="glass border-white/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{kpi.title}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{kpi.value}</p>
                </div>
                <div
                  className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${kpi.gradient} text-white shadow-lg`}
                >
                  {kpi.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="glass border-white/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Awaiting Review</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{pendingCount}</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                <History className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-white/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Recent Donations</CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
            <Link href="/donor/donations">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentDonations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-500">
                <Gift className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No donations yet</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Start your first donation to help those in need.
              </p>
              <Button asChild className="mt-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                <Link href="/donor/donations/new">
                  <PlusCircle className="h-4 w-4" />
                  Create Donation
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donation ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDonations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell className="font-medium text-slate-900">
                      {donation.donationId}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        <Package className="h-3 w-3" />
                        {donation.totalItems} items
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {donation.campaign?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[donation.currentStatus as DonationStatus] ?? "outline"}>
                        {donation.currentStatus.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/donor/donations/${donation.id}`}>
                          View
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
