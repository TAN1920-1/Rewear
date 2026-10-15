"use client"

import Link from "next/link"
import { Heart, HandCoins } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
            <Heart className="h-5 w-5 fill-current" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-bold tracking-tight text-slate-900">REWEAR</span>
            <span className="text-[11px] uppercase tracking-widest text-slate-500">
              Give clothes a second life
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <Link href="/requirements" className="hover:text-emerald-600 transition-colors">
            Needs
          </Link>
          <Link href="/campaigns" className="hover:text-emerald-600 transition-colors">
            Campaigns
          </Link>
          <Link href="/impact" className="hover:text-emerald-600 transition-colors">
            Impact
          </Link>
          <Link href="/track" className="hover:text-emerald-600 transition-colors">
            Track Donation
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25">
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
