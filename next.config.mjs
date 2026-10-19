const isDev = process.env.NODE_ENV !== "production"

// A leftover localhost value must never leak into production headers, so it is
// ignored (falling back to the canonical domain) when not in development.
function resolveSiteUrl() {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(configured)
  if (configured && !(!isDev && isLocalhost)) return configured
  return "https://rewear-rust.vercel.app"
}

const SITE_URL = resolveSiteUrl()

/**
 * Content-Security-Policy.
 * Next.js injects inline bootstrap/hydration scripts and inline styles, so
 * 'unsafe-inline' is required unless a nonce-based policy is wired through
 * middleware. 'unsafe-eval' is only allowed during local development.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "media-src 'self' https:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src https://www.openstreetmap.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
  "report-uri /api/csp-report",
].join("; ")

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable the startup instrumentation hook (warms the Prisma pool).
    instrumentationHook: true,
    // Tree-shake barrel-file packages so dev compiles stay fast and the
    // client bundle only ships the icons/components actually used.
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "@react-pdf/renderer",
    ],
  },
  images: {
    // Prefer modern formats so the optimizer serves AVIF/WebP instead of JPEG.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "coresg-normal.trae.ai",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Reporting-Endpoints", value: `csp-endpoint="${SITE_URL}/api/csp-report"` },
        ],
      },
    ]
  },
}

export default nextConfig
