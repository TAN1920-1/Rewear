import { z } from "zod"
import { ClothingCondition } from "@/lib/enums"

export const DonationItemSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  size: z.string().optional(),
  condition: z.nativeEnum(ClothingCondition),
  quantity: z.coerce.number().int().min(1),
  description: z.string().optional(),
})

export type DonationItemSchemaType = z.infer<typeof DonationItemSchema>

export const CreateDonationSchema = z.object({
  donorName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  donorEmail: z.string().email({ message: "Invalid email address" }),
  donorPhone: z.string().optional(),
  pickupAddress: z.string().optional(),
  notes: z.string().optional(),
  campaignId: z.coerce.number().int().optional(),
  items: z.array(DonationItemSchema).min(1, { message: "At least one item is required" }),
})

export type CreateDonationSchemaType = z.infer<typeof CreateDonationSchema>
