/**
 * Rider (driver-app) shift domain: next booking, available slots, book,
 * check-in, swap, and next-shift payload helpers.
 *
 * **Not `@/core/rider-orders`.** This is the shift/slot booking surface
 * under the auth gateway (`rider/next-shift`, `rider/available-shifts`).
 */

export { RIDER_SHIFTS_API } from "./constants"
export {
  bookRiderShift,
  cancelRiderShift,
  cancelRiderShiftSwap,
  checkInRiderShift,
  getAvailableShiftDates,
  getAvailableShiftFilters,
  getRiderNextShift,
  listAvailableRiderShifts,
  listRiderMyShifts,
  swapRiderShift
} from "./api"
export { createRiderShiftsHttp } from "./http"
export type {
  RiderShiftsHttp,
  RiderShiftsJsonResponse,
  RiderShiftsRequestClient,
  RiderShiftsSearchParams
} from "./http"
export {
  availableShiftBookingKindSchema,
  bookRiderShiftBodySchema,
  cancelRiderShiftBodySchema,
  checkInRiderShiftBodySchema,
  riderNextShiftSchema
} from "./schemas"
export type {
  AvailableShiftBookingKind,
  BookRiderShiftBody,
  CancelRiderShiftBody,
  CheckInRiderShiftBody,
  RiderNextShiftParsed
} from "./schemas"
export {
  buildAvailableShiftFiltersSearchParams,
  buildAvailableShiftsSearchParams,
  buildBookRiderShiftBody,
  buildCancelRiderShiftBody,
  buildCheckInRiderShiftBody,
  buildMyShiftsSearchParams,
  buildNextShiftSearchParams,
  readBookedShiftId,
  unwrapBookRiderShiftResponse,
  unwrapRiderShiftMutationResponse
} from "./payloads"
export {
  getAvailableShiftBookingKind,
  pickRunningAvailableShift
} from "./booking-kind"
export {
  asRiderNextShiftArray,
  extractCheckedInShift,
  findShiftBookingStatus,
  findShiftMapContext,
  isNextShiftPayloadEmpty,
  isTerminalShiftBookingStatus,
  readRiderShiftBoundaries
} from "./next-shift"
export type {
  BookedRiderShiftData,
  BookRiderShiftRequest,
  BookRiderShiftResponse,
  CancelRiderShiftRequest,
  CheckInRiderShiftRequest,
  RiderAvailableShift,
  RiderAvailableShiftDates,
  RiderAvailableShiftFilterLocation,
  RiderAvailableShiftFiltersParams,
  RiderAvailableShiftsPage,
  RiderAvailableShiftsParams,
  RiderMyShift,
  RiderMyShiftsPage,
  RiderMyShiftsParams,
  RiderNextShift,
  RiderNextShiftParams,
  RiderNextShiftPayload,
  RiderShiftEnvelope,
  RiderShiftMapContext,
  RiderShiftMutationResponse,
  SwapRiderShiftRequest
} from "./types"
