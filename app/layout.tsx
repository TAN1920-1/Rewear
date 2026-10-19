import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NGO_CONTACT } from "@/lib/constants/ngo-contact"
import { SITE_NAME, SITE_URL } from "@/lib/constants/site"

const DESCRIPTION =
  "REWEAR is a smart NGO clothing donation and resource management system — donate, track impact, and help communities with transparent clothing distribution."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "REWEAR — Give clothes a second life.",
    template: "%s · REWEAR",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["clothing donation", "NGO", "charity", "second hand clothes", "donate clothes", "REWEAR"],
  authors: [{ name: NGO_CONTACT.name }],
  creator: NGO_CONTACT.name,
  publisher: NGO_CONTACT.name,
  category: "nonprofit",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    url: SITE_URL,
    title: "REWEAR — Give clothes a second life.",
    description: "Smart NGO clothing donation and resource management.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "REWEAR — give clothes a second life",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "REWEAR — Give clothes a second life.",
    description: "Smart NGO clothing donation and resource management.",
    images: ["/og-image.png"],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <TooltipProvider delayDuration={150}>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  )
}
