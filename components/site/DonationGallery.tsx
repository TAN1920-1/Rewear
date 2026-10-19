import Image from "next/image"
import { Badge } from "@/components/ui/badge"

/**
 * Responsive donation gallery built from the optimised images shipped in
 * `public/images`. The asymmetric grid collapses gracefully from 4 columns →
 * 2 columns on mobile.
 *
 * Every image declares intrinsic `width`/`height` so the browser can reserve
 * the correct aspect ratio and avoid layout shift (CLS).
 */
const GALLERY = [
  {
    src: "/images/gallery-1.webp",
    alt: "Donated clothes collected for the NGO clothing drive",
    width: 1200,
    height: 1600,
    className: "col-span-2 row-span-2",
    sizes: "(max-width: 768px) 100vw, 50vw",
  },
  {
    src: "/images/gallery-2.webp",
    alt: "Community members with donated clothing items",
    width: 1200,
    height: 1600,
    className: "col-span-2 row-span-1",
    sizes: "(max-width: 768px) 100vw, 50vw",
  },
  {
    src: "/images/gallery-3.webp",
    alt: "Volunteers preparing donated clothes for distribution",
    width: 1600,
    height: 1200,
    className: "col-span-1 row-span-1",
    sizes: "(max-width: 768px) 50vw, 25vw",
  },
  {
    src: "/images/mangaldham.webp",
    alt: "Mangaldham Bahuuddeshiy Samajik Sanstha activity",
    width: 1600,
    height: 1163,
    className: "col-span-1 row-span-1",
    sizes: "(max-width: 768px) 50vw, 25vw",
  },
] as const

export function DonationGallery() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <Badge variant="outline" className="mb-4 rounded-full">
          Our Work
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          From your closet to their community
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          A glimpse of the clothes we collect, sort and deliver to families in need — powered
          entirely by donors like you.
        </p>
      </div>

      <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:gap-4 md:grid-cols-4">
        {GALLERY.map((img) => (
          <figure
            key={img.src}
            className={`group relative overflow-hidden rounded-2xl border border-white/60 shadow-sm ring-1 ring-slate-900/5 transition-shadow duration-300 hover:shadow-xl ${img.className}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              sizes={img.sizes}
              quality={85}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </figure>
        ))}
      </div>
    </section>
  )
}
