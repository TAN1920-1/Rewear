import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { formatDate } from "@/lib/utils/cn"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PublicNavbar } from "@/components/layout/PublicNavbar"
import { PublicFooter } from "@/components/layout/PublicFooter"
import { Heart, Users, Shirt, Sparkles, Calendar, User, ArrowRight, BookOpen } from "lucide-react"

export const metadata = {
  title: "Impact Stories",
  description: "Read real stories from communities we've supported. See how clothing donations change lives.",
}

export default async function ImpactPage() {
  const stories = await prisma.impactStory.findMany({
    where: { published: true },
    include: { author: true },
    orderBy: { publishedAt: "desc" },
  })

  const totalStories = stories.length
  const totalItems = stories.reduce((sum, s) => sum + (s.itemsDistributed ?? 0), 0)

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-emerald-50 via-white to-teal-50">
      <div className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-20 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl" />

      <PublicNavbar />

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-6 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 shadow-sm">
            <Heart className="mr-1.5 h-3.5 w-3.5 fill-current" />
            Real stories, real impact
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Impact stories from{" "}
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              our communities
            </span>
            .
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            Behind every number is a person. Read the stories of families and individuals whose lives
            changed because someone chose to donate.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="glass border-white/60">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Stories Published</p>
                <p className="text-2xl font-bold text-slate-900">{totalStories.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-white/60">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25">
                <Shirt className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Items Highlighted</p>
                <p className="text-2xl font-bold text-slate-900">{totalItems.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-white/60">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Programs Featured</p>
                <p className="text-2xl font-bold text-slate-900">
                  {new Set(stories.map((s) => s.program).filter(Boolean)).size.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stories List */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {stories.length === 0 ? (
          <Card className="glass border-white/60 p-12 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Stories coming soon</h3>
            <p className="mt-2 text-slate-600">Check back for heartwarming stories from our community.</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => {
              const excerpt =
                story.content.length > 160
                  ? story.content.slice(0, 160).trim() + "…"
                  : story.content
              return (
                <Card key={story.id} className="glass group border-white/60 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col">
                  <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100">
                    {story.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={story.coverImageUrl}
                        alt={story.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/70 text-emerald-600 shadow">
                          <Heart className="h-8 w-8 fill-current" />
                        </div>
                      </div>
                    )}
                    {story.program && (
                      <div className="absolute bottom-3 left-3">
                        <Badge className="rounded-full border border-white/60 bg-white/80 backdrop-blur text-slate-700 shadow">
                          {story.program}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 leading-tight mb-3">
                      {story.title}
                    </h3>

                    <p className="text-sm text-slate-600 mb-5 line-clamp-3 leading-relaxed">
                      {excerpt}
                    </p>

                    <div className="mt-auto space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          <span>{story.author.name}</span>
                        </div>
                        {story.publishedAt && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(story.publishedAt)}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-emerald-200 bg-white/80 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        <Link href="/impact">
                          Read story
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

      <PublicFooter />
    </div>
  )
}
