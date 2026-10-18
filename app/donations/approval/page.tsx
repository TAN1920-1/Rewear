import Link from "next/link"
import type { Metadata } from "next"
import { Heart, AlertTriangle, Calendar, Package, User, MapPin, Phone, Mail } from "lucide-react"
import { getApprovalRequest } from "@/lib/services/donation-approval.service"
import { ApprovalActions } from "./ApprovalActions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Donation approval",
  robots: { index: false, follow: false },
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default async function ApprovalPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const token = typeof searchParams.token === "string" ? searchParams.token : ""
  const actionParam = typeof searchParams.action === "string" ? searchParams.action : ""
  const intendedAction =
    actionParam === "reject" ? "reject" : actionParam === "approve" ? "approve" : null

  const view = await getApprovalRequest(token)
  const donation = view.donation

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50 px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-24 right-0 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-3xl space-y-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
            <Heart className="h-6 w-6 fill-current" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Donation approval
          </h1>
          <p className="max-w-md text-sm text-slate-500">
            {view.ngoName ? `${view.ngoName} · ` : ""}Review the request below and approve or
            reject it. No sign-in required.
          </p>
        </header>

        {view.state === "invalid" || !donation ? (
          <Alert className="glass border-amber-200 bg-amber-50 text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>This link can&apos;t be used</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{view.reason ?? "The approval link is invalid."}</p>
              <Link href="/" className="inline-block text-sm font-medium text-emerald-700 underline">
                Return to the website
              </Link>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Card className="glass border-white/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">{donation.code}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    Submitted {formatDateTime(donation.submittedAt)}
                  </p>
                </div>
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                  Awaiting approval
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Donor */}
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <User className="h-3.5 w-3.5" /> Donor details
                  </h2>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-slate-500">Name</dt>
                      <dd className="text-sm font-medium text-slate-900">{donation.donorName}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1 text-xs text-slate-500">
                        <Mail className="h-3 w-3" /> Email
                      </dt>
                      <dd className="break-all text-sm text-slate-700">{donation.donorEmail}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1 text-xs text-slate-500">
                        <Phone className="h-3 w-3" /> Phone
                      </dt>
                      <dd className="text-sm text-slate-700">{donation.donorPhone || "—"}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> Pickup / drop-off
                      </dt>
                      <dd className="whitespace-pre-line text-sm text-slate-700">
                        {donation.pickupAddress || "—"}
                      </dd>
                    </div>
                    {donation.campaignName && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-slate-500">Campaign</dt>
                        <dd className="text-sm text-slate-700">{donation.campaignName}</dd>
                      </div>
                    )}
                    {donation.notes && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-slate-500">Notes</dt>
                        <dd className="whitespace-pre-line text-sm text-slate-700">{donation.notes}</dd>
                      </div>
                    )}
                  </dl>
                </section>

                {/* Items */}
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <Package className="h-3.5 w-3.5" /> Cloth details ({donation.totalItems} pieces)
                  </h2>
                  <div className="overflow-hidden rounded-xl border border-white/60">
                    <table className="w-full text-sm">
                      <thead className="bg-white/70 text-left text-slate-500">
                        <tr>
                          <th className="px-4 py-2 font-medium">Category</th>
                          <th className="px-4 py-2 font-medium">Size</th>
                          <th className="px-4 py-2 font-medium">Condition</th>
                          <th className="px-4 py-2 text-right font-medium">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/60">
                        {donation.items.map((item, idx) => (
                          <tr key={idx} className="bg-white/40">
                            <td className="px-4 py-2 text-slate-900">{item.categoryName}</td>
                            <td className="px-4 py-2 text-slate-600">{item.size || "—"}</td>
                            <td className="px-4 py-2 text-slate-600">
                              {item.condition.replace(/_/g, " ")}
                            </td>
                            <td className="px-4 py-2 text-right text-slate-900">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {view.expiresAt
                    ? `This link expires ${formatDateTime(view.expiresAt)}.`
                    : null}
                </div>
              </CardContent>
            </Card>

            <ApprovalActions
              token={token}
              donationCode={donation.code}
              intendedAction={intendedAction}
            />
          </>
        )}
      </div>
    </div>
  )
}
