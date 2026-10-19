import Link from "next/link"
import { Heart, MapPin, Phone, Mail } from "lucide-react"
import { NGO_CONTACT } from "@/lib/constants/ngo-contact"

/** Keeps every footer link at a ≥44px tall hit area (WCAG 2.5.8 «Target Size»). */
const FOOTER_LINK =
  "inline-flex min-h-11 items-center rounded-md hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/60 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <Heart className="h-3.5 w-3.5 fill-current" />
              </span>
              <span className="font-semibold text-slate-900">{NGO_CONTACT.name}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Give clothes a second life — every donation is tracked transparently from your
              doorstep to the community that needs it.
            </p>
          </div>

          <div className="text-sm text-slate-600">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Contact
            </p>
            <ul className="space-y-1">
              <li className="flex items-start gap-2">
                <MapPin className="mt-3.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{NGO_CONTACT.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-emerald-600" />
                <a href={`tel:${NGO_CONTACT.phone}`} className={FOOTER_LINK}>
                  {NGO_CONTACT.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-emerald-600" />
                <a href={`mailto:${NGO_CONTACT.email}`} className={`${FOOTER_LINK} break-all`}>
                  {NGO_CONTACT.email}
                </a>
              </li>
            </ul>
          </div>

          <div className="text-sm text-slate-600">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Explore
            </p>
            <ul>
              <li><Link href="/requirements" className={FOOTER_LINK}>Current Needs</Link></li>
              <li><Link href="/campaigns" className={FOOTER_LINK}>Campaigns</Link></li>
              <li><Link href="/impact" className={FOOTER_LINK}>Impact</Link></li>
              <li><Link href="/track" className={FOOTER_LINK}>Track a Donation</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200/70 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {NGO_CONTACT.name}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
