"use client"

import Link from "next/link"
import { Heart, HandCoins } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Interactive elements keep a ≥44×44px hit area (WCAG 2.5.8 «Target Size»).
 */
const NAV_LINK_CLASS =
  "inline-flex min-h-11 items-center rounded-md px-2 transition-colors hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-h-11 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
            <Heart className="h-5 w-5 fill-current" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-bold tracking-tight text-slate-900">REWEAR</span>
            <span className="text-[11px] uppercase tracking-widest text-slate-500">
              Give clothes a second life
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-3 text-sm font-medium text-slate-600 md:flex">
          <Link href="/requirements" className={NAV_LINK_CLASS}>
            Needs
          </Link>
          <Link href="/campaigns" className={NAV_LINK_CLASS}>
            Campaigns
          </Link>
          <Link href="/impact" className={NAV_LINK_CLASS}>
            Impact
          </Link>
          <Link href="/track" className={NAV_LINK_CLASS}>
            Track Donation
          </Link>
          <Link href="/#contact" className={NAV_LINK_CLASS}>
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden min-h-11 items-center sm:inline-flex">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="min-h-11 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
          >
            <Link href="/donor/donations/new">
              <HandCoins className="mr-2 h-4 w-4" />
              Donate Now
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
