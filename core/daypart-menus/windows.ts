import type { DaypartMenuSlug } from "@/constants"
import { DAYPART_CLOCK_TIME } from "./constants"
import type { DaypartMenuTimesInput } from "./types"

const MINUTES_PER_DAY = 1440

type MinuteSegment = readonly [start: number, end: number]

/**
 * Parses `HH:mm` into minutes from midnight. `00:00` is 0.
 * @param value - Clock time
 * @returns Minutes in `[0, 1440)`, or null when the string is not `HH:mm`
 * @example
 * parseClockMinutes("09:30") // 570
 */
export function parseClockMinutes(value: string): number | null {
  const trimmed = value.trim()
  if (!DAYPART_CLOCK_TIME.test(trimmed)) {
    return null
  }
  const [hours, minutes] = trimmed.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Inclusive start, exclusive end. `end < start` wraps past midnight.
 * `00:00` as end is midnight close, not a wrap.
 * @param nowHhmm - Wall-clock now
 * @param start - Window start
 * @param end - Window end
 * @returns Whether `now` is inside the window
 * @example
 * isTimeInRange("23:00", "19:00", "00:00") // true
 */
export function isTimeInRange(
  nowHhmm: string,
  start: string,
  end: string
): boolean {
  const now = parseClockMinutes(nowHhmm)
  const startM = parseClockMinutes(start)
  const endM = parseClockMinutes(end)
  if (now == null || startM == null || endM == null) {
    return false
  }
  if (endM === 0 && startM !== 0) {
    return now >= startM
  }
  if (endM < startM) {
    return now >= startM || now < endM
  }
  return now >= startM && now < endM
}

/**
 * Expands a (possibly wrapping) window into half-open same-day segments.
 * Midnight end (`00:00`) is `[start, 1440)`, not a wrap.
 * @param start - Window start
 * @param end - Window end
 * @returns Zero, one, or two `[start, end)` minute ranges
 */
export function windowToSegments(start: string, end: string): MinuteSegment[] {
  const startM = parseClockMinutes(start)
  const endM = parseClockMinutes(end)
  if (startM == null || endM == null) {
    return []
  }
  if (endM === 0) {
    return startM === 0 ? [] : [[startM, MINUTES_PER_DAY]]
  }
  if (endM < startM) {
    return [
      [startM, MINUTES_PER_DAY],
      [0, endM]
    ]
  }
  if (endM === startM) {
    return []
  }
  return [[startM, endM]]
}

function segmentsOverlap(left: MinuteSegment, right: MinuteSegment): boolean {
  return left[0] < right[1] && right[0] < left[1]
}

/**
 * True when two windows share any minute. Adjacent exclusive ends do not overlap.
 * @param left - First window
 * @param right - Second window
 * @returns Whether the windows share a minute
 */
export function windowsOverlap(
  left: Pick<DaypartMenuTimesInput, "startTime" | "endTime">,
  right: Pick<DaypartMenuTimesInput, "startTime" | "endTime">
): boolean {
  const leftSegs = windowToSegments(left.startTime, left.endTime)
  const rightSegs = windowToSegments(right.startTime, right.endTime)
  return leftSegs.some((a) => rightSegs.some((b) => segmentsOverlap(a, b)))
}

/**
 * First overlapping pair, or null when every pair is adjacent or gapped.
 * @param menus - Candidate dayparts
 * @returns The two slugs that share a minute
 */
export function findOverlappingPair(
  menus: DaypartMenuTimesInput[]
): DaypartMenuSlug[] | null {
  for (let i = 0; i < menus.length; i++) {
    for (let j = i + 1; j < menus.length; j++) {
      if (windowsOverlap(menus[i], menus[j])) {
        return [menus[i].slug, menus[j].slug]
      }
    }
  }
  return null
}

/**
 * All-day (`[]`) always matches. Tagged items match only the live slug.
 * When no menu covers now (`liveSlug` is null) only all-day items match.
 * Shop closed is a separate existing rule, not this check.
 * @param menuSlugs - Product or deal ticks
 * @param liveSlug - Live daypart, or null when no menu covers now
 * @returns Whether the item belongs on the ordering list
 * @example
 * productMatchesLiveMenu([], "noon") // true
 * productMatchesLiveMenu(["morning"], "noon") // false
 */
export function productMatchesLiveMenu(
  menuSlugs: readonly string[] | null | undefined,
  liveSlug: DaypartMenuSlug | null
): boolean {
  if (!menuSlugs || menuSlugs.length === 0) {
    return true
  }
  if (!liveSlug) {
    return false
  }
  return menuSlugs.includes(liveSlug)
}

/**
 * IANA zone of this browser (or runtime). Used as the live-menu clock.
 * @returns Zone id, or `UTC` when the runtime has none
 */
export function clientTimeZone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return zone?.trim() || "UTC"
  } catch {
    return "UTC"
  }
}

/**
 * Wall-clock `HH:mm` in a timezone. Omit `timeZone` to use the client zone.
 * @param now - Instant
 * @param timeZone - IANA zone; invalid or blank falls back to the client zone
 * @returns Zero-padded 24h clock
 * @example
 * clockInTimeZone(new Date("2026-08-28T12:45:00.000Z"), "Asia/Karachi")
 * // "17:45"
 */
export function clockInTimeZone(now: Date, timeZone?: string): string {
  const zone = timeZone?.trim()
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23"
  }
  if (zone) {
    options.timeZone = zone
  }
  try {
    const parts = new Intl.DateTimeFormat("en-GB", options).formatToParts(now)
    const hourRaw = parts.find((part) => part.type === "hour")?.value ?? "00"
    const minuteRaw =
      parts.find((part) => part.type === "minute")?.value ?? "00"
    const hour = Number.parseInt(hourRaw, 10)
    const minute = Number.parseInt(minuteRaw, 10)
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    }
    return `${String(hour % 24).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`
  } catch {
    if (zone) {
      return clockInTimeZone(now)
    }
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  }
}

/**
 * Live slug at a wall-clock time.
 * @param menus - Branch dayparts
 * @param nowHhmm - Wall-clock now in the client zone
 * @returns At most one slug
 */
export function resolveLiveSlug(
  menus: {
    slug: DaypartMenuSlug
    startTime: string
    endTime: string
  }[],
  nowHhmm: string
): DaypartMenuSlug | null {
  const live = menus.find((menu) =>
    isTimeInRange(nowHhmm, menu.startTime, menu.endTime)
  )
  return live?.slug ?? null
}
