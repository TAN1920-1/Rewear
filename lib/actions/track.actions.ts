"use server"

import { prisma } from "@/lib/db/prisma"
import type { Donation, DonationStatusHistory } from "@prisma/client"

type DonationWithDetails = Donation & {
  statusHistory: (DonationStatusHistory & { changedByUser: { name: string } })[]
}

export async function fetchDonationByTrackingId(
  donationId: string
): Promise<DonationWithDetails | null> {
  const donation = await prisma.donation.findUnique({
    where: { donationId: donationId.trim().toUpperCase() },
    include: {
      statusHistory: {
        include: {
          changedByUser: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  return donation as DonationWithDetails | null
}
