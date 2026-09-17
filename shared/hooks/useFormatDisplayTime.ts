import {
  formatDisplayTime,
  formatDisplayTimeRange,
  type DateInput,
} from "@/shared/utils/dateTime";

/** Formats one timestamp as `h:mm AM/PM`. */
export type FormatDisplayTime = (dateInput: DateInput) => string;

/** Formats a start/end pair as `9:00 AM to 7:00 PM`. */
export type FormatDisplayTimeRange = (
  startInput: DateInput,
  endInput: DateInput,
  separator?: string
) => string;

const DISPLAY_TIME_FORMATTERS = {
  formatTime: formatDisplayTime,
  formatTimeRange: formatDisplayTimeRange,
} as const;

/**
 * Shared 12-hour AM/PM clock formatters for React screens that show a time.
 * Always returns `h:mm AM/PM` (never 24-hour), including midnight (`12:00 AM`)
 * and noon (`12:00 PM`). Period labels are always English `AM`/`PM`, including
 * Arabic and Urdu UIs.
 *
 * Use this from components. Non-React helpers (mappers, utils) should call
 * `formatDisplayTime` / `formatDisplayTimeRange` directly.
 * @returns Stable `formatTime` and `formatTimeRange` functions
 * @example
 * const { formatTime, formatTimeRange } = useFormatDisplayTime();
 * formatTime(shift.startTime); // "9:00 AM"
 * formatTimeRange(shift.startTime, shift.endTime); // "9:00 AM – 7:00 PM"
 */
export function useFormatDisplayTime() {
  return DISPLAY_TIME_FORMATTERS;
}
