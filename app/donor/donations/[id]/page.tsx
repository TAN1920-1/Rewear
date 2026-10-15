import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Download,
  Package,
  User,
  FileText,
  History,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Box,
  Archive,
  HeartHandshake,
} from "lucide-react"
import { getCurrentUser, requireRole } from "@/lib/auth/guards"
import { getDonationById } from "@/lib/services/donation.service"
import { UserRole } from "@/lib/enums"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { DonationStatus, ClothingCondition } from "@/lib/enums"
import { Separator } from "@/components/ui/separator"

const statusIconMap: Record<DonationStatus, React.ReactNode> = {
  [DonationStatus.SUBMITTED]: <Clock className="h-4 w-4" />,
  [DonationStatus.RECEIVED]: <Package className="h-4 w-4" />,
  [DonationStatus.SORTED]: <Box className="h-4 w-4" />,
  [DonationStatus.INVENTORY_ADDED]: <Archive className="h-4 w-4" />,
  [DonationStatus.ALLOCATED]: <HeartHandshake className="h-4 w-4" />,
  [DonationStatus.DISTRIBUTED]: <Truck className="h-4 w-4" />,
  [DonationStatus.COMPLETED]: <CheckCircle2 className="h-4 w-4" />,
  [DonationStatus.REJECTED]: <XCircle className="h-4 w-4" />,
}

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

const statusOrder: DonationStatus[] = [
  DonationStatus.SUBMITTED,
  DonationStatus.RECEIVED,
  DonationStatus.SORTED,
  DonationStatus.INVENTORY_ADDED,
  DonationStatus.ALLOCATED,
  DonationStatus.DISTRIBUTED,
  DonationStatus.COMPLETED,
]

const conditionLabels: Record<ClothingCondition, string> = {
  [ClothingCondition.NEW]: "New",
  [ClothingCondition.LIKE_NEW]: "Like New",
  [ClothingCondition.GOOD]: "Good",
  [ClothingCondition.FAIR]: "Fair",
  [ClothingCondition.POOR]: "Poor",
}

export default async function DonationDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireRole(UserRole.DONOR)
  const currentUser = await getCurrentUser()

  const donationId = Number(params.id)
  if (!Number.isInteger(donationId) || donationId <= 0) {
    notFound()
  }

  const donation = await getDonationById(donationId)

  if (!donation) {
    notFound()
  }

  if (donation.donorId !== currentUser?.id) {
    notFound()
  }

  const currentStatusIndex = donation.currentStatus === DonationStatus.REJECTED
    ? -1
    : statusOrder.indexOf(donation.currentStatus as DonationStatus)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="w-fit mb-2 -ml-2">
            <Link href="/donor/donations">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to donations
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {donation.donationId}
            </h1>
            <Badge
              variant={statusBadgeVariant[donation.currentStatus as DonationStatus] ?? "outline"}
              className="text-sm px-3 py-1"
            >
              {donation.currentStatus.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Created on{" "}
            {new Date(donation.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {donation.receipt?.pdfUrl && (
          <Button asChild variant="outline">
            <a href={donation.receipt.pdfUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
              Download Receipt
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="glass border-white/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                Donor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Name
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {donation.donorName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Email
                </p>
                <p className="mt-1 text-slate-700">{donation.donorEmail}</p>
              </div>
              {donation.donorPhone && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Phone
                  </p>
                  <p className="mt-1 text-slate-700">{donation.donorPhone}</p>
                </div>
              )}
              {donation.campaign && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Campaign
                  </p>
                  <p className="mt-1 text-slate-700">{donation.campaign.name}</p>
                </div>
              )}
              {donation.pickupAddress && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Pickup Address
                  </p>
                  <p className="mt-1 text-slate-700">{donation.pickupAddress}</p>
                </div>
              )}
              {donation.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Notes
                  </p>
                  <p className="mt-1 text-slate-700">{donation.notes}</p>
                </div>
              )}
              {donation.receipt && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Receipt
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-slate-700">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    {donation.receipt.receiptNumber}
                    <span className="text-slate-400">
                      · Issued {new Date(donation.receipt.issuedAt).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-white/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" />
                Donation Items
              </CardTitle>
              <CardDescription>
                {donation.items.length} type{donation.items.length !== 1 ? "s" : ""} ·{" "}
                {donation.totalItems} total item{donation.totalItems !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donation.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-slate-900">
                        {item.category.name}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {item.size ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {conditionLabels[item.condition as ClothingCondition] ?? item.condition}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-900">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {item.description ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass border-white/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-emerald-600" />
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {donation.statusHistory.length === 0 ? (
                <p className="text-sm text-slate-500">No status changes yet.</p>
              ) : (
                <ul className="relative space-y-6">
                  <li className="absolute left-[19px] top-1 bottom-1 w-px bg-slate-200" />
                  {donation.statusHistory.map((entry, idx) => {
                    const isLast = idx === donation.statusHistory.length - 1
                    return (
                      <li key={entry.id} className="relative pl-10">
                        <span
                          className={`absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full border-2 ${
                            isLast
                              ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                              : "border-white bg-white text-slate-500 shadow"
                          }`}
                        >
                          {statusIconMap[entry.status as DonationStatus] ?? (
                            <History className="h-4 w-4" />
                          )}
                        </span>
                        <div className="glass rounded-xl border border-white/50 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              variant={
                                statusBadgeVariant[entry.status as DonationStatus] ??
                                "outline"
                              }
                            >
                              {entry.status.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-xs text-slate-500 shrink-0">
                              {new Date(entry.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            {new Date(entry.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p className="mt-1.5 text-sm text-slate-700">
                            by {entry.changedByUser?.name ?? "System"}
                            <span className="text-slate-400">
                              {" "}
                              · {entry.changedByUser?.role ?? ""}
                            </span>
                          </p>
                          {entry.note && (
                            <p className="mt-2 border-t border-slate-100 pt-2 text-xs italic text-slate-500">
                              “{entry.note}”
                            </p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {donation.currentStatus !== DonationStatus.REJECTED && (
            <Card className="glass border-white/60">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusOrder.slice(0, 6).map((status, index) => {
                  const reached = index <= currentStatusIndex
                  return (
                    <div
                      key={status}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div
                        className={`grid h-6 w-6 place-items-center rounded-full text-xs ${
                          reached
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {reached ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <span className="font-medium">{index + 1}</span>
                        )}
                      </div>
                      <span
                        className={
                          reached ? "font-medium text-slate-900" : "text-slate-500"
                        }
                      >
                        {status.replace(/_/g, " ")}
                      </span>
                    </div>
                  )
                })}
                <Separator />
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className={`grid h-6 w-6 place-items-center rounded-full text-xs ${
                      currentStatusIndex >= 6
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {currentStatusIndex >= 6 ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <span className="font-medium">7</span>
                    )}
                  </div>
                  <span
                    className={
                      currentStatusIndex >= 6
                        ? "font-medium text-slate-900"
                        : "text-slate-500"
                    }
                  >
                    Completed
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
