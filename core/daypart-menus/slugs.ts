import { DAYPART_MENU_SLUGS, type DaypartMenuSlug } from "@/constants"

/**
 * Whether a string is one of the four locked daypart slugs.
 * @param value - Candidate slug
 * @returns True for `morning` | `noon` | `evening` | `dinner`
 */
export function isDaypartMenuSlug(value: string): value is DaypartMenuSlug {
  return (DAYPART_MENU_SLUGS as readonly string[]).includes(value)
}

/**
 * Keeps only the four locked slugs, in lock order, dropping duplicates.
 * @param value - Unknown API or form array
 * @returns Valid menu slugs
 * @example
 * normalizeMenuSlugs(["dinner", "morning", "breakfast"])
 * // ["morning", "dinner"]
 */
export function normalizeMenuSlugs(value: unknown): DaypartMenuSlug[] {
  if (!Array.isArray(value)) {
    return []
  }
  const seen = new Set<DaypartMenuSlug>()
  for (const item of value) {
    if (typeof item === "string" && isDaypartMenuSlug(item)) {
      seen.add(item)
    }
  }
  return DAYPART_MENU_SLUGS.filter((slug) => seen.has(slug))
}
