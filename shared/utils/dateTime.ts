// Straight from core, not through `./i18n` — that module initialises i18next and
// MMKV at import time, and these date helpers need none of it (mw-4-1).
import { getLocaleTag } from "@/core/i18n";

export type DateInput = string | number | Date | null | undefined;

const EMPTY_PLACEHOLDER = "—";

/** En-dash between a 12-hour start and end time (`9:00 AM – 7:00 PM`). */
export const DISPLAY_TIME_RANGE_SEPARATOR = "–";

/**
 * Formats hour and minute as 12-hour clock with English AM/PM (e.g. `9:00 AM`).
 * Midnight (`0`) is `12:00 AM` and noon (`12`) is `12:00 PM`. Never uses 24-hour time.
 * AM/PM labels are always Latin English, including Arabic and Urdu UIs.
 * @param hours24 - Hours on a 24-hour clock (`0`–`23`)
 * @param minutes - Minutes (`0`–`59`)
 * @returns 12-hour time such as `9:00 AM`
 * @example formatDisplayClock(0, 0) // "12:00 AM"
 * @example formatDisplayClock(12, 0) // "12:00 PM"
 * @example formatDisplayClock(19, 0) // "7:00 PM"
 */
export function formatDisplayClock(hours24: number, minutes: number): string {
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/**
 * Formats a timestamp as 12-hour clock with AM/PM (e.g. `9:00 AM`).
 * Midnight is `12:00 AM` and noon is `12:00 PM`. Never uses 24-hour time.
 * @param dateInput - ISO string, epoch ms, or Date
 * @returns 12-hour time in the device timezone, or `—` when input is invalid
 * @example formatDisplayTime(new Date(2026, 0, 1, 0, 0)) // "12:00 AM"
 * @example formatDisplayTime(new Date(2026, 0, 1, 12, 0)) // "12:00 PM"
 * @example formatDisplayTime(new Date(2026, 0, 1, 19, 0)) // "7:00 PM"
 */
export function formatDisplayTime(dateInput: DateInput): string {
  const date = parseOrderDate(dateInput);
  if (!date) {
    return EMPTY_PLACEHOLDER;
  }
  return formatDisplayClock(date.getHours(), date.getMinutes());
}

/**
 * Formats a start and end timestamp as a 12-hour range.
 * @param startInput - Range start
 * @param endInput - Range end
 * @param separator - Text between times. Defaults to an en-dash. Pass `t("shifts.to")` for a localized connector.
 * @returns Range such as `9:00 AM – 7:00 PM`
 * @example formatDisplayTimeRange(new Date(2026, 0, 1, 9, 0), new Date(2026, 0, 1, 19, 0))
 */
export function formatDisplayTimeRange(
  startInput: DateInput,
  endInput: DateInput,
  separator = DISPLAY_TIME_RANGE_SEPARATOR
): string {
  return `${formatDisplayTime(startInput)} ${separator} ${formatDisplayTime(endInput)}`;
}

/** Parses ISO strings, epoch ms, or Date instances; returns null when invalid. */
export function parseOrderDate(input: DateInput): Date | null {
  if (input == null || input === "") {
    return null;
  }
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

/** Formats an ISO timestamp as date and time (e.g. "May 22, 2026, 7:36 PM"). */
export function formatOrderDateTime(
  dateInput: DateInput,
  locale = "en"
): string {
  const date = parseOrderDate(dateInput);
  if (!date) {
    return EMPTY_PLACEHOLDER;
  }
  return date.toLocaleString(getLocaleTag(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Formats an ISO timestamp as time only (e.g. "7:36 pm"). */
export function formatOrderTime(
  dateInput: DateInput,
  locale = "en"
): string {
  const date = parseOrderDate(dateInput);
  if (!date) {
    return EMPTY_PLACEHOLDER;
  }
  return date
    .toLocaleTimeString(getLocaleTag(locale), {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
}

/** Formats an ISO timestamp as date only (e.g. "May 22, 2026"). */
export function formatOrderDate(
  dateInput: DateInput,
  locale = "en"
): string {
  const date = parseOrderDate(dateInput);
  if (!date) {
    return EMPTY_PLACEHOLDER;
  }
  return date.toLocaleDateString(getLocaleTag(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Medium-length date (e.g. "May 22, 2026") for subscription and legal copy. */
export function formatOrderDateMedium(
  dateInput: DateInput,
  locale = "en"
): string {
  const date = parseOrderDate(dateInput);
  if (!date) {
    return EMPTY_PLACEHOLDER;
  }
  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    dateStyle: "medium",
  }).format(date);
}

/** Compact month + day (e.g. "May 22") for notification fallbacks. */
export function formatOrderDateShort(
  dateInput: DateInput,
  locale = "en"
): string {
  const date = parseOrderDate(dateInput);
  if (!date) {
    return EMPTY_PLACEHOLDER;
  }
  return date.toLocaleDateString(getLocaleTag(locale), {
    month: "short",
    day: "numeric",
  });
}

/** Short date and time for banners and compact UI; returns null when input is invalid. */
export function formatShortDateTime(
  dateInput: DateInput,
  locale = "en"
): string | null {
  const date = parseOrderDate(dateInput);
  if (!date) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat(getLocaleTag(locale), {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  } catch {
    return formatOrderDateTime(dateInput, locale);
  }
}

/** Single-line date + time for narrow pickers (avoids awkward comma line breaks). */
export function formatCompactDateTime(
  dateInput: DateInput,
  locale = "en"
): string | null {
  const date = parseOrderDate(dateInput);
  if (!date) {
    return null;
  }
  const datePart = date.toLocaleDateString(getLocaleTag(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString(getLocaleTag(locale), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} · ${timePart}`;
}
