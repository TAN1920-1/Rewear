"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { DonationStatus } from "@/lib/enums"
import { formatDateTime } from "@/lib/utils/cn"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PublicNavbar } from "@/components/layout/PublicNavbar"
import { PublicFooter } from "@/components/layout/PublicFooter"
import { useToast } from "@/components/ui/use-toast"
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  User,
  Hash,
  Building2,
  Sparkles,
  ArrowRight,
  Check,
  X,
} from "lucide-react"
import { fetchDonationByTrackingId } from "@/lib/actions/track.actions"
import type { Donation, DonationStatusHistory } from "@prisma/client"

type DonationWithDetails = Donation & {
  statusHistory: (DonationStatusHistory & { changedByUser: { name: string } })[]
}

const STATUS_ORDER: DonationStatus[] = [
  DonationStatus.SUBMITTED,
  DonationStatus.RECEIVED,
  DonationStatus.SORTED,
  DonationStatus.INVENTORY_ADDED,
  DonationStatus.ALLOCATED,
  DonationStatus.DISTRIBUTED,
  DonationStatus.COMPLETED,
]

function getStatusBadgeClass(status: string) {
  if (status === DonationStatus.REJECTED) {
    return "bg-red-100 text-red-700 border-red-200"
  }
  if (status === DonationStatus.COMPLETED) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200"
  }
  if (status === DonationStatus.DISTRIBUTED) {
    return "bg-teal-100 text-teal-700 border-teal-200"
  }
  return "bg-amber-100 text-amber-700 border-amber-200"
}

function StatusTimeline({ donation }: { donation: DonationWithDetails }) {
  const currentStatus = donation.currentStatus
  const isRejected = currentStatus === DonationStatus.REJECTED

  const statusesToShow = isRejected
    ? [DonationStatus.SUBMITTED, DonationStatus.REJECTED]
    : STATUS_ORDER

  const currentIndex = isRejected
    ? statusesToShow.length - 1
    : STATUS_ORDER.indexOf(currentStatus as DonationStatus)

  return (
    <div className="relative mt-2">
      <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-200 via-teal-200 to-slate-200" />
      <ul className="space-y-5">
        {statusesToShow.map((s, i) => {
          const historyEntry = donation.statusHistory.find((h) => h.status === s)
          const isCompleted = isRejected
            ? s === DonationStatus.REJECTED
              ? true
              : true
            : i <= currentIndex
          const isRejectedStep = s === DonationStatus.REJECTED

          return (
            <li key={s} className="relative flex gap-4 pl-10">
              <div
                className={[
                  "absolute left-0 top-0 grid h-9 w-9 place-items-center rounded-full border-2 shadow-sm",
                  isCompleted
                    ? isRejectedStep
                      ? "bg-red-500 border-red-500 text-white"
                      : "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-500 text-white"
                    : "bg-white border-slate-300 text-slate-400",
                ].join(" ")}
              >
                {isCompleted ? (
                  isRejectedStep ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={[
                      "font-semibold text-sm",
                      isCompleted ? "text-slate-900" : "text-slate-500",
                    ].join(" ")}
                  >
                    {s.replace(/_/g, " ")}
                  </span>
                </div>
                {historyEntry && (
                  <>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDateTime(historyEntry.createdAt)} · by{" "}
                      {historyEntry.changedByUser?.name ?? "System"}
                    </p>
                    {historyEntry.note && (
                      <p className="text-xs text-slate-600 mt-1 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                        {historyEntry.note}
                      </p>
                    )}
                  </>
                )}
                {!historyEntry && !isCompleted && (
                  <p className="text-xs text-slate-400 mt-0.5">Pending</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function TrackPage() {
  const { toast } = useToast()
  const [trackingId, setTrackingId] = useState("")
  const [donation, setDonation] = useState<DonationWithDetails | null>(null)
  const [searched, setSearched] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!trackingId.trim()) {
      toast({
        title: "Missing tracking ID",
        description: "Please enter a donation tracking ID like DON-2026-000001.",
      })
      return
    }

    startTransition(async () => {
      const result = await fetchDonationByTrackingId(trackingId)
      if (!result) {
        setDonation(null)
        setSearched(true)
        toast({
          title: "Donation not found",
          description: "We couldn't find a donation with that ID. Please check and try again.",
        })
      } else {
        setDonation(result)
        setSearched(true)
      }
    })
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-emerald-50 via-white to-teal-50">
      <div className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-20 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl" />

      <PublicNavbar />

      {/* Hero */}
      <section className="relative mx-auto max-w-4xl px-4 pb-10 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="text-center">
          <Badge variant="secondary" className="mb-6 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 shadow-sm">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            End-to-end donation transparency
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Track a{" "}
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Donation
            </span>
            .
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Enter your donation tracking ID to see the live status timeline —
            from drop-off to the hands of the person who needed it.
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="mx-auto max-w-2xl px-4 pb-8 sm:px-6 lg:px-8">
        <Card className="glass border-white/60">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trackingId" className="text-sm font-medium text-slate-700">
                  Donation Tracking ID
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="trackingId"
                    type="text"
                    placeholder="e.g. DON-2026-000001"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="flex-1 h-11"
                    autoCapitalize="characters"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isPending}
                    className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {isPending ? "Searching…" : "Track"}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  You can find this ID in your confirmation email or donation receipt.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Result */}
      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 lg:px-8">
        {isPending && (
          <Card className="glass border-white/60 p-10">
            <div className="text-center text-slate-500 text-sm">Looking up your donation…</div>
          </Card>
        )}

        {!isPending && searched && !donation && (
          <Card className="glass border-white/60 p-10 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <Search className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">No donation found</h3>
            <p className="mt-2 text-slate-600">
              Double-check the tracking ID format. It should look like <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">DON-2026-000001</code>.
            </p>
          </Card>
        )}

        {!isPending && donation && (
          <div className="space-y-6">
            {/* Summary card */}
            <Card className="glass border-white/60 overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                      <Package className="h-5 w-5 text-emerald-600" />
                      Donation Status
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1.5 text-sm">
                      <Hash className="h-3.5 w-3.5" />
                      {donation.donationId}
                    </CardDescription>
                  </div>
                  <Badge className={`border text-sm ${getStatusBadgeClass(donation.currentStatus)}`}>
                    {donation.currentStatus.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Donor</p>
                      <p className="font-medium text-slate-900">{donation.donorName}</p>
                      <p className="text-sm text-slate-500">{donation.donorEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">NGO ID</p>
                      <p className="font-medium text-slate-900">#{donation.ngoId}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Total Items</p>
                      <p className="font-medium text-slate-900">
                        {donation.totalItems.toLocaleString()} item{donation.totalItems === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Submitted</p>
                      <p className="font-medium text-slate-900">{formatDateTime(donation.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline card */}
            <Card className="glass border-white/60">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Status Timeline
                </CardTitle>
                <CardDescription className="text-sm">
                  Every step is recorded with timestamps and the responsible staff member.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <StatusTimeline donation={donation} />
              </CardContent>
            </Card>

            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline" className="bg-white/80 backdrop-blur">
                <Link href="/">
                  Back to home
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25">
                <Link href="/donor/donations/new">
                  Donate again
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {!isPending && !searched && (
          <div className="text-center text-sm text-slate-400 py-8">
            Enter a tracking ID above to view donation details.
          </div>
        )}
      </section>

      <PublicFooter />
    </div>
  )
}
