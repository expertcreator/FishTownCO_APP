import type { RiderShiftsSearchParams } from "./http"
import {
  bookRiderShiftBodySchema,
  cancelRiderShiftBodySchema,
  checkInRiderShiftBodySchema,
  type BookRiderShiftBody,
  type CancelRiderShiftBody,
  type CheckInRiderShiftBody
} from "./schemas"
import type {
  BookRiderShiftRequest,
  BookRiderShiftResponse,
  CancelRiderShiftRequest,
  CheckInRiderShiftRequest,
  RiderAvailableShiftFiltersParams,
  RiderAvailableShiftsParams,
  RiderMyShiftsParams,
  RiderShiftMutationResponse
} from "./types"

/**
 * Builds query-string fields for GET `rider/available-shifts`.
 * @param args - Date, GPS, radius, page, and optional zone
 * @returns String search params
 */
export function buildAvailableShiftsSearchParams(
  args: RiderAvailableShiftsParams
): RiderShiftsSearchParams {
  return {
    date: args.date,
    latitude: String(args.latitude),
    longitude: String(args.longitude),
    radiusKm: String(args.radiusKm),
    page: String(args.page ?? 0),
    limit: String(args.limit ?? 20),
    ...(args.lang ? { lang: args.lang } : {}),
    ...(args.zoneId ? { zoneId: args.zoneId } : {})
  }
}

/**
 * Builds query-string fields for GET `rider/next-shift`.
 * @param lang - Optional locale
 * @returns String search params
 */
export function buildNextShiftSearchParams(
  lang?: string
): RiderShiftsSearchParams {
  return lang ? { lang } : {}
}

/**
 * Builds query-string fields for GET `rider/my-shifts`.
 * @param args - Date range, page, and optional status/zone
 * @returns String search params
 */
export function buildMyShiftsSearchParams(
  args: RiderMyShiftsParams
): RiderShiftsSearchParams {
  return {
    startDate: args.startDate,
    endDate: args.endDate,
    page: String(args.page ?? 0),
    limit: String(args.limit ?? 20),
    ...(args.lang ? { lang: args.lang } : {}),
    ...(args.status ? { status: args.status } : {}),
    ...(args.zoneId ? { zoneId: args.zoneId } : {})
  }
}

/**
 * Builds query-string fields for GET `rider/available-shifts/filters`.
 * @param args - Optional locale and GPS
 * @returns String search params
 */
export function buildAvailableShiftFiltersSearchParams(
  args: RiderAvailableShiftFiltersParams = {}
): RiderShiftsSearchParams {
  return {
    ...(args.lang ? { lang: args.lang } : {}),
    ...(args.latitude !== undefined ? { latitude: String(args.latitude) } : {}),
    ...(args.longitude !== undefined
      ? { longitude: String(args.longitude) }
      : {})
  }
}

/**
 * Builds the POST `rider/book-shift` JSON body.
 * @param request - Slot id plus optional join GPS
 * @returns Validated body
 * @throws {ZodError} If `shiftSlotId` is empty
 * @example
 * buildBookRiderShiftBody({ shiftSlotId: "slot-1", latitude: 32.16, longitude: 74.18 })
 */
export function buildBookRiderShiftBody(
  request: BookRiderShiftRequest
): BookRiderShiftBody {
  return bookRiderShiftBodySchema.parse({
    shiftSlotId: request.shiftSlotId,
    ...(request.latitude !== undefined ? { latitude: request.latitude } : {}),
    ...(request.longitude !== undefined ? { longitude: request.longitude } : {})
  })
}

/**
 * Builds the POST `rider/checkin` JSON body.
 * @param request - Booking id plus GPS
 * @returns Validated body
 * @throws {ZodError} If booking id or coordinates are invalid
 */
export function buildCheckInRiderShiftBody(
  request: CheckInRiderShiftRequest
): CheckInRiderShiftBody {
  return checkInRiderShiftBodySchema.parse({
    bookingId: request.bookingId,
    latitude: request.latitude,
    longitude: request.longitude
  })
}

/**
 * Builds the DELETE `rider/book-shift/:id` JSON body.
 * @param request - Cancel request including booking id
 * @returns Validated `{ cancellationReason }`
 * @throws {ZodError} If the reason is empty
 */
export function buildCancelRiderShiftBody(
  request: CancelRiderShiftRequest
): CancelRiderShiftBody {
  return cancelRiderShiftBodySchema.parse({
    cancellationReason: request.cancellationReason
  })
}

/**
 * Merges a `{ data }` envelope onto the inner object without dropping `success`.
 * @param body - Raw JSON body from the gateway
 * @returns Inner fields plus envelope `success` / `message` / `code`
 */
export function unwrapRiderShiftMutationResponse(
  body: unknown
): RiderShiftMutationResponse {
  if (!body || typeof body !== "object") {
    return body as RiderShiftMutationResponse
  }

  const envelope = body as Record<string, unknown>
  if (
    "data" in envelope &&
    envelope.data &&
    typeof envelope.data === "object"
  ) {
    const inner = envelope.data as Record<string, unknown>
    return {
      ...inner,
      ...(typeof envelope.success === "boolean"
        ? { success: envelope.success }
        : {}),
      ...(typeof envelope.message === "string"
        ? { message: envelope.message }
        : {}),
      ...(typeof envelope.code === "string" ? { code: envelope.code } : {})
    }
  }

  return body as RiderShiftMutationResponse
}

/**
 * Normalizes wrapped `{ data }` book-shift responses, keeping envelope `success`.
 * @param body - Raw JSON body from the gateway
 * @returns Booking fields plus envelope flags
 */
export function unwrapBookRiderShiftResponse(
  body: unknown
): BookRiderShiftResponse {
  return unwrapRiderShiftMutationResponse(body)
}

/**
 * Reads the booked shift id from a book-shift response.
 * @param response - Unwrapped or wrapped book payload
 * @returns Booking id, or null when missing
 */
export function readBookedShiftId(
  response: BookRiderShiftResponse
): string | null {
  const id =
    response.bookingId ??
    response.id ??
    response.data?.bookingId ??
    response.data?.id
  return id != null && String(id).length > 0 ? String(id) : null
}
