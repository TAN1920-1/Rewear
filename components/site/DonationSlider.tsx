"use client"

import Image from "next/image"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type TouchEvent,
} from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/cn"

/**
 * Donated-photo slider shown on the home page.
 *
 * Photos and their captions live in the `SLIDES` array below, so the copy can
 * be edited in one place without touching the slider logic.
 */
const SLIDES = [
  {
    src: "/images/donation-1.jpeg",
    alt: "Donated items collected and packed by REWEAR volunteers",
    title: "Your donations, received",
    description:
      "Every item dropped off at our Katraj centre is logged, inspected and prepared for the families who need it most.",
  },
  {
    src: "/images/donation-2.jpeg",
    alt: "Volunteers sorting and organising donated goods",
    title: "Sorted with care",
    description:
      "Volunteers sort, clean and quality-check each donation so it reaches beneficiaries in the best possible condition.",
  },
  {
    src: "/images/donation-3.jpeg",
    alt: "Bundled donation kits prepared for distribution",
    title: "Packed for distribution",
    description:
      "Bundled kits are prepared and dispatched to communities across Pune during our ongoing drives.",
  },
  {
    src: "/images/donation-4.jpeg",
    alt: "Volunteers with collected clothing donations at the drive",
    title: "Hand in hand, hope in every box",
    description:
      "Volunteers coming together to collect, carry and catalogue every donated item with care.",
  },
  {
    src: "/images/donation-5.jpeg",
    alt: "Community members receiving donated clothing",
    title: "Reaching the families",
    description:
      "Donated clothes reaching the families and communities who need them most.",
  },
  {
    src: "/images/donation-6.jpeg",
    alt: "Volunteers organising sorted donated clothes",
    title: "Sorted and ready",
    description:
      "Every garment is sorted by size and season so it can be matched to the right requirement.",
  },
  {
    src: "/images/donation-7.jpeg",
    alt: "Staff and volunteers preparing a donation drive",
    title: "Together at the centre",
    description:
      "Staff and volunteers prepare the next drive at our Sukhsagar Nagar centre in Katraj.",
  },
  {
    src: "/images/donation-8.jpeg",
    alt: "Packed donation kits lined up for distribution",
    title: "Kits lined up",
    description:
      "Freshly packed donation kits waiting to be handed over to beneficiary groups.",
  },
  {
    src: "/images/donation-9.jpeg",
    alt: "Donated clothing items handed to a community member",
    title: "A second life, a new smile",
    description:
      "Gently used clothes find a second life with someone who truly needs them.",
  },
  {
    src: "/images/donation-10.jpeg",
    alt: "Volunteers inspecting donated garments before distribution",
    title: "Quality checked",
    description:
      "Each item is inspected and cleaned before it is cleared for distribution.",
  },
  {
    src: "/images/donation-11.jpeg",
    alt: "Boxes of donated clothes ready for dispatch",
    title: "Ready to dispatch",
    description:
      "Boxed donations are labelled and loaded for dispatch to partner communities.",
  },
  {
    src: "/images/donation-12.jpeg",
    alt: "Volunteers and beneficiaries at a donation handover",
    title: "Where kindness lands",
    description:
      "The moment your donation reaches the community — the reason we do this every day.",
  },
  {
    src: "/images/donation-13.jpeg",
    alt: "The REWEAR team with collected donations",
    title: "Powered by donors like you",
    description:
      "Every drive is powered entirely by donors and volunteers who give their time and goods.",
  },
  {
    src: "/images/gallery-1.webp",
    alt: "Warm community volunteers sorting colourful donated clothes at the NGO centre",
    title: "A community effort",
    description:
      "Donors, volunteers and staff working side by side to give clothes and essentials a second life.",
  },
  {
    src: "/images/gallery-2.webp",
    alt: "Community members with donated clothing items",
    title: "From closet to community",
    description:
      "Freshly collected goods on their way to the people who need them the most.",
  },
  {
    src: "/images/gallery-3.webp",
    alt: "Volunteers preparing donated items for distribution",
    title: "Ready for the next drive",
    description:
      "Prepared stock waiting to be matched with the latest community requirements.",
  },
  {
    src: "/images/mangaldham.webp",
    alt: "Mangaldham Bahuuddeshiy Samajik Sanstha activity",
    title: "Mangaldham Bahuuddeshiy Samajik Sanstha",
    description: "Serving communities in Sukhsagar Nagar, Katraj, Pune.",
  },
] as const

const AUTOPLAY_MS = 5500

export function DonationSlider() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const count = SLIDES.length

  const goTo = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  )

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index])
  const goNext = useCallback(() => goTo(index + 1), [goTo, index])

  // Auto-advance, paused on hover/focus and for visitors who prefer reduced motion.
  useEffect(() => {
    if (paused || count <= 1) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [paused, count])

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      goPrev()
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      goNext()
    }
  }

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
    const start = touchStartX.current
    touchStartX.current = null
    if (start === null) return
    const delta = (e.changedTouches[0]?.clientX ?? start) - start
    if (Math.abs(delta) < 45) return
    if (delta < 0) goNext()
    else goPrev()
  }

  return (
    <section
      aria-labelledby="donated-photos-heading"
      className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8"
    >
      <div className="mb-12 text-center">
        <Badge variant="outline" className="mb-4 rounded-full">
          Our Work
        </Badge>
        <h2
          id="donated-photos-heading"
          className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
        >
          From your closet to their community
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          A glimpse of what we collect, sort and deliver to families in need — powered entirely by
          donors like you. Swipe or use the arrows to explore.
        </p>
      </div>

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Photos of donated items"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/60 shadow-2xl shadow-emerald-900/10 ring-1 ring-slate-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/5] w-full sm:aspect-[4/3] lg:aspect-[16/9]">
          {SLIDES.map((slide, i) => (
            <div
              key={slide.src}
              aria-hidden={i !== index}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-out",
                i === index ? "opacity-100" : "pointer-events-none opacity-0"
              )}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1152px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                <h3 className="text-lg font-semibold leading-snug text-white sm:text-2xl">
                  {slide.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-white/85 sm:text-base">
                  {slide.description}
                </p>
              </div>
            </div>
          ))}

          {/* Navigation arrows — kept at a ≥44×44px tap target for mobile. */}
          <button
            type="button"
            onClick={goPrev}
            aria-label="Show previous photo"
            className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-white/75 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:left-4 sm:h-12 sm:w-12"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Show next photo"
            className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-white/75 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:right-4 sm:h-12 sm:w-12"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Dots + counter */}
        <div className="flex items-center justify-between gap-4 border-t border-white/60 bg-white/70 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to photo ${i + 1} of ${count}`}
                aria-current={i === index}
                className={cn(
                  "h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
                  i === index ? "w-6 bg-emerald-500" : "w-2.5 bg-slate-300 hover:bg-slate-400"
                )}
              />
            ))}
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums text-slate-500">
            {index + 1} / {count}
          </span>
        </div>
      </div>
    </section>
  )
}
