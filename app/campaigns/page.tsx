import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { CampaignStatus, Priority } from "@/lib/enums"
import { formatDate, clamp } from "@/lib/utils/cn"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { PublicNavbar } from "@/components/layout/PublicNavbar"
import { PublicFooter } from "@/components/layout/PublicFooter"
import { Calendar, Target, Sparkles, ArrowRight, HandHeart, Flag } from "lucide-react"

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case CampaignStatus.ACTIVE:
      return "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
    case CampaignStatus.COMPLETED:
      return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"
    case CampaignStatus.PAUSED:
      return "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"
    case CampaignStatus.ARCHIVED:
      return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100"
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100"
  }
}

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
  title: "Campaigns",
  description: "Explore active and past clothing donation campaigns. Support communities through our targeted drives.",
  alternates: { canonical: "/campaigns" },
}

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: {
        notIn: [CampaignStatus.DRAFT],
      },
    },
    include: {
      campaignDonations: {
        select: {
          itemsCount: true,
        },
      },
      _count: {
        select: {
          campaignDonations: true,
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { priority: "asc" },
      { createdAt: "desc" },
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
              <Flag className="mr-1.5 h-3.5 w-3.5" />
              Community campaigns & drives
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Drive change with{" "}
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                focused campaigns
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Each campaign targets a specific community or season. Donate to a campaign and watch your items
              count toward a collective impact goal.
            </p>
          </div>
        </section>

        {/* Campaigns List */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          {campaigns.length === 0 ? (
            <Card className="glass border-white/60 p-12 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">No campaigns yet</h3>
              <p className="mt-2 text-slate-600">Check back soon for upcoming donation drives.</p>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => {
                const totalReceived = campaign.campaignDonations.reduce((sum, cd) => sum + cd.itemsCount, 0)
                const progress = clamp(Math.round((totalReceived / campaign.targetQty) * 100), 0, 100)
                return (
                  <Card key={campaign.id} className="glass group border-white/60 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col">
                    <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100">
                      {campaign.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={campaign.coverImageUrl}
                          alt={campaign.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/70 text-emerald-600 shadow">
                            <HandHeart className="h-8 w-8" />
                          </div>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge className={`border ${getStatusBadgeVariant(campaign.status)}`}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge className={`border ${getPriorityBadgeVariant(campaign.priority)}`}>
                          {campaign.priority}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6 flex flex-col flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 leading-tight mb-2">{campaign.name}</h3>

                      {campaign.description && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{campaign.description}</p>
                      )}

                      <div className="mb-4 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {campaign.startDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(campaign.startDate)}</span>
                          </div>
                        )}
                        {campaign.endDate && (
                          <div className="flex items-center gap-1">
                            <span>→</span>
                            <span>{formatDate(campaign.endDate)}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto space-y-3">
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                              <Target className="h-4 w-4 text-emerald-600" />
                              {totalReceived.toLocaleString()} / {campaign.targetQty.toLocaleString()} items
                            </div>
                            <span className="font-semibold text-emerald-600">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2.5 bg-emerald-100" />
                        </div>

                        <div className="text-xs text-slate-500 mb-4">
                          {campaign._count.campaignDonations.toLocaleString()} donation
                          {campaign._count.campaignDonations === 1 ? "" : "s"} contributed
                        </div>

                        <Button
                          asChild
                          className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/20"
                        >
                          <Link href="/donor/donations/new">
                            Support Campaign
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
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
