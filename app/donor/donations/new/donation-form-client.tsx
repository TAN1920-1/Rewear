"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  Package,
  User,
  FileText,
  Megaphone,
  Sparkles,
  Loader2,
  AlertCircle,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  CreateDonationSchema,
  CreateDonationSchemaType,
} from "@/lib/validations/donation.schema"
import { ClothingCondition } from "@/lib/enums"
import { submitDonationAction } from "@/lib/actions/donation.actions"

type Category = { id: number; name: string; slug: string; ngoId: number }
type CampaignOption = { id: number; name: string }
type InitialUser = { id: number; name: string; email: string; phone: string | null } | null

const STEPS = [
  { id: 1, title: "Campaign", icon: Megaphone, desc: "Support a specific drive" },
  { id: 2, title: "Items", icon: Package, desc: "What you're donating" },
  { id: 3, title: "Details", icon: User, desc: "Your information" },
  { id: 4, title: "Review", icon: FileText, desc: "Confirm & submit" },
]

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Kids 2-4", "Kids 5-8", "Kids 9-12", "Infant"]

export function DonationFormClient({
  categories,
  campaigns,
  initialUser,
}: {
  categories: Category[]
  campaigns: CampaignOption[]
  initialUser: InitialUser
}) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<{
    id: number
    donationId: string
    emailSent?: boolean
  } | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<CreateDonationSchemaType>({
    resolver: zodResolver(CreateDonationSchema),
    defaultValues: {
      donorName: initialUser?.name ?? "",
      donorEmail: initialUser?.email ?? "",
      donorPhone: initialUser?.phone ?? "",
      pickupAddress: "",
      notes: "",
      campaignId: undefined,
      items: [
        {
          categoryId: 0,
          size: undefined,
          condition: ClothingCondition.GOOD,
          quantity: 1,
          description: "",
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  function nextStep() {
    setFormError(null)
    if (step === 2) {
      const items = form.getValues("items")
      const validItems = items?.filter((i) => i.categoryId > 0 && i.quantity >= 1) ?? []
      if (validItems.length === 0) {
        setFormError("Please add at least one item with a valid category and quantity.")
        return
      }
    }
    setStep((s) => Math.min(4, s + 1))
  }

  function prevStep() {
    setFormError(null)
    setStep((s) => Math.max(1, s - 1))
  }

  async function onSubmit(values: CreateDonationSchemaType) {
    setIsSubmitting(true)
    setFormError(null)
    try {
      const validItems = values.items.filter((i) => i.categoryId > 0)
      const payload = { ...values, items: validItems }

      const result = await submitDonationAction(payload)

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [k, v] of Object.entries(result.fieldErrors)) {
            form.setError(k as any, { type: "server", message: v?.[0] ?? "Invalid value" })
          }
        }
        setFormError(result.error ?? "Something went wrong.")
        return
      }

      setSuccessData({
        id: result.data!.id,
        donationId: result.data!.donationId,
        emailSent: result.data!.emailSent,
      })
      setStep(5)
    } catch (e: any) {
      setFormError(e?.message ?? "Unexpected error submitting donation.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function addItem() {
    append({
      categoryId: 0,
      size: undefined,
      condition: ClothingCondition.GOOD,
      quantity: 1,
      description: "",
    })
  }

  function getRecommendationBadge(_categoryId: number) {
    const matchesHighPriority = _categoryId % 3 === 0
    if (matchesHighPriority && categories.length) {
      return {
        level: "HIGH" as const,
        message: "This item matches an URGENT requirement!",
      }
    }
    return { level: "MEDIUM" as const, message: "Thank you — this item is always welcome." }
  }

  if (step === 5 && successData) {
    return (
      <Card className="glass border-white/60 overflow-hidden">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Donation Submitted!</CardTitle>
          <CardDescription>
            Thank you for your generosity. Your donation has been registered.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="glass inline-flex flex-col items-center gap-2 rounded-2xl border-white/50 px-8 py-6">
            <p className="text-xs uppercase tracking-widest text-slate-500">Donation ID</p>
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              {successData.donationId}
            </p>
            <Badge variant="outline" className="mt-2 border-emerald-200 bg-emerald-50 text-emerald-700">
              <Sparkles className="mr-1 h-3 w-3" />
              Status: SUBMITTED
            </Badge>
          </div>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            You can track your donation anytime using the ID above. NGO staff will review and
            update its status as it moves through processing.
          </p>
          {successData.emailSent === false && (
            <p className="text-xs text-amber-700 max-w-md mx-auto">
              Your donation was saved, but the notification email could not be sent right now.
              The NGO team can still review it from their dashboard.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
          >
            <a href={`/donor/donations/${successData.id}`}>
              View Donation Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/donor/donations">Go to My Donations</a>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Steps Indicator */}
      <Card className="glass border-white/60">
        <CardContent className="p-4 sm:p-6">
          <ol className="flex items-center justify-between gap-2">
            {STEPS.map((s, idx) => {
              const Icon = s.icon
              const isActive = step === s.id
              const isDone = step > s.id
              return (
                <li key={s.id} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                  <div className="flex shrink-0 flex-col items-center gap-1 sm:flex-row sm:gap-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-sm font-semibold transition-all ${
                        isDone
                          ? "border-emerald-500 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md"
                          : isActive
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <div className="hidden sm:block min-w-0">
                      <p
                        className={`truncate text-xs font-semibold ${
                          isActive || isDone ? "text-slate-900" : "text-slate-400"
                        }`}
                      >
                        {s.title}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`hidden h-0.5 flex-1 rounded-full md:block ${
                        isDone ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {formError && (
            <Alert variant="destructive" className="glass border-rose-200 bg-rose-50 text-rose-800">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Please fix the following</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* STEP 1: Campaign */}
          {step === 1 && (
            <Card className="glass border-white/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-emerald-600" />
                  Support a Campaign (Optional)
                </CardTitle>
                <CardDescription>
                  Associate your donation with an active drive to maximize its impact.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="campaignId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Choose a campaign</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === "none" ? undefined : Number(v))}
                        defaultValue={field.value ? String(field.value) : "none"}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/70">
                            <SelectValue placeholder="Select a campaign (or skip)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No specific campaign — general donation</SelectItem>
                          {campaigns.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              <span className="flex items-center gap-2">
                                <Heart className="h-3.5 w-3.5 text-emerald-600" />
                                {c.name}
                              </span>
                            </SelectItem>
                          ))}
                          {campaigns.length === 0 && (
                            <SelectItem value="none" disabled>
                              No active campaigns at the moment
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Campaigns help us direct donations where they&apos;re most urgently needed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Items */}
          {step === 2 && (
            <div className="space-y-4">
              <Card className="glass border-white/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-emerald-600" />
                      Items to Donate
                    </CardTitle>
                    <CardDescription>
                      Add each type of clothing item you&apos;re donating.
                    </CardDescription>
                  </div>
                  <Button type="button" onClick={addItem} variant="outline" size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Add Item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => {
                    const catId = form.watch(`items.${index}.categoryId`) as number
                    const rec = catId > 0 ? getRecommendationBadge(catId) : null
                    return (
                      <div
                        key={field.id}
                        className="rounded-2xl border border-white/50 bg-white/60 p-4 shadow-sm"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <Badge variant="outline" className="bg-slate-50">
                            Item {index + 1}
                          </Badge>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.categoryId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category *</FormLabel>
                                <Select
                                  onValueChange={(v) => field.onChange(Number(v))}
                                  defaultValue={field.value ? String(field.value) : undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-white/70">
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories.map((c) => (
                                      <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.condition`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Condition *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white/70">
                                      <SelectValue placeholder="Condition" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.values(ClothingCondition).map((cond) => (
                                      <SelectItem key={cond} value={cond}>
                                        {cond.replace("_", " ")}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.size`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Size</FormLabel>
                                <Select
                                  onValueChange={(v) => field.onChange(v === "none" ? undefined : v)}
                                  defaultValue={field.value ?? "none"}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-white/70">
                                      <SelectValue placeholder="Select size (optional)" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">Not specified</SelectItem>
                                    {SIZE_OPTIONS.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {s}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantity *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    className="bg-white/70"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="mt-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes (optional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    className="bg-white/70 resize-none"
                                    rows={2}
                                    placeholder="Any extra details about this item..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {rec && (
                          <div className="mt-4">
                            <Badge
                              variant="outline"
                              className={
                                rec.level === "HIGH"
                                  ? "border-amber-200 bg-amber-50 text-amber-800"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
                              }
                            >
                              <Sparkles className="mr-1 h-3 w-3" />
                              {rec.level} MATCH · {rec.message}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 3: Details */}
          {step === 3 && (
            <Card className="glass border-white/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  Your Contact Details
                </CardTitle>
                <CardDescription>
                  So we can reach you about pickup and send your receipt.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="donorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input className="bg-white/70" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="donorEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" className="bg-white/70" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="donorPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input className="bg-white/70" placeholder="+91 ..." {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormDescription>Optional — for pickup coordination.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="sm:col-span-2">
                  <FormField
                    control={form.control}
                    name="pickupAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup / Drop-off Address</FormLabel>
                        <FormControl>
                          <Textarea
                            className="bg-white/70 resize-none"
                            rows={3}
                            placeholder="Full address where items can be picked up or dropped off..."
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="sm:col-span-2">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            className="bg-white/70 resize-none"
                            rows={2}
                            placeholder="Anything else we should know about this donation?"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <Card className="glass border-white/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    Review Your Donation
                  </CardTitle>
                  <CardDescription>
                    Please review everything before submitting.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Campaign */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Campaign
                    </p>
                    <div className="glass rounded-xl border-white/50 px-4 py-3">
                      {form.watch("campaignId") ? (
                        <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700">
                          <Megaphone className="mr-1 h-3 w-3" />
                          {campaigns.find((c) => c.id === form.watch("campaignId"))?.name ??
                            "Selected Campaign"}
                        </Badge>
                      ) : (
                        <p className="text-sm text-slate-600">General donation (no campaign)</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Items Summary */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Items ({(form.watch("items") ?? []).filter((i) => i.categoryId > 0).length} types ·{" "}
                      {(form.watch("items") ?? [])
                        .filter((i) => i.categoryId > 0)
                        .reduce((s, i) => s + (i.quantity || 0), 0)}{" "}
                      total pieces)
                    </p>
                    <div className="space-y-2">
                      {(form.watch("items") ?? [])
                        .filter((i) => i.categoryId > 0)
                        .map((item, idx) => {
                          const cat = categories.find((c) => c.id === item.categoryId)
                          return (
                            <div
                              key={idx}
                              className="glass flex items-center justify-between rounded-xl border-white/50 px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {cat?.name ?? "Unknown category"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {item.size ?? "Any size"} · {item.condition?.replace("_", " ")}{" "}
                                  {item.description ? `· ${item.description}` : ""}
                                </p>
                              </div>
                              <Badge variant="outline">Qty {item.quantity}</Badge>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  <Separator />

                  {/* Contact */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Name
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {form.watch("donorName")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Email
                      </p>
                      <p className="text-sm text-slate-700">{form.watch("donorEmail")}</p>
                    </div>
                    {form.watch("donorPhone") && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Phone
                        </p>
                        <p className="text-sm text-slate-700">{form.watch("donorPhone")}</p>
                      </div>
                    )}
                    {form.watch("pickupAddress") && (
                      <div className="sm:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Address
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-line">
                          {form.watch("pickupAddress")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
              className={step === 1 ? "invisible" : ""}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
                    Submit Donation
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
