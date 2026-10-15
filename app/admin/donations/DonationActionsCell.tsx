"use client"

import { useState } from "react"
import { ChevronRight, Ban, Link as LinkIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { advanceDonationStatusAction } from "@/lib/actions/donation.actions"

interface DonationActionsCellProps {
  donationId: number
  trackingId: string
  currentStatus: string
  nextStatus: string | null
}

export function DonationActionsCell({
  donationId,
  trackingId,
  currentStatus,
  nextStatus,
}: DonationActionsCellProps) {
  const [isPending, setIsPending] = useState(false)

  const handleAdvance = async () => {
    if (!nextStatus) return
    setIsPending(true)
    try {
      const res = await advanceDonationStatusAction(donationId, nextStatus)
      if (res.success) {
        toast.success(`Donation advanced to ${nextStatus.replace(/_/g, " ")}`)
      } else {
        toast.error(res.error || "Failed to advance donation status")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsPending(false)
    }
  }

  const handleReject = async () => {
    const reason = window.prompt("Enter rejection reason (optional):")
    if (reason === null) return // Cancelled

    setIsPending(true)
    try {
      const res = await advanceDonationStatusAction(donationId, "REJECTED", reason || undefined)
      if (res.success) {
        toast.success("Donation rejected")
      } else {
        toast.error(res.error || "Failed to reject donation")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsPending(false)
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/track?id=${trackingId}`
    navigator.clipboard.writeText(url)
    toast.success("Tracking link copied to clipboard")
  }

  return (
    <div className="flex justify-end gap-1.5">
      {nextStatus && (
        <Button
          size="sm"
          onClick={handleAdvance}
          disabled={isPending}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-sm min-w-[90px]"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              Advance
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </>
          )}
        </Button>
      )}
      {currentStatus !== "REJECTED" && currentStatus !== "COMPLETED" && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleReject}
          disabled={isPending}
          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        >
          <Ban className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={handleCopyLink}
        className="border-slate-200"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
