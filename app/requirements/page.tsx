import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { Priority } from "@/lib/enums"
import { formatDate, clamp } from "@/lib/utils/cn"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { PublicNavbar } from "@/components/layout/PublicNavbar"
import { PublicFooter } from "@/components/layout/PublicFooter"
import { Calendar, Target, Sparkles, ArrowRight } from "lucide-react"

function getPriorityBadgeVariant(priority: string) {
  switch (priority) {
    case Priority.CRITICAL:
      return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
    case Priority.HIGH:
      return "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100"
    case Priority.MEDIUM:
      return "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"
    case Priority.LOW:
      return "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100"
  }
}

export const metadata = {
  title: "Current Needs",
  description: "Browse current clothing requirements and urgent needs from our community programs.",
  alternates: { canonical: "/requirements" },
}

// Rendered per-request: this page reads the database, and prerendering it at
// build time makes the whole build fail whenever the database is unreachable
// (e.g. a cold serverless Postgres instance).
export const dynamic = "force-dynamic"

export default async function RequirementsPage() {
  const requirements = await prisma.requirement.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: [
      { priority: "asc" },
      { deadline: "asc" },
    ],
  })

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-emerald-50 via-white to-teal-50">
      <div className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-20 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl" />

      <PublicNavbar />

      <main>
        {/* Hero */}
        <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pt-20">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 shadow-sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Active community requirements
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              What our communities need{" "}
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                right now
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Every item below is a specific, verified need from one of our programs.
              Your donation directly fulfills these — track the impact from your closet to the community.
            </p>
          </div>
        </section>

        {/* Requirements List */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          {requirements.length === 0 ? (
            <Card className="glass border-white/60 p-12 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Target className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">No active requirements at the moment</h3>
              <p className="mt-2 text-slate-600">Check back soon for new community needs.</p>
              <Button asChild className="mt-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                <Link href="/campaigns">
                  Browse Campaigns
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {requirements.map((req) => {
                const progress = clamp(Math.round((req.fulfilledQty / req.requiredQty) * 100), 0, 100)
                return (
                  <Card key={req.id} className="glass group border-white/60 transition-all hover:-translate-y-1 hover:shadow-xl">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold text-slate-900 leading-tight">{req.title}</h3>
                        <Badge className={`border ${getPriorityBadgeVariant(req.priority)}`}>
                          {req.priority}
                        </Badge>
                      </div>

                      {req.program && (
                        <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                            {req.program}
                          </span>
                        </div>
                      )}

                      <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-teal-700">
                          {req.category.name}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">
                            {req.fulfilledQty.toLocaleString()} / {req.requiredQty.toLocaleString()} items
                          </span>
                          <span className="font-semibold text-emerald-600">{progress}%</span>
                        </div>
                        <Progress
                          value={progress}
                          className="h-2.5 bg-emerald-100"
                        />
                      </div>

                      {req.deadline && (
                        <div className="mb-5 flex items-center gap-1.5 text-sm text-slate-500">
                          <Calendar className="h-4 w-4" />
                          <span>Needed by {formatDate(req.deadline)}</span>
                        </div>
                      )}

                      <Button
                        asChild
                        className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/20"
                      >
                        <Link href="/donor/donations/new">
                          Donate for this need
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

      </main>

      <PublicFooter />
    </div>
  )
}
