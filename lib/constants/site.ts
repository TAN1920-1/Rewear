/**
 * Public site identity — single source of truth for absolute URLs used in
 * metadata, `robots.txt`, `sitemap.xml` and email links.
 *
 * A localhost value (the usual leftover from copying `.env` to the host) is
 * ignored in production so canonical URLs and sitemaps never advertise
 * `localhost`.
 */
const FALLBACK_SITE_URL = "https://rewear-rust.vercel.app"

function isLocalhost(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0"
  } catch {
    return false
  }
}

function resolveSiteUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")
  if (configured && !(process.env.NODE_ENV === "production" && isLocalhost(configured))) {
    return configured
  }
  return FALLBACK_SITE_URL
}

export const SITE_URL = resolveSiteUrl()

export const SITE_NAME = "REWEAR"
export const SITE_TAGLINE = "Give clothes a second life"
