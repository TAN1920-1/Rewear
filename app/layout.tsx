import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"

export const metadata: Metadata = {
  title: {
    default: "REWEAR — Give clothes a second life.",
    template: "%s · REWEAR",
  },
  description:
    "REWEAR is a smart NGO clothing donation and resource management system — donate, track impact, and help communities with transparent clothing distribution.",
  keywords: ["clothing donation", "NGO", "charity", "second hand clothes", "donate clothes", "REWEAR"],
  openGraph: {
    title: "REWEAR — Give clothes a second life.",
    description: "Smart NGO clothing donation and resource management.",
    type: "website",
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
