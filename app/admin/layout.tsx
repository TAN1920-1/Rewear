import Link from "next/link"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  Heart,
  Package,
  ClipboardList,
  Users,
  Truck,
  Megaphone,
  BarChart3,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Shield,
} from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { getNgoSummary } from "@/lib/services/ngo.service"
import { UserRole } from "@/lib/enums"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { signOut } from "@/lib/auth/auth"

const sidebarNav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/donations", label: "Donations", icon: Heart },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/requirements", label: "Requirements", icon: ClipboardList },
  { href: "/admin/beneficiaries", label: "Beneficiaries", icon: Users },
  { href: "/admin/distributions", label: "Distributions", icon: Truck },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/staff", label: "Staff", icon: Shield },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole(UserRole.NGO_ADMIN, UserRole.NGO_STAFF)

  const ngo = user.ngoId ? await getNgoSummary(user.ngoId) : null

  async function handleSignOut() {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50">
      <div className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl" />

      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/40 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent backdrop-blur-xl lg:flex">
          <div className="flex h-16 items-center gap-3 border-b border-white/40 px-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <Heart className="h-5 w-5 fill-current" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-bold tracking-tight text-slate-900">
                {ngo?.name ?? "REWEAR NGO"}
              </span>
              <span className="text-[11px] uppercase tracking-widest text-slate-500">
                Admin Panel
              </span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {sidebarNav.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-white/70 hover:text-emerald-700 hover:shadow-sm"
                >
                  <Icon className="h-4.5 w-4.5 text-slate-500 transition-colors group-hover:text-emerald-600" />
                  {item.label}
                  <ChevronRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-50" />
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-white/40 p-4">
            <div className="glass rounded-2xl border-white/50 p-3">
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                {user.name}
              </p>
              <form action={handleSignOut}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full justify-start gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 h-16 border-b border-white/40 bg-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50">
            <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <Heart className="h-4 w-4 fill-current" />
                </span>
              </div>

              <div className="hidden lg:block">
                <h2 className="text-sm text-slate-500">
                  Welcome back,{" "}
                  <span className="font-semibold text-slate-900">{user.name}</span>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  className={
                    user.role === UserRole.NGO_ADMIN
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0"
                      : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0"
                  }
                >
                  {user.role === UserRole.NGO_ADMIN ? "NGO Admin" : "NGO Staff"}
                </Badge>

                <div className="hidden items-center gap-3 rounded-2xl border border-white/50 bg-white/60 px-3 py-1.5 backdrop-blur sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-slate-900">
                      {user.name}
                    </span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                  </div>
                  <form action={handleSignOut} className="ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-slate-600 hover:text-rose-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </header>

          <main className="relative flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
