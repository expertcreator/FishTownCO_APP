import { z } from "zod"

/** Parties a reporter may target when flagging an order. */
export const orderFlagReportablePartySchema = z.enum([
  "customer",
  "tenant",
  "rider"
])
export type OrderFlagReportableParty = z.infer<
  typeof orderFlagReportablePartySchema
>

/** Compact flag reference returned on order detail / eligibility. */
export const orderFlagRefSchema = z.object({
  flagId: z.string().min(1),
  status: z.string().min(1)
})
export type OrderFlagRef = z.infer<typeof orderFlagRefSchema>

/** Eligibility payload inside `{ success, data }`. */
export const orderFlagEligibilityDataSchema = z.object({
  eligible: z.boolean(),
  reasons: z.array(z.string()),
  reportableParties: z.array(orderFlagReportablePartySchema),
  existingFlag: orderFlagRefSchema.nullable(),
  reasonCode: z.string().optional()
})
export type OrderFlagEligibilityData = z.infer<
  typeof orderFlagEligibilityDataSchema
>

export const orderFlagEligibilityResponseSchema = z.object({
  success: z.boolean().optional(),
  data: orderFlagEligibilityDataSchema
})

/** Full track record for the current reporter on an order. */
export const orderFlagTrackSchema = z.object({
  flagId: z.string().min(1),
  orderId: z.string().min(1),
  orderNumber: z.string().nullable(),
  status: z.string().min(1),
  reporterType: z.string().min(1),
  reportedPartyType: z.string().min(1),
  reason: z.string().min(1),
  details: z.string().nullable(),
  evidence: z.array(z.string()),
  resolution: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
})
export type OrderFlagTrack = z.infer<typeof orderFlagTrackSchema>

export const orderFlagTrackResponseSchema = z.object({
  success: z.boolean().optional(),
  data: orderFlagTrackSchema.nullable()
})

/** POST `/orders/:id/flags` body. */
export const createOrderFlagBodySchema = z.object({
  reason: z.string().min(1),
  details: z.string().min(1),
  evidence: z.array(z.string()).default([]),
  reportedPartyType: orderFlagReportablePartySchema
})
export type CreateOrderFlagBody = z.infer<typeof createOrderFlagBodySchema>
