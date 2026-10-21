import Link from "next/link"
import { useState } from "react"
import {
  Settings as SettingsIcon,
  Building2,
  Palette,
  Tag,
  ArrowRight,
  Save,
  Plus,
} from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { prisma } from "@/lib/db/prisma"
import { UserRole } from "@/lib/enums"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default async function AdminSettingsPage() {
  const user = await requireRole(UserRole.NGO_ADMIN, UserRole.NGO_STAFF)
  const ngoId = user.ngoId!

  const [ngo, categories, staffCount] = await Promise.all([
    prisma.nGO.findUnique({
      where: { id: ngoId },
      select: {
        name: true,
        tagline: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        logoUrl: true,
        receiptColor: true,
      },
    }),
    prisma.clothingCategory.findMany({
      where: { ngoId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { inventoryItems: true, donationItems: true },
        },
      },
    }),
    prisma.staffAssignment.count({
      where: { ngoId },
    }),
  ])
  const [newPassword, setNewPassword] = useState("")
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  const handleReset = async () => {
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: "tanishqgames203@gmail.com", newPassword })
    })
    const data = await res.json()
    if (data.error) setResetMessage(data.error)
    else setResetMessage('Password reset successful')
    setNewPassword("")
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Organization Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage NGO profile, receipt branding, and clothing categories.
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
        >
          <Link href="/admin/dashboard">
            Back to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass border-white/50 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Building2 className="h-5 w-5 text-emerald-600" />
              NGO Profile
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Public-facing information that appears on receipts, impact pages,
              and donation confirmations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ngo-name">Organization Name</Label>
                <Input
                  id="ngo-name"
                  defaultValue={ngo?.name ?? ""}
                  className="bg-white/80"
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ngo-tagline">Tagline</Label>
                <Input
                  id="ngo-tagline"
                  defaultValue={ngo?.tagline ?? ""}
                  className="bg-white/80"
                  disabled
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ngo-address">Address</Label>
              <Input
                id="ngo-address"
                defaultValue={ngo?.address ?? ""}
                className="bg-white/80"
                disabled
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="ngo-phone">Phone</Label>
                <Input
                  id="ngo-phone"
                  defaultValue={ngo?.phone ?? ""}
                  className="bg-white/80"
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ngo-email">Email</Label>
                <Input
                  id="ngo-email"
                  type="email"
                  defaultValue={ngo?.email ?? ""}
                  className="bg-white/80"
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ngo-website">Website</Label>
                <Input
                  id="ngo-website"
                  defaultValue={ngo?.website ?? ""}
                  className="bg-white/80"
                  disabled
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-500">
                Fields are disabled for safety. Enable edit mode to make
                changes.
              </p>
              <Button className="gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/50 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Palette className="h-5 w-5 text-teal-600" />
              Receipt Branding
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Colors and logo applied to automated donation receipts and
              thank-you letters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-white/50 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 shadow-inner">
                {ngo?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ngo.logoUrl}
                    alt="logo"
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-emerald-600" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>Logo URL</Label>
                <Input
                  defaultValue={ngo?.logoUrl ?? ""}
                  className="bg-white/80"
                  disabled
                />
                <p className="text-[11px] text-slate-500">
                  Square PNG, at least 200×200px, transparent background
                  recommended.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="receipt-color">Receipt Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="receipt-color"
                    defaultValue={ngo?.receiptColor ?? "#10b981"}
                    className="bg-white/80 font-mono"
                    disabled
                  />
                  <div
                    className="h-10 w-10 shrink-0 rounded-xl border border-white/60 shadow-inner"
                    style={{ backgroundColor: ngo?.receiptColor ?? "#10b981" }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Preview</Label>
                <div className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2">
                  <div
                    className="h-2 w-10 rounded-full"
                    style={{ backgroundColor: ngo?.receiptColor ?? "#10b981" }}
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    ReWear Receipt
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full gap-2 bg-white/80">
              <Save className="h-4 w-4" />
              Save Branding
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-white/50 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Tag className="h-5 w-5 text-cyan-600" />
                Clothing Categories
              </CardTitle>
              <CardDescription className="mt-1 text-xs text-slate-500">
                {categories.length} categories configured. Donors and staff see
                these when adding items.
              </CardDescription>
            </div>
            <Button variant="outline" className="gap-2 bg-white/80">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/40 bg-emerald-50/50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Slug</th>
                  <th className="px-6 py-3 font-medium text-center">
                    In Inventory
                  </th>
                  <th className="px-6 py-3 font-medium text-center">
                    Donations
                  </th>
                  <th className="px-6 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No clothing categories configured for this NGO yet.
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-white/40 last:border-0 hover:bg-white/40"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {c.name}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {c.slug}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-700">
                        {c._count.inventoryItems.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-700">
                        {c._count.donationItems.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700"
                        >
                          Active
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
