import Link from "next/link"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db/prisma"
import { requireAuthenticated } from "@/lib/auth/guards"
import { formatDateTime } from "@/lib/utils/cn"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PublicNavbar } from "@/components/layout/PublicNavbar"
import { PublicFooter } from "@/components/layout/PublicFooter"
import {
  Bell,
  CheckCheck,
  Home,
  ArrowRight,
  Inbox,
  Sparkles,
  Gift,
  Target,
  Flag,
  Package,
  Boxes,
  CalendarDays,
} from "lucide-react"
import type { Notification } from "@prisma/client"

async function markAsRead(formData: FormData) {
  "use server"
  const user = await requireAuthenticated()
  const id = Number(formData.get("id"))
  if (!id || Number.isNaN(id)) return

  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true, readAt: new Date() },
  })

  revalidatePath("/notifications")
}

async function markAllAsRead() {
  "use server"
  const user = await requireAuthenticated()

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true, readAt: new Date() },
  })

  revalidatePath("/notifications")
}

function getRelatedIcon(relatedType: string | null) {
  switch (relatedType) {
    case "donation":
      return <Package className="h-4 w-4" />
    case "requirement":
      return <Target className="h-4 w-4" />
    case "campaign":
      return <Flag className="h-4 w-4" />
    case "distribution":
      return <CalendarDays className="h-4 w-4" />
    case "inventory":
      return <Boxes className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

function getRelatedBadgeClass(relatedType: string | null) {
  switch (relatedType) {
    case "donation":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "requirement":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "campaign":
      return "bg-teal-50 text-teal-700 border-teal-200"
    case "distribution":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "inventory":
      return "bg-orange-50 text-orange-700 border-orange-200"
    default:
      return "bg-slate-50 text-slate-700 border-slate-200"
  }
}

export const metadata = {
  title: "Notifications",
  description: "View your latest updates, donation status changes, and campaign alerts.",
}

export default async function NotificationsPage() {
  const user = await requireAuthenticated()

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-emerald-50 via-white to-teal-50">
      <div className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-20 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl" />

      <PublicNavbar />

      {/* Header */}
      <section className="relative mx-auto max-w-4xl px-4 pb-8 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-4 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 shadow-sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Your activity hub
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                Notifications
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-slate-600">
              Stay on top of donation updates, campaign progress, and program alerts from REWEAR.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 shadow-sm">
              <Bell className="h-4 w-4" />
              {unreadCount} unread
            </div>
            {unreadCount > 0 && (
              <form action={markAllAsRead}>
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="bg-white/80 backdrop-blur"
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark all read
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Notifications List */}
      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
        {notifications.length === 0 ? (
          <Card className="glass border-white/60">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Inbox className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">No notifications yet</h3>
              <p className="mt-2 text-slate-600">
                We&apos;ll let you know when there are updates on your donations or campaigns.
              </p>
              <Button
                asChild
                className="mt-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Back to home
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass border-white/60 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {notifications.map((notif: Notification) => (
                <div
                  key={notif.id}
                  className={[
                    "flex items-start gap-4 p-5 transition-colors",
                    notif.read ? "bg-white/30" : "bg-emerald-50/50",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border shadow-sm",
                      getRelatedBadgeClass(notif.relatedType),
                    ].join(" ")}
                  >
                    {getRelatedIcon(notif.relatedType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={[
                          "font-semibold leading-tight",
                          notif.read ? "text-slate-700" : "text-slate-900",
                        ].join(" ")}
                      >
                        {notif.title}
                      </h3>
                      {!notif.read && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{formatDateTime(notif.createdAt)}</span>
                      {notif.relatedType && (
                        <Badge
                          variant="outline"
                          className={`border ${getRelatedBadgeClass(notif.relatedType)}`}
                        >
                          {notif.relatedType}
                          {notif.relatedId ? ` #${notif.relatedId}` : ""}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {!notif.read && (
                    <form action={markAsRead}>
                      <input type="hidden" name="id" value={notif.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                      >
                        <CheckCheck className="h-4 w-4" />
                        <span className="sr-only">Mark as read</span>
                      </Button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="bg-white/80 backdrop-blur">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
          <Button
            asChild
            className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
          >
            <Link href="/requirements">
              Browse needs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
