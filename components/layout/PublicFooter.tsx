import Link from "next/link"
import { Heart, MapPin, Phone, Mail } from "lucide-react"
import { NGO_CONTACT } from "@/lib/constants/ngo-contact"

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
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Contact
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{NGO_CONTACT.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-emerald-600" />
                <a href={`tel:${NGO_CONTACT.phone}`} className="hover:text-emerald-600">
                  {NGO_CONTACT.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-emerald-600" />
                <a href={`mailto:${NGO_CONTACT.email}`} className="break-all hover:text-emerald-600">
                  {NGO_CONTACT.email}
                </a>
              </li>
            </ul>
          </div>

          <div className="text-sm text-slate-600">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Explore
            </p>
            <ul className="space-y-2">
              <li><Link href="/requirements" className="hover:text-emerald-600">Current Needs</Link></li>
              <li><Link href="/campaigns" className="hover:text-emerald-600">Campaigns</Link></li>
              <li><Link href="/impact" className="hover:text-emerald-600">Impact</Link></li>
              <li><Link href="/track" className="hover:text-emerald-600">Track a Donation</Link></li>
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
