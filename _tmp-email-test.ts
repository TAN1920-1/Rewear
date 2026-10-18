/**
 * TEMP end-to-end email test. Deleted after use.
 * Replicates the exact data the donation form's server action writes
 * (see lib/actions/donation.actions.ts -> submitDonationAction) and then
 * calls the very same notification function it calls.
 */
import * as bcrypt from "bcryptjs"
import { prisma } from "@/lib/db/prisma"
import { UserRole, DonationStatus, ClothingCondition } from "@/lib/enums"
import { sendDonationSubmittedNotifications } from "@/lib/services/donation-approval.service"
import { getEmailProviderKind, isEmailConfigured } from "@/lib/core/email"

const MANAGER_INBOX = "tanishqgames203@gmail.com"

async function main() {
  console.log("=== EMAIL CONFIG ===")
  console.log("isEmailConfigured:", isEmailConfigured())
  console.log("provider kind     :", getEmailProviderKind())
  console.log("SMTP_HOST         :", process.env.SMTP_HOST)
  console.log("SMTP_PORT         :", process.env.SMTP_PORT)
  console.log("SMTP_USER         :", process.env.SMTP_USER)
  console.log("EMAIL_FROM        :", process.env.EMAIL_FROM)
  console.log("MANAGER_EMAIL     :", process.env.MANAGER_EMAIL)
  console.log("")

  const ngo = await prisma.nGO.findFirst()
  if (!ngo) throw new Error("No NGO found. Run `npm run seed` first.")

  let category = await prisma.clothingCategory.findFirst({ where: { ngoId: ngo.id } })
  if (!category) {
    category = await prisma.clothingCategory.create({
      data: { name: "Test Category", slug: `test-cat-${Date.now()}`, ngoId: ngo.id },
    })
  }

  const stamp = Date.now()
  const donor = await prisma.user.create({
    data: {
      email: `emailtest.donor.${stamp}@example.com`,
      passwordHash: await bcrypt.hash("Password123!", 10),
      name: "Email Test Donor",
      phone: "+91 90000 12345",
      role: UserRole.DONOR,
    },
  })

  const donationCount = await prisma.donation.count()
  const year = new Date().getFullYear()
  const donationId = `DON-${year}-${String(donationCount + 1).padStart(6, "0")}`

  const donation = await prisma.donation.create({
    data: {
      donationId,
      donorId: donor.id,
      ngoId: ngo.id,
      donorName: "Email Test Donor",
      donorEmail: MANAGER_INBOX,
      donorPhone: "+91 90000 12345",
      pickupAddress: "Sukhsagar Nagar, Katraj, Pune, Maharashtra",
      notes: "Email feature test — approve this from the email link.",
      totalItems: 5,
      currentStatus: DonationStatus.SUBMITTED,
      items: {
        create: [
          {
            categoryId: category.id,
            size: "M",
            condition: ClothingCondition.GOOD,
            quantity: 3,
            description: "Winter jackets",
          },
          {
            categoryId: category.id,
            size: "L",
            condition: ClothingCondition.NEW,
            quantity: 2,
            description: "Cotton shirts",
          },
        ],
      },
      statusHistory: {
        create: {
          status: DonationStatus.SUBMITTED,
          changedBy: donor.id,
          note: "Donation submitted by donor",
        },
      },
    },
    select: { id: true, donationId: true, currentStatus: true },
  })

  console.log("=== DONATION CREATED ===")
  console.log("donor user        :", donor.email, "(password: Password123!)")
  console.log("donation code     :", donation.donationId)
  console.log("donation db id    :", donation.id)
  console.log("status            :", donation.currentStatus)
  console.log("")

  console.log("=== SENDING MANAGER EMAIL ===")
  const result = await sendDonationSubmittedNotifications(donation.id)
  console.log("email result      :", JSON.stringify(result))

  const tokens = await prisma.donationApprovalToken.findMany({
    where: { donationId: donation.id },
    select: { id: true, usedAt: true, expiresAt: true, action: true },
  })
  console.log("tokens issued     :", tokens.length)
  console.log("token state       :", JSON.stringify(tokens))
  console.log("")
  console.log("DONATION_DB_ID=" + donation.id)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
