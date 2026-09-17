import type { CashDrawerTranslate } from "./types"

const MONEY_AMOUNT = /^(-?)(\d+)(?:\.(\d{1,2}))?$/

function moneyAmountToMinor(amount: string): bigint {
  const match = MONEY_AMOUNT.exec(amount.trim() || "0")
  if (!match) {
    throw new Error("Invalid cash amount")
  }
  const [, sign, whole, fraction = ""] = match
  const minor = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"))
  return sign === "-" ? -minor : minor
}

/**
 * Returns whether a decimal-string amount is zero.
 * @param amount - API decimal string
 * @returns True when the amount is 0
 * @throws {Error} If the amount is not a valid cash decimal
 */
export function isZeroMoneyAmount(amount: string): boolean {
  return moneyAmountToMinor(amount) === BigInt(0)
}

/**
 * Returns whether a decimal-string amount is negative.
 * @param amount - API decimal string
 * @returns True when the amount is below zero
 * @throws {Error} If the amount is not a valid cash decimal
 */
export function isNegativeMoneyAmount(amount: string): boolean {
  return moneyAmountToMinor(amount) < BigInt(0)
}

/**
 * Formats a keypad integer for the amount card (no forced decimals).
 * @param amount - Digit string from the keypad
 * @param currencySymbol - Tenant currency symbol
 * @param locale - Active UI locale
 * @returns Display string such as `Rs 55`
 */
export function formatKeypadCashDrawerAmount(
  amount: string,
  currencySymbol: string,
  locale: string
): string {
  const digits = amount.trim() || "0"
  const grouped = BigInt(digits).toLocaleString(locale)
  return `${currencySymbol}${grouped}`
}

/**
 * Formats cash-out for the summary card, always showing a minus when non-zero.
 * @param amount - API decimal string
 * @param formatCurrency - Tenant currency formatter
 * @returns Signed display string
 */
export function formatCashOutDisplay(
  amount: string,
  formatCurrency: (value: string) => string
): string {
  const unsigned = amount.startsWith("-") ? amount.slice(1) : amount
  const formatted = formatCurrency(unsigned)
  if (isZeroMoneyAmount(unsigned)) {
    return formatted
  }
  return formatted.startsWith("−") || formatted.startsWith("-")
    ? formatted
    : `−${formatted}`
}

/**
 * Formats the When? row like POS (`Now · Mon 17 Aug, 3:08 PM`).
 * @param value - Selected occurrence
 * @param locale - Active UI locale
 * @param translate - Money-namespace translator
 * @returns Localized when label
 */
export function formatCashDrawerWhen(
  value: Date | null,
  locale: string,
  translate: CashDrawerTranslate
): string {
  if (!value || Number.isNaN(value.getTime())) {
    return translate("day.today")
  }
  const weekday = value.toLocaleDateString(locale, { weekday: "short" })
  const day = value.getDate()
  const month = value.toLocaleDateString(locale, { month: "short" })
  const time = value.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit"
  })
  const stamp = `${weekday} ${day} ${month}, ${time}`
  const nearNow = Math.abs(Date.now() - value.getTime()) < 2 * 60 * 1000
  return nearNow ? translate("when-now", { stamp }) : stamp
}

/**
 * Formats `asOf` from GET /cash-summary as a short time.
 * @param iso - ISO timestamp
 * @param locale - Active UI locale
 * @returns Localized time, or the original string when invalid
 */
export function formatAsOfTime(iso: string, locale: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit"
  })
}

/**
 * Returns whether two timestamps fall on the same calendar day.
 * @param isoA - First ISO timestamp
 * @param isoB - Second ISO timestamp
 * @param timeZone - Optional IANA time zone
 * @returns True when both instants share a local calendar date
 */
export function isSameCashDrawerCalendarDay(
  isoA: string,
  isoB: string,
  timeZone?: string
): boolean {
  const first = new Date(isoA)
  const second = new Date(isoB)
  if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) {
    return false
  }
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone
  }
  return (
    first.toLocaleDateString("en-CA", options) ===
    second.toLocaleDateString("en-CA", options)
  )
}

/**
 * Formats an entry timestamp, optionally with a short calendar date.
 * @param iso - ISO timestamp
 * @param locale - Active UI locale
 * @param timeZone - Optional IANA time zone
 * @param includeDate - When true, prefix the time with weekday day month
 * @returns Localized stamp, or the original string when invalid
 */
export function formatCashDrawerEntryStamp(
  iso: string,
  locale: string,
  timeZone?: string,
  includeDate = false
): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  const time = date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone
  })
  if (!includeDate) {
    return time
  }
  const weekday = date.toLocaleDateString(locale, {
    weekday: "short",
    timeZone
  })
  const day = date.toLocaleDateString(locale, { day: "numeric", timeZone })
  const month = date.toLocaleDateString(locale, { month: "short", timeZone })
  return `${weekday} ${day} ${month}, ${time}`
}

/**
 * Shifts a YYYY-MM-DD business date by a whole number of days.
 * @param isoDate - Business date
 * @param days - Signed day offset
 * @returns Shifted YYYY-MM-DD
 */
export function shiftIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/**
 * Formats a business date for the day stepper (weekday day month).
 * @param isoDate - YYYY-MM-DD
 * @param locale - Active UI locale
 * @returns Short date label
 */
export function formatStepperDate(isoDate: string, locale: string): string {
  const date = new Date(`${isoDate}T12:00:00.000Z`)
  const weekday = date.toLocaleDateString(locale, {
    weekday: "short",
    timeZone: "UTC"
  })
  const day = date.toLocaleDateString(locale, {
    day: "numeric",
    timeZone: "UTC"
  })
  const month = date.toLocaleDateString(locale, {
    month: "short",
    timeZone: "UTC"
  })
  return `${weekday} ${day} ${month}`
}

/**
 * Whole-day difference between two YYYY-MM-DD business dates.
 * @param later - Later date
 * @param earlier - Earlier date
 * @returns `later - earlier` in days
 */
export function diffIsoDateDays(later: string, earlier: string): number {
  const laterDate = new Date(`${later}T12:00:00.000Z`)
  const earlierDate = new Date(`${earlier}T12:00:00.000Z`)
  return Math.round((laterDate.getTime() - earlierDate.getTime()) / 86_400_000)
}

/**
 * Formats an instant as YYYY-MM-DD in a branch timezone.
 * @param date - Instant to convert
 * @param timezone - IANA time zone, or UTC when omitted
 * @returns Business date
 */
export function businessDateInTimezone(
  date: Date,
  timezone?: string | null
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone || "UTC"
  }).formatToParts(date)
  const value = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? ""
  return `${value("year")}-${value("month")}-${value("day")}`
}

/**
 * Builds a 7-day inclusive range ending on a business date.
 * @param businessDate - Inclusive end date YYYY-MM-DD
 * @returns `{ from, to }` range
 */
export function rangeEndingOn(businessDate: string): {
  from: string
  to: string
} {
  const end = new Date(`${businessDate}T12:00:00.000Z`)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 6)
  return { from: start.toISOString().slice(0, 10), to: businessDate }
}
