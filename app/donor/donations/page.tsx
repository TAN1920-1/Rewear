import Link from "next/link"
import { Package, Calendar, ArrowRight, PlusCircle, Gift } from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { getDonationsByDonorId } from "@/lib/services/donation.service"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

export default async function DonorDonationsPage() {
  const user = await requireRole(UserRole.DONOR)
  const donations = await getDonationsByDonorId(user.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Donations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {donations.length} donation{donations.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button asChild className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25">
          <Link href="/donor/donations/new">
            <PlusCircle className="h-4 w-4" />
            New Donation
          </Link>
        </Button>
      </div>

      {donations.length === 0 ? (
        <Card className="glass border-white/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-emerald-50 text-emerald-500">
              <Gift className="h-10 w-10" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-slate-900">
              You haven&apos;t made any donations yet
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Your donations make a real difference. Start your first donation today to help those in need.
            </p>
            <Button asChild className="mt-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
              <Link href="/donor/donations/new">
                <PlusCircle className="h-4 w-4" />
                Create First Donation
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {donations.map((donation) => (
            <Link
              key={donation.id}
              href={`/donor/donations/${donation.id}`}
              className="group block"
            >
              <Card className="glass border-white/60 transition-all hover:-translate-y-0.5 hover:shadow-xl">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {donation.donationId}
                        </h3>
                        <Badge variant={statusBadgeVariant[donation.currentStatus as DonationStatus] ?? "outline"}>
                          {donation.currentStatus.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(donation.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" />
                          {donation.totalItems} item{donation.totalItems !== 1 ? "s" : ""}
                        </span>
                        {donation.campaign && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            {donation.campaign.name}
                          </span>
                        )}
                      </div>
                      {donation.items.length > 0 && (
                        <p className="mt-2 text-sm text-slate-600">
                          {donation.items
                            .slice(0, 3)
                            .map((i) => `${i.category.name}${i.size ? ` (${i.size})` : ""} ×${i.quantity}`)
                            .join(" · ")}
                          {donation.items.length > 3 && ` · +${donation.items.length - 3} more`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                      View details
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
