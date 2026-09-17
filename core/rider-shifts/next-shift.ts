import { SHIFT_BOOKING_STATUS } from "@/constants"
import type { RiderShiftMapContext } from "./types"

const TERMINAL_SHIFT_STATUSES = new Set<string>([
  SHIFT_BOOKING_STATUS.CHECKED_OUT,
  SHIFT_BOOKING_STATUS.COMPLETED,
  SHIFT_BOOKING_STATUS.CANCELLED,
  SHIFT_BOOKING_STATUS.NO_SHOW
])

interface ShiftLike {
  bookingId?: string
  id?: string
  status?: string
  zoneId?: string
  boundaries?: string
  zone?: {
    id?: string
    boundaries?: string | Record<string, unknown>
  }
}

/**
 * Normalizes a next-shift API payload into a flat shift list.
 * @param data - Raw `nextShift` query data (array, object, or `{ data }`)
 * @returns Shift objects from the payload
 */
export function asRiderNextShiftArray(data: unknown): ShiftLike[] {
  if (!data) {
    return []
  }

  if (Array.isArray(data)) {
    return data as ShiftLike[]
  }

  if (typeof data !== "object") {
    return []
  }

  if ("data" in data) {
    const inner = (data as { data?: unknown }).data
    if (Array.isArray(inner)) {
      return inner as ShiftLike[]
    }
    if (inner && typeof inner === "object") {
      return [inner as ShiftLike]
    }
    return []
  }

  return [data as ShiftLike]
}

/**
 * Reads zone GeoJSON from a shift, stringifying object boundaries when needed.
 * @param shift - Shift row from next-shift
 * @returns GeoJSON string or null
 */
export function readRiderShiftBoundaries(shift: ShiftLike): string | null {
  const fromZone = shift.zone?.boundaries
  if (typeof fromZone === "string" && fromZone.trim()) {
    return fromZone
  }
  if (fromZone && typeof fromZone === "object") {
    try {
      return JSON.stringify(fromZone)
    } catch {
      return null
    }
  }
  if (typeof shift.boundaries === "string" && shift.boundaries.trim()) {
    return shift.boundaries
  }
  return null
}

/**
 * Returns whether a next-shift payload contains no bookings.
 * @param data - Raw `nextShift` query data
 * @returns True when the payload is missing or has an empty list
 */
export function isNextShiftPayloadEmpty(data: unknown): boolean {
  return asRiderNextShiftArray(data).length === 0
}

/**
 * Finds a booked shift in a next-shift payload for map navigation.
 * @param data - Raw `nextShift` query data
 * @param bookingId - Prefer this booking when several rows exist
 * @returns Booking/zone context, or null when the payload has no usable shift
 */
export function findShiftMapContext(
  data: unknown,
  bookingId?: string
): RiderShiftMapContext | null {
  const shifts = asRiderNextShiftArray(data)
  const matched = bookingId
    ? shifts.find((item) => {
        const id = item.bookingId || item.id
        return id != null && String(id) === bookingId
      })
    : undefined
  const shift = matched ?? shifts[0]
  if (!shift) {
    return null
  }

  const id = shift.bookingId || shift.id
  if (!id) {
    return null
  }

  return {
    bookingId: String(id),
    zoneId: shift.zoneId || shift.zone?.id || null,
    boundaries: readRiderShiftBoundaries(shift)
  }
}

/**
 * Finds the rider's currently checked-in shift from a next-shift payload.
 * @param data - Raw `nextShift` query data
 * @returns Booking/zone context, or null when no `CHECKED_IN` shift exists
 */
export function extractCheckedInShift(
  data: unknown
): RiderShiftMapContext | null {
  const shift = asRiderNextShiftArray(data).find(
    (item) => item.status === SHIFT_BOOKING_STATUS.CHECKED_IN
  )
  if (!shift) {
    return null
  }

  const bookingId = shift.bookingId || shift.id
  if (!bookingId) {
    return null
  }

  return {
    bookingId: String(bookingId),
    zoneId: shift.zoneId || shift.zone?.id || null,
    boundaries: readRiderShiftBoundaries(shift)
  }
}

/**
 * Reads booking status for a specific shift from a next-shift payload.
 * @param data - Raw `nextShift` query data
 * @param bookingId - Booking to match
 * @returns Status string or null when the booking is not in the payload
 */
export function findShiftBookingStatus(
  data: unknown,
  bookingId: string
): string | null {
  const shift = asRiderNextShiftArray(data).find((item) => {
    const id = item.bookingId || item.id
    return id != null && String(id) === bookingId
  })
  return typeof shift?.status === "string" ? shift.status : null
}

/**
 * Returns whether a shift booking status means the rider is no longer checked in.
 * @param status - Booking status from the API
 * @returns True for checkout / completed / cancelled / no-show
 */
export function isTerminalShiftBookingStatus(status: string): boolean {
  return TERMINAL_SHIFT_STATUSES.has(status)
}
