/**
 * Gateway envelope used by rider shift GETs.
 */
export interface RiderShiftEnvelope<T> {
  success?: boolean
  message?: string
  code?: string
  data: T
}

/**
 * One booked row from GET `rider/next-shift`. Extra zone fields are allowed.
 */
export interface RiderNextShift {
  bookingId: string
  shiftSlotId: string
  zoneId: string
  zoneName: string
  shiftDate: string
  startTime: string
  endTime: string
  status: string
  bookedAt: string
  canCheckIn?: boolean
  zone?: {
    id?: string
    name?: string
    boundaries?: string | Record<string, unknown>
    centerLatitude?: number
    centerLongitude?: number
  }
}

/** Raw GET `rider/next-shift` body (array, object, or `{ data }`). */
export type RiderNextShiftPayload =
  | RiderShiftEnvelope<RiderNextShift | RiderNextShift[]>
  | RiderNextShift[]
  | RiderNextShift

export interface RiderNextShiftParams {
  lang?: string
}

/**
 * One bookable slot from GET `rider/available-shifts`.
 */
export interface RiderAvailableShift {
  id: string
  zoneId: string
  zoneName: string
  shiftDate: string
  startTime: string
  endTime: string
  capacity: number
  bookedCount: number
  availableSlots: number
  createdAt: string
  isSwap: boolean
  swapBookingId: string | null
  shiftSlotId?: string
  status?: string
  bookingId?: string
}

export interface RiderAvailableShiftsPage {
  items: RiderAvailableShift[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface RiderAvailableShiftsParams {
  date: string
  latitude: number
  longitude: number
  radiusKm: number
  lang?: string
  limit?: number
  page?: number
  zoneId?: string
}

export interface BookRiderShiftRequest {
  shiftSlotId: string
  latitude?: number
  longitude?: number
}

export interface BookedRiderShiftData {
  bookingId: string
  shiftSlotId: string
  zoneId: string
  zoneName: string
  shiftDate: string
  startTime: string
  endTime: string
  status: string
  bookedAt: string
  id?: string
}

export interface BookRiderShiftResponse {
  success?: boolean
  message?: string
  data?: BookedRiderShiftData
  code?: string
  status?: string
  bookingId?: string
  id?: string
  error?: unknown
}

export interface RiderShiftMutationResponse {
  success?: boolean
  message?: string
  code?: string
  error?: unknown
  status?: string
  bookingId?: string
  id?: string
}

export interface SwapRiderShiftRequest {
  bookingId: string
}

export interface CheckInRiderShiftRequest {
  bookingId: string
  latitude: number
  longitude: number
}

export interface CancelRiderShiftRequest {
  bookingId: string
  cancellationReason: string
}

export interface RiderAvailableShiftFilterLocation {
  id: string
  name: string
  description?: string
}

export interface RiderAvailableShiftFiltersParams {
  lang?: string
  latitude?: number
  longitude?: number
}

export interface RiderAvailableShiftDates {
  startDate: string
  endDate: string
  currentDate: string
}

export interface RiderMyShift {
  bookingId: string
  shiftSlotId: string
  zoneId: string
  zoneName: string
  shiftDate: string
  startTime: string
  endTime: string
  status: "BOOKED" | "SWAP_REQUESTED" | string
  bookedAt: string
  cancelledAt: string | null
  cancellationReason: string | null
}

export interface RiderMyShiftsPage {
  items: RiderMyShift[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface RiderMyShiftsParams {
  startDate: string
  endDate: string
  status?: string
  lang?: string
  limit?: number
  page?: number
  zoneId?: string
}

/**
 * Booking/zone fields needed to open the shift map.
 */
export interface RiderShiftMapContext {
  bookingId: string
  zoneId: string | null
  boundaries: string | null
}
