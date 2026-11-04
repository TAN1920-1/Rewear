import Image from "next/image"
import { QrCode, Landmark, ShieldCheck, Smartphone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NGO_CONTACT, NGO_DONATION } from "@/lib/constants/ngo-contact"
import { cn } from "@/lib/utils/cn"

/**
 * Public "donate money" section: the NGO's UPI QR code plus bank transfer
 * details. Real values are supplied in `NGO_DONATION`; empty fields render a
 * muted placeholder so the section is safe to ship before they are filled in.
 */
export function DonateMoneySection() {
  const details = [
    { label: "Account Holder", value: NGO_DONATION.accountHolder },
    { label: "Bank", value: NGO_DONATION.bankName },
    { label: "Account Number", value: NGO_DONATION.accountNumber },
    { label: "IFSC Code", value: NGO_DONATION.ifsc },
    { label: "UPI ID", value: NGO_DONATION.upiId },
  ]

  return (
    <section id="donate-money" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <Badge variant="outline" className="mb-4 rounded-full">
          Support with Money
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Prefer to give money instead?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          Your monetary contribution helps us buy what our communities need most right now — from
          grains and groceries to toys and school supplies. Scan the QR code or use the bank details
          below.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        {/* QR code */}
        <Card className="glass border-white/60">
          <CardContent className="flex flex-col items-center p-7 text-center">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <QrCode className="h-6 w-6" />
            </div>
            <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <Image
                src={NGO_DONATION.qrImage}
                alt={`UPI QR code to donate money to ${NGO_CONTACT.name}`}
                fill
                sizes="280px"
                className="object-contain"
              />
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-900">
              <Smartphone className="h-4 w-4 text-emerald-600" />
              Scan with any UPI app
            </p>
            <p className="mt-1 text-xs text-slate-500">Google Pay · PhonePe · Paytm · BHIM</p>
          </CardContent>
        </Card>

        {/* Bank details */}
        <Card className="glass border-white/60">
          <CardContent className="p-7">
            <div className="mb-5 flex items-start gap-3">
              <span className="mt-0.5 grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Landmark className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Bank transfer details</h3>
                <p className="text-sm text-slate-500">
                  Prefer NEFT / IMPS? Use the details below.
                </p>
              </div>
            </div>

            <dl className="divide-y divide-slate-200/70">
              {details.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <dt className="shrink-0 text-xs uppercase tracking-wider text-slate-500">
                    {d.label}
                  </dt>
                  <dd
                    className={cn(
                      "min-w-0 break-words text-right text-sm font-medium",
                      d.value ? "text-slate-900" : "text-slate-400"
                    )}
                  >
                    {d.value || "—"}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 flex items-start gap-2 text-xs text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Every contribution is used only for our community programs. Share your payment
              screenshot on WhatsApp and we&apos;ll send you a receipt.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
