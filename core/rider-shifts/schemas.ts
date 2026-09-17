import { z } from "zod"

/**
 * Discriminator for book vs join-now vs not bookable.
 */
export const availableShiftBookingKindSchema = z.enum([
  "future",
  "running",
  "too_late"
])

export type AvailableShiftBookingKind = z.infer<
  typeof availableShiftBookingKindSchema
>

/**
 * Body for POST `rider/book-shift`.
 * GPS is required when joining a running slot.
 */
export const bookRiderShiftBodySchema = z
  .object({
    shiftSlotId: z.string().min(1),
    latitude: z.number().optional(),
    longitude: z.number().optional()
  })
  .strict()

export type BookRiderShiftBody = z.infer<typeof bookRiderShiftBodySchema>

/**
 * Body for POST `rider/checkin`.
 */
export const checkInRiderShiftBodySchema = z
  .object({
    bookingId: z.string().min(1),
    latitude: z.number(),
    longitude: z.number()
  })
  .strict()

export type CheckInRiderShiftBody = z.infer<typeof checkInRiderShiftBodySchema>

/**
 * Body for DELETE `rider/book-shift/:bookingId`.
 */
export const cancelRiderShiftBodySchema = z
  .object({
    cancellationReason: z.string().min(1)
  })
  .strict()

export type CancelRiderShiftBody = z.infer<typeof cancelRiderShiftBodySchema>

const riderShiftZoneSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    boundaries: z
      .union([z.string(), z.record(z.string(), z.unknown())])
      .optional(),
    centerLatitude: z.number().optional(),
    centerLongitude: z.number().optional()
  })
  .passthrough()

/**
 * One booked row from GET `rider/next-shift`. Unknown keys (zone extras) are kept.
 */
export const riderNextShiftSchema = z
  .object({
    bookingId: z.string().optional(),
    id: z.string().optional(),
    shiftSlotId: z.string().optional(),
    zoneId: z.string().optional(),
    zoneName: z.string().optional(),
    shiftDate: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    status: z.string().optional(),
    bookedAt: z.string().optional(),
    canCheckIn: z.boolean().optional(),
    zone: riderShiftZoneSchema.optional(),
    boundaries: z.string().optional()
  })
  .passthrough()

export type RiderNextShiftParsed = z.infer<typeof riderNextShiftSchema>
