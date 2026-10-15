import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { listCategories } from "@/lib/services/donation.service"
import { listActiveCampaigns } from "@/lib/services/campaign.service"
import { getCurrentUser } from "@/lib/auth/guards"
import { DonationFormClient } from "./donation-form-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserRole } from "@/lib/enums"

export default async function NewDonationPage() {
  await requireRole(UserRole.DONOR)

  const [categories, campaigns, user] = await Promise.all([
    listCategories(),
    listActiveCampaigns(),
    getCurrentUser(),
  ])

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    ngoId: (c as any).ngoId as number,
  }))

  const serializedCampaigns = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="w-fit mb-2 -ml-2">
            <Link href="/donor/donations">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create New Donation
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tell us about the items you&apos;d like to donate.
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <Card className="glass border-white/60">
          <CardContent className="py-16 text-center text-slate-500">
            Clothing categories are not yet configured by the NGO. Please check
            back later or contact support.
          </CardContent>
        </Card>
      ) : (
        <DonationFormClient
          categories={serializedCategories}
          campaigns={serializedCampaigns}
          initialUser={
            user
              ? {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone ?? null,
                }
              : null
          }
        />
      )}
    </div>
  )
}
