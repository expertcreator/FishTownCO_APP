import { z } from "zod"
import { riderDeliveryFailureReasonEnum } from "@/constants"
import { RIDER_ORDER_ACTIONS } from "./constants"

export const riderOrderActionSchema = z.enum(RIDER_ORDER_ACTIONS)
export type RiderOrderAction = z.infer<typeof riderOrderActionSchema>

/**
 * Body for POST `/riders/orders/:id/action`.
 * Proof images are dropoff-only; fail fields are failed-only.
 */
export const riderOrderActionBodySchema = z
  .object({
    action: riderOrderActionSchema,
    deliveryProofImage: z.string().min(1).optional(),
    paymentProofImage: z.string().min(1).optional(),
    contactAttempted: z.boolean().optional(),
    failureReason: z.string().min(1).optional()
  })
  .strict()

export type RiderOrderActionBody = z.infer<typeof riderOrderActionBodySchema>

/** Body for POST `/riders/orders/:id/fail`. */
export const failRiderOrderDeliveryBodySchema = z
  .object({
    failureReason: riderDeliveryFailureReasonEnum,
    contactAttempted: z.boolean()
  })
  .strict()

export type FailRiderOrderDeliveryBody = z.infer<
  typeof failRiderOrderDeliveryBodySchema
>

/** Body for PATCH `/orders/:id/estimated-delivery-time`. */
export const updateEstimatedDeliveryTimeBodySchema = z
  .object({
    minutes: z.number().int().positive()
  })
  .strict()

export type UpdateEstimatedDeliveryTimeBody = z.infer<
  typeof updateEstimatedDeliveryTimeBodySchema
>
