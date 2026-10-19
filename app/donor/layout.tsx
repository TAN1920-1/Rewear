import Link from "next/link"
import { Heart, LayoutDashboard, Gift, PlusCircle, Bell, Home, LogOut } from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { UserRole } from "@/lib/enums"
import { signOut } from "@/lib/auth/auth"

export default async function DonorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Identity comes from the signed JWT (no DB round-trip) so the shell can
  // stream immediately instead of blocking on a ~remote query.
  const user = await requireRole(UserRole.DONOR)

  async function handleSignOut() {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  const navItems = [
    {
      href: "/donor/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: "/donor/donations",
      label: "My Donations",
      icon: <Gift className="h-4 w-4" />,
    },
    {
      href: "/donor/donations/new",
      label: "New Donation",
      icon: <PlusCircle className="h-4 w-4" />,
    },
    {
      href: "/notifications",
      label: "Notifications",
      icon: <Bell className="h-4 w-4" />,
    },
  ]

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-emerald-50 via-white to-teal-50">
      <div className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <Heart className="h-5 w-5 fill-current" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-bold tracking-tight text-slate-900">REWEAR</span>
              <span className="text-[11px] uppercase tracking-widest text-slate-500">
                Donor Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">
              Welcome, <span className="font-semibold text-slate-900">{user?.name}</span>
            </span>
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Home</span>
              </Link>
            </Button>
            <form action={handleSignOut}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="h-11 sm:h-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1">Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <nav className="glass sticky top-24 space-y-1 rounded-2xl border-white/60 p-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <nav className="glass mb-6 flex w-full gap-2 overflow-x-auto rounded-2xl border-white/60 p-2 lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
