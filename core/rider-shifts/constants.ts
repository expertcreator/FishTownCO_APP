/**
 * Rider (driver-app) shift paths under the auth gateway.
 * App adapters prefix `auth/api/v1`.
 */
export const RIDER_SHIFTS_API = {
  /** GET the rider's next booked shift. */
  nextShift: "rider/next-shift",
  /** GET nearby bookable slots. */
  availableShifts: "rider/available-shifts",
  /** GET the rider's booked shifts. */
  myShifts: "rider/my-shifts",
  /** GET zone filter options for available shifts. */
  availableShiftFilters: "rider/available-shifts/filters",
  /** GET the calendar window of available shift dates. */
  availableShiftDates: "rider/available-shifts/dates",
  /** POST book a slot. DELETE `bookShift/:bookingId` cancels. */
  bookShift: "rider/book-shift",
  /** Folder for swap — POST/DELETE `rider/shifts/:bookingId/swap`. */
  shifts: "rider/shifts",
  /** POST check-in with GPS. */
  checkin: "rider/checkin",
  /** GET pickup-point details. */
  pickupPoint: "rider/pickup-point",
  /**
   * Builds POST/DELETE `rider/shifts/:bookingId/swap`.
   * @param bookingId - Booking UUID
   * @returns Encoded swap path
   */
  swap: (bookingId: string) =>
    `rider/shifts/${encodeURIComponent(bookingId)}/swap`,
  /**
   * Builds DELETE `rider/book-shift/:bookingId`.
   * @param bookingId - Booking UUID
   * @returns Encoded cancel path
   */
  cancelBooking: (bookingId: string) =>
    `rider/book-shift/${encodeURIComponent(bookingId)}`
} as const
