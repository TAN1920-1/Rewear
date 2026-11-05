import { 
  Shirt, 
  Gamepad2, 
  BookOpen, 
  Soup, 
  Footprints, 
  Bed, 
  Utensils, 
  HeartPulse,
  Backpack,
  ArrowRight
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const FACILITIES = [
  {
    icon: <Shirt className="h-6 w-6" />,
    title: "Clothing",
    desc: "Shirts, pants, jackets, and baby clothes for all ages.",
    color: "bg-blue-500",
  },
  {
    icon: <Gamepad2 className="h-6 w-6" />,
    title: "Toys",
    desc: "Soft toys, puzzles, and learning materials for children.",
    color: "bg-purple-500",
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Books & Stationery",
    desc: "School books, notebooks, and stationery for students.",
    color: "bg-amber-500",
  },
  {
    icon: <Soup className="h-6 w-6" />,
    title: "Grains & Pulses",
    desc: "Rice, wheat, and pulses for family ration kits.",
    color: "bg-emerald-500",
  },
  {
    icon: <Footprints className="h-6 w-6" />,
    title: "Footwear",
    desc: "Comfortable shoes and sandals for kids and adults.",
    color: "bg-rose-500",
  },
  {
    icon: <Bed className="h-6 w-6" />,
    title: "Blankets & Bedding",
    desc: "Warm blankets and bedsheets for families in need.",
    color: "bg-indigo-500",
  },
  {
    icon: <Utensils className="h-6 w-6" />,
    title: "Kitchen Utensils",
    desc: "Essential cooking and serving tools for households.",
    color: "bg-orange-500",
  },
  {
    icon: <HeartPulse className="h-6 w-6" />,
    title: "Hygiene Kits",
    desc: "Soaps, sanitary pads, and basic hygiene essentials.",
    color: "bg-teal-500",
  },
  {
    icon: <Backpack className="h-6 w-6" />,
    title: "School Bags",
    desc: "Sturdy backpacks to help children attend school.",
    color: "bg-cyan-500",
  },
]

export function DonationFacilities() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <Badge variant="outline" className="mb-4 rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">
          What You Can Donate
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          More than just clothes
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          We accept a wide range of essentials to support our community programs. 
          Every item you give helps a family build a better life.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FACILITIES.map((f) => (
          <Card key={f.title} className="glass group border-white/60 transition-all hover:-translate-y-1 hover:shadow-xl">
            <CardContent className="p-7">
              <div className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ${f.color} text-white shadow-lg shadow-slate-200`}>
                {f.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button asChild variant="outline" size="lg" className="rounded-full">
          <Link href="/requirements">
            View Urgent Requirements
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
