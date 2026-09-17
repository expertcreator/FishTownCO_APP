import { SHIFT_DEFAULTS } from "@/constants"
import type { AvailableShiftBookingKind } from "./schemas"

export type { AvailableShiftBookingKind } from "./schemas"

/**
 * Classifies an available shift for book vs join-check-in vs not bookable.
 * Remaining minutes = (endTime - now) / 60000. Floor is {@link SHIFT_DEFAULTS.MIN_DURATION_MINUTES}.
 * @param startTime - Slot start ISO string
 * @param endTime - Slot end ISO string
 * @param nowMs - Current time in ms (defaults to Date.now())
 * @returns Booking kind for CTA / payload decisions
 * @example
 * getAvailableShiftBookingKind("2026-09-09T00:00:00.000Z", "2026-09-09T18:00:00.000Z")
 */
export function getAvailableShiftBookingKind(
  startTime: string,
  endTime: string,
  nowMs: number = Date.now()
): AvailableShiftBookingKind {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()

  if (nowMs < start) {
    return "future"
  }

  const remainingMinutes = (end - nowMs) / 60_000
  if (nowMs < end && remainingMinutes >= SHIFT_DEFAULTS.MIN_DURATION_MINUTES) {
    return "running"
  }

  return "too_late"
}

/**
 * Picks a currently running available slot the rider can start now.
 * @param items - Available shift rows with start/end times
 * @param nowMs - Current time in ms (defaults to Date.now())
 * @returns First running item, or null when none can be started
 */
export function pickRunningAvailableShift<
  T extends { startTime: string; endTime: string }
>(items: T[], nowMs: number = Date.now()): T | null {
  return (
    items.find(
      (item) =>
        getAvailableShiftBookingKind(item.startTime, item.endTime, nowMs) ===
        "running"
    ) ?? null
  )
}
