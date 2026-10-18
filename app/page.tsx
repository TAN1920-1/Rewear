import Link from "next/link"
import { Heart, HandCoins, ShieldCheck, Sparkles, ArrowRight, Search, History, MapPin, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DonationGallery } from "@/components/site/DonationGallery"
import { NgoContactSection } from "@/components/site/NgoContactSection"
import { NGO_CONTACT } from "@/lib/constants/ngo-contact"

export default function HomePage() {
  const features = [
    {
      icon: <History className="h-6 w-6" />,
      title: "Track Impact",
      desc: "Follow your donation end-to-end — from drop-off to distribution to the beneficiary group.",
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Trusted Transparency",
      desc: "Every status change is recorded on a public timeline with timestamps and responsible staff.",
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Smart Matching",
      desc: "Our system instantly tells you when your donation meets the most urgent needs of the NGO.",
    },
  ]

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-emerald-50 via-white to-teal-50">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-20 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl" />

      {/* Navbar */}
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
            <Link href="/#contact" className="hover:text-emerald-600 transition-colors">
              Contact
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

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="secondary" className="mb-6 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 shadow-sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Smart NGO clothing donation platform
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Give clothes a{" "}
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                second life
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Donate pre-loved clothing with full transparency. Track each item from your doorstep to the
              community that needs it. REWEAR connects your kindness with verified NGO operations.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-xl shadow-emerald-500/30">
                <Link href="/donor/donations/new">
                  Start a Donation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-white/80 backdrop-blur">
                <Link href="/track">
                  <Search className="mr-2 h-4 w-4" />
                  Track a Donation
                </Link>
              </Button>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 text-center">
              {[
                { k: "Items Donated", v: "2.4K" },
                { k: "Lives Touched", v: "820" },
                { k: "Campaigns", v: "12" },
              ].map((s) => (
                <div key={s.k}>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">{s.k}</dt>
                  <dd className="mt-1 text-2xl font-bold text-slate-900">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="glass relative z-10 mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl border-white/50 shadow-2xl shadow-emerald-900/10">
              {/* Hero illustration via API placeholder */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=warm%20community%20volunteers%20sorting%20colorful%20donated%20clothes%20in%20a%20bright%20sunlit%20NGO%20charity%20warehouse%2C%20high%20quality%20photography&image_size=portrait_4_3"
                alt="Volunteers sorting donated clothes"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-emerald-300 to-teal-500"
                      />
                    ))}
                  </div>
                  <p className="text-sm font-medium">
                    842 donors supported this month.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -left-4 top-12 z-20 hidden rotate-[-6deg] rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-900/5 sm:block">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <History className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-slate-500">Latest donation</p>
                  <p className="font-semibold text-slate-900">DON-2026-000128 — Received</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-6 bottom-16 z-20 hidden rotate-[5deg] rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-900/5 sm:block">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
                  <Heart className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-slate-500">Winter Warmth</p>
                  <p className="font-semibold text-slate-900">Campaign — 76% funded</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4 rounded-full">Why REWEAR</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Transparency that builds trust
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Our end-to-end platform helps both donors and NGO staff stay aligned on the same mission:
            getting the right clothes to the right people, at the right time.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="glass group border-white/60 transition-all hover:-translate-y-1 hover:shadow-xl">
              <CardContent className="p-7">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <DonationGallery />

      {/* Contact & Location */}
      <NgoContactSection />

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="glass relative overflow-hidden rounded-3xl border-white/50 p-10 shadow-2xl shadow-emerald-900/10 sm:p-14">
          <div className="pointer-events-none absolute -right-10 -top-14 h-64 w-64 rounded-full bg-emerald-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-teal-400/30 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h3 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Your closet can change a life today.
              </h3>
              <p className="mt-3 text-slate-600">
                It only takes 3 minutes to create a donation. Drop-off or schedule a pickup — we handle the rest.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-slate-900 text-white hover:bg-slate-800 shadow-xl">
                <Link href="/register">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/requirements">Browse Current Needs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 bg-white/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <Heart className="h-3.5 w-3.5 fill-current" />
                </span>
                <span className="font-semibold text-slate-900">{NGO_CONTACT.name}</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-slate-500">
                Give clothes a second life — every donation is tracked transparently from your
                doorstep to the community that needs it.
              </p>
            </div>

            <div className="text-sm text-slate-600">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Contact
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{NGO_CONTACT.address}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-emerald-600" />
                  <a href={`tel:${NGO_CONTACT.phone}`} className="hover:text-emerald-600">
                    {NGO_CONTACT.phoneDisplay}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-emerald-600" />
                  <a href={`mailto:${NGO_CONTACT.email}`} className="break-all hover:text-emerald-600">
                    {NGO_CONTACT.email}
                  </a>
                </li>
              </ul>
            </div>

            <div className="text-sm text-slate-600">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Explore
              </p>
              <ul className="space-y-2">
                <li><Link href="/requirements" className="hover:text-emerald-600">Current Needs</Link></li>
                <li><Link href="/campaigns" className="hover:text-emerald-600">Campaigns</Link></li>
                <li><Link href="/impact" className="hover:text-emerald-600">Impact</Link></li>
                <li><Link href="/track" className="hover:text-emerald-600">Track a Donation</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200/70 pt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} {NGO_CONTACT.name}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
