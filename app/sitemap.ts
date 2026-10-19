import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/constants/site"

/**
 * Publicly crawlable routes. Authenticated areas (`/donor`, `/admin`), API
 * routes and token-based approval pages are excluded — they are also listed
 * as `disallow` in `robots.ts`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/requirements", priority: 0.9, changeFrequency: "daily" },
    { path: "/campaigns", priority: 0.8, changeFrequency: "weekly" },
    { path: "/impact", priority: 0.7, changeFrequency: "weekly" },
    { path: "/track", priority: 0.6, changeFrequency: "monthly" },
  ]

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
