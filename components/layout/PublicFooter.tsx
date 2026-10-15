import Link from "next/link"
import { Heart } from "lucide-react"

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/60 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Heart className="h-3.5 w-3.5 fill-current" />
            </span>
            <span>© {new Date().getFullYear()} REWEAR NGO · All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-emerald-600">Sign in</Link>
            <Link href="/track" className="hover:text-emerald-600">Track</Link>
            <Link href="/impact" className="hover:text-emerald-600">Impact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
