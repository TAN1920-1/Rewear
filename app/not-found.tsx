import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PublicNavbar } from "@/components/layout/PublicNavbar"
import { PublicFooter } from "@/components/layout/PublicFooter"
import { Home, Compass, ArrowRight } from "lucide-react"

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-emerald-50 via-white to-teal-50">
      <div className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-20 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl" />

      <PublicNavbar />

      <main>
        <section className="relative mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <Card className="glass border-white/60">
            <CardContent className="p-10 sm:p-14 text-center">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30">
                <Compass className="h-10 w-10" />
              </div>
              <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent sm:text-7xl">
                404
              </h1>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                Page not found
              </h2>
              <p className="mx-auto mt-3 max-w-md text-slate-600">
                The page you were looking for seems to have wandered off. Let&apos;s get you back on track.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-xl shadow-emerald-500/30">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Back to home
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="bg-white/80 backdrop-blur">
                  <Link href="/requirements">
                    Browse needs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

      </main>

      <PublicFooter />
    </div>
  )
}
