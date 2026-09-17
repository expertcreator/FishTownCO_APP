import { RIDER_SHIFTS_API } from "./constants"
import type { RiderShiftsHttp } from "./http"
import {
  buildAvailableShiftFiltersSearchParams,
  buildAvailableShiftsSearchParams,
  buildBookRiderShiftBody,
  buildCancelRiderShiftBody,
  buildCheckInRiderShiftBody,
  buildMyShiftsSearchParams,
  buildNextShiftSearchParams,
  unwrapBookRiderShiftResponse,
  unwrapRiderShiftMutationResponse
} from "./payloads"
import type {
  BookRiderShiftRequest,
  BookRiderShiftResponse,
  CancelRiderShiftRequest,
  CheckInRiderShiftRequest,
  RiderAvailableShiftDates,
  RiderAvailableShiftFilterLocation,
  RiderAvailableShiftFiltersParams,
  RiderAvailableShiftsPage,
  RiderAvailableShiftsParams,
  RiderMyShiftsPage,
  RiderMyShiftsParams,
  RiderNextShiftParams,
  RiderNextShiftPayload,
  RiderShiftEnvelope,
  RiderShiftMutationResponse,
  SwapRiderShiftRequest
} from "./types"

/**
 * Loads the rider's next booked shift.
 * @param http - Injected HTTP client
 * @param args - Optional locale
 * @returns GET `rider/next-shift` JSON body
 */
export function getRiderNextShift(
  http: RiderShiftsHttp,
  args: RiderNextShiftParams = {}
): Promise<RiderNextShiftPayload> {
  return http.get<RiderNextShiftPayload>(
    RIDER_SHIFTS_API.nextShift,
    buildNextShiftSearchParams(args.lang)
  )
}

/**
 * Lists nearby available shift slots.
 * @param http - Injected HTTP client
 * @param args - Date, GPS, radius, page
 * @returns GET `rider/available-shifts` envelope
 */
export function listAvailableRiderShifts(
  http: RiderShiftsHttp,
  args: RiderAvailableShiftsParams
): Promise<RiderShiftEnvelope<RiderAvailableShiftsPage>> {
  return http.get<RiderShiftEnvelope<RiderAvailableShiftsPage>>(
    RIDER_SHIFTS_API.availableShifts,
    buildAvailableShiftsSearchParams(args)
  )
}

/**
 * Lists the rider's booked shifts.
 * @param http - Injected HTTP client
 * @param args - Date range and page
 * @returns GET `rider/my-shifts` envelope
 */
export function listRiderMyShifts(
  http: RiderShiftsHttp,
  args: RiderMyShiftsParams
): Promise<RiderShiftEnvelope<RiderMyShiftsPage>> {
  return http.get<RiderShiftEnvelope<RiderMyShiftsPage>>(
    RIDER_SHIFTS_API.myShifts,
    buildMyShiftsSearchParams(args)
  )
}

/**
 * Loads zone filter options for available shifts.
 * @param http - Injected HTTP client
 * @param args - Optional locale and GPS
 * @returns GET `rider/available-shifts/filters` JSON body
 */
export function getAvailableShiftFilters(
  http: RiderShiftsHttp,
  args: RiderAvailableShiftFiltersParams = {}
): Promise<RiderAvailableShiftFilterLocation[]> {
  return http.get<RiderAvailableShiftFilterLocation[]>(
    RIDER_SHIFTS_API.availableShiftFilters,
    buildAvailableShiftFiltersSearchParams(args)
  )
}

/**
 * Loads the calendar window of available shift dates.
 * @param http - Injected HTTP client
 * @param lang - Optional locale
 * @returns GET `rider/available-shifts/dates` JSON body
 */
export function getAvailableShiftDates(
  http: RiderShiftsHttp,
  lang?: string
): Promise<
  RiderAvailableShiftDates | RiderShiftEnvelope<RiderAvailableShiftDates>
> {
  return http.get<
    RiderAvailableShiftDates | RiderShiftEnvelope<RiderAvailableShiftDates>
  >(RIDER_SHIFTS_API.availableShiftDates, buildNextShiftSearchParams(lang))
}

/**
 * Books a shift slot, attaching GPS when joining a running slot.
 * @param http - Injected HTTP client
 * @param request - Slot id plus optional coordinates
 * @returns Unwrapped book response (envelope `success` is kept)
 * @throws {ZodError} If `shiftSlotId` is empty
 */
export async function bookRiderShift(
  http: RiderShiftsHttp,
  request: BookRiderShiftRequest
): Promise<BookRiderShiftResponse> {
  const body = buildBookRiderShiftBody(request)
  const raw = await http.post<unknown, typeof body>(
    RIDER_SHIFTS_API.bookShift,
    body
  )
  return unwrapBookRiderShiftResponse(raw)
}

/**
 * Requests a swap for a booked shift.
 * @param http - Injected HTTP client
 * @param request - Booking to swap
 * @returns Unwrapped mutation response
 */
export async function swapRiderShift(
  http: RiderShiftsHttp,
  request: SwapRiderShiftRequest
): Promise<RiderShiftMutationResponse> {
  const raw = await http.post<unknown, Record<string, never>>(
    RIDER_SHIFTS_API.swap(request.bookingId),
    {}
  )
  return unwrapRiderShiftMutationResponse(raw)
}

/**
 * Cancels a pending swap request.
 * @param http - Injected HTTP client
 * @param request - Booking whose swap should be cancelled
 * @returns Unwrapped mutation response
 */
export async function cancelRiderShiftSwap(
  http: RiderShiftsHttp,
  request: SwapRiderShiftRequest
): Promise<RiderShiftMutationResponse> {
  const raw = await http.delete(RIDER_SHIFTS_API.swap(request.bookingId))
  return unwrapRiderShiftMutationResponse(raw)
}

/**
 * Checks the rider into a booked shift.
 * @param http - Injected HTTP client
 * @param request - Booking id plus GPS
 * @returns Unwrapped mutation response
 * @throws {ZodError} If booking id or coordinates are invalid
 */
export async function checkInRiderShift(
  http: RiderShiftsHttp,
  request: CheckInRiderShiftRequest
): Promise<RiderShiftMutationResponse> {
  const body = buildCheckInRiderShiftBody(request)
  const raw = await http.post<unknown, typeof body>(
    RIDER_SHIFTS_API.checkin,
    body
  )
  return unwrapRiderShiftMutationResponse(raw)
}

/**
 * Cancels a booked shift.
 * @param http - Injected HTTP client
 * @param request - Booking id plus cancellation reason
 * @returns Unwrapped mutation response
 * @throws {ZodError} If the reason is empty
 */
export async function cancelRiderShift(
  http: RiderShiftsHttp,
  request: CancelRiderShiftRequest
): Promise<RiderShiftMutationResponse> {
  const body = buildCancelRiderShiftBody(request)
  const raw = await http.delete(
    RIDER_SHIFTS_API.cancelBooking(request.bookingId),
    body
  )
  return unwrapRiderShiftMutationResponse(raw)
}
