"use server"

import { headers } from "next/headers"
import { prisma } from "@/lib/db/prisma"
import { enforceRateLimit, getClientIp } from "@/lib/core/rate-limit"

/**
 * Public, unauthenticated donation tracking.
 *
 * Anyone who knows (or guesses) a tracking ID can call this, so the response is
 * deliberately minimal: only what is needed to show progress. It never exposes
 * the donor's email, phone, pickup address, notes, NGO internals, or the names
 * of the staff who handled the donation.
 */
export interface PublicDonationStatusEntry {
  status: string
  note: string | null
  createdAt: string
}

export interface PublicDonationTracking {
  donationId: string
  currentStatus: string
  totalItems: number
  createdAt: string
  /** Partially masked, e.g. "Rahul G." — enough for the donor to recognise it. */
  donorDisplayName: string
  statusHistory: PublicDonationStatusEntry[]
}

/** Reduce a full name to "First L." so a tracking ID never leaks a full identity. */
function maskDonorName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "Anonymous"
  const first = parts[0]
  const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : ""
  return `${first}${lastInitial}`
}

const TRACK_LIMIT = 30
const TRACK_WINDOW_MS = 60_000 // 30 lookups / minute / IP

export async function fetchDonationByTrackingId(
  rawId: string
): Promise<PublicDonationTracking | null> {
  const donationId = rawId?.trim().toUpperCase()
  if (!donationId) return null

  // Throttle to slow down tracking-ID enumeration. Exceeding the limit is
  // reported as "not found" so the endpoint reveals nothing about the limit.
  try {
    await enforceRateLimit(`track:${getClientIp(headers())}`, TRACK_LIMIT, TRACK_WINDOW_MS)
  } catch {
    return null
  }

  const donation = await prisma.donation.findUnique({
    where: { donationId },
    select: {
      donationId: true,
      currentStatus: true,
      totalItems: true,
      createdAt: true,
      donorName: true,
      statusHistory: {
        select: { status: true, note: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!donation) return null

  return {
    donationId: donation.donationId,
    currentStatus: donation.currentStatus,
    totalItems: donation.totalItems,
    createdAt: donation.createdAt.toISOString(),
    donorDisplayName: maskDonorName(donation.donorName),
    statusHistory: donation.statusHistory.map((h) => ({
      status: h.status,
      note: h.note,
      createdAt: h.createdAt.toISOString(),
    })),
  }
}
