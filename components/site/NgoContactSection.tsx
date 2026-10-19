import { MapPin, Phone, Mail, Building2, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NGO_CONTACT } from "@/lib/constants/ngo-contact"

/**
 * Professional "Contact Us" section: confirmed NGO details + an interactive
 * OpenStreetMap (no API key required, so nothing to configure).
 */
export function NgoContactSection() {
  return (
    <section id="contact" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <Badge variant="outline" className="mb-4 rounded-full">
          Contact Us
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Visit or reach out to our team today
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          We&apos;d love to hear from you. Drop by our centre, give us a call, or send an email —
          every contribution counts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass border-white/60">
          <CardContent className="space-y-6 p-7">
            <div>
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{NGO_CONTACT.name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                A registered social organisation serving communities in Pune.
              </p>
            </div>

            <dl className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <dt className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <MapPin className="h-4 w-4" />
                </dt>
                <dd>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Address</p>
                  <p className="font-medium text-slate-900">{NGO_CONTACT.address}</p>
                </dd>
              </div>

              <div className="flex items-start gap-3">
                <dt className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Phone className="h-4 w-4" />
                </dt>
                <dd>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Mobile</p>
                  <a
                    href={`tel:${NGO_CONTACT.phone}`}
                    className="inline-flex min-h-11 items-center rounded-md font-medium text-slate-900 transition-colors hover:text-emerald-600"
                  >
                    {NGO_CONTACT.phoneDisplay}
                  </a>
                </dd>
              </div>

              <div className="flex items-start gap-3">
                <dt className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Mail className="h-4 w-4" />
                </dt>
                <dd>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Email</p>
                  <a
                    href={`mailto:${NGO_CONTACT.email}`}
                    className="inline-flex min-h-11 items-center rounded-md break-all font-medium text-slate-900 transition-colors hover:text-emerald-600"
                  >
                    {NGO_CONTACT.email}
                  </a>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="glass overflow-hidden border-white/60 p-0">
          <div className="relative h-[320px] w-full lg:h-full lg:min-h-[420px]">
            <iframe
              title={`Map showing the approximate location of ${NGO_CONTACT.name}`}
              src={NGO_CONTACT.mapEmbedUrl}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="flex flex-col gap-2 border-t border-white/60 bg-white/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Approximate location — {NGO_CONTACT.address}
            </p>
            <a
              href={NGO_CONTACT.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 rounded-md text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              View larger map
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </Card>
      </div>
    </section>
  )
}
