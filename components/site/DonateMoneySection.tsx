import Image from "next/image"
import { QrCode, ShieldCheck, Smartphone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NGO_CONTACT, NGO_DONATION } from "@/lib/constants/ngo-contact"

/**
 * Public "donate money" section. Donations are collected purely through the
 * NGO's UPI QR code, which donors scan with any payment app.
 */
export function DonateMoneySection() {
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
          grains and groceries to toys and school supplies. Just scan the QR code below.
        </p>
      </div>

      <Card className="glass mx-auto max-w-md border-white/60">
        <CardContent className="flex flex-col items-center p-7 text-center sm:p-9">
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
            <QrCode className="h-6 w-6" />
          </div>

          <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <Image
              src={NGO_DONATION.qrImage}
              alt={`UPI QR code to donate money to ${NGO_CONTACT.name}`}
              fill
              sizes="300px"
              className="object-contain"
            />
          </div>

          <p className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-900">
            <Smartphone className="h-4 w-4 text-emerald-600" />
            Scan with any UPI app
          </p>
          <p className="mt-1 text-xs text-slate-500">Google Pay · PhonePe · Paytm · BHIM</p>

          <p className="mt-6 flex items-start gap-2 text-left text-xs text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Every contribution is used only for our community programs. Share your payment
            screenshot on WhatsApp and we&apos;ll send you a receipt.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
