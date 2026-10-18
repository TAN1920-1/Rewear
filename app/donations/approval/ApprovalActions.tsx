"use client"

import { useState } from "react"
import { toast } from "sonner"
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { respondToDonationApprovalAction } from "@/lib/actions/donation-approval.actions"

interface ApprovalActionsProps {
  token: string
  donationCode: string
  /** Action hinted by the email link, used to emphasise the primary button. */
  intendedAction: "approve" | "reject" | null
}

export function ApprovalActions({ token, donationCode, intendedAction }: ApprovalActionsProps) {
  const [pending, setPending] = useState<"approve" | "reject" | null>(null)
  const [done, setDone] = useState<{ status: string; donorNotified: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(action: "approve" | "reject") {
    setPending(action)
    setError(null)
    try {
      const res = await respondToDonationApprovalAction(token, action)
      if (!res.success) {
        setError(res.error ?? "Something went wrong. Please try again.")
        toast.error(res.error ?? "Something went wrong")
        return
      }
      setDone({ status: res.status ?? "", donorNotified: Boolean(res.donorNotified) })
      toast.success(
        action === "approve" ? "Donation approved successfully" : "Donation rejected"
      )
    } catch (e: any) {
      const msg = e?.message ?? "Unexpected error. Please try again."
      setError(msg)
      toast.error(msg)
    } finally {
      setPending(null)
    }
  }

  if (done) {
    const approved = done.status === "RECEIVED"
    return (
      <Card className="glass border-white/60">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div
            className={`grid h-16 w-16 place-items-center rounded-2xl text-white shadow-lg ${
              approved
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25"
                : "bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/25"
            }`}
          >
            {approved ? <CheckCircle2 className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {approved ? "Donation approved" : "Donation rejected"}
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              Donation <span className="font-semibold">{donationCode}</span> has been marked{" "}
              <span className="font-semibold">
                {approved ? "RECEIVED" : "REJECTED"}
              </span>
              .{" "}
              {done.donorNotified
                ? "The donor has been notified by email."
                : "The donor has been notified in their account."}
            </p>
          </div>
          <p className="text-xs text-slate-400">
            You can close this window — no further action is required.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="glass border-rose-200 bg-rose-50 text-rose-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not complete the action</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          size="lg"
          disabled={pending !== null}
          onClick={() => run("approve")}
          variant={intendedAction === "reject" ? "outline" : "default"}
          className={
            intendedAction === "reject"
              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
          }
        >
          {pending === "approve" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          Approve donation
        </Button>
        <Button
          size="lg"
          disabled={pending !== null}
          onClick={() => run("reject")}
          variant={intendedAction === "reject" ? "default" : "outline"}
          className={
            intendedAction === "reject"
              ? "bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/25"
              : "border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          }
        >
          {pending === "reject" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="mr-2 h-4 w-4" />
          )}
          Reject donation
        </Button>
      </div>

      <p className="text-center text-xs text-slate-500">
        This action is final and the link can only be used once.
      </p>
    </div>
  )
}
