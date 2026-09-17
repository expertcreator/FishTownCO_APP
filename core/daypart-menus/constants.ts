import { DAYPART_MENU_SLUGS, type DaypartMenuSlug } from "@/constants"

/**
 * `HH:mm` in 24-hour time. Used by window math and request schemas.
 */
export const DAYPART_CLOCK_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/

/**
 * Restaurant-admin daypart-menu API paths (no leading slash).
 * @example
 * DAYPART_MENUS_API.byBranch("abc")
 * // "daypart-menus/branch/abc"
 */
export const DAYPART_MENUS_API = {
  /**
   * Builds GET/PUT path for one branch's four locked dayparts.
   * @param branchId - Branch identifier
   * @returns Encoded `daypart-menus/branch/:id` path
   */
  byBranch: (branchId: string) =>
    `daypart-menus/branch/${encodeURIComponent(branchId)}`
} as const

/** Message keys for the four locked daypart names. */
export const DAYPART_MENU_LABEL_KEYS = {
  morning: "daypart-menu-morning",
  noon: "daypart-menu-noon",
  evening: "daypart-menu-evening",
  dinner: "daypart-menu-dinner"
} as const satisfies Record<DaypartMenuSlug, string>

export type DaypartMenuLabelKey =
  (typeof DAYPART_MENU_LABEL_KEYS)[DaypartMenuSlug]

/**
 * Customer-app copy keys for off-menu cart / detail / favorite states.
 * Do not hardcode clock windows in the UI — labels are slug-based.
 */
export const MENU_HOURS_NOTICE_KEYS = {
  notOnCurrentMenu: "menu-hours-not-on-current-menu",
  availableOn: "menu-hours-available-on",
  notRightNow: "menu-hours-not-right-now",
  itemOnlyOn: "menu-hours-item-only-on"
} as const

export type MenuHoursNoticeKey =
  (typeof MENU_HOURS_NOTICE_KEYS)[keyof typeof MENU_HOURS_NOTICE_KEYS]

/**
 * Default clock windows when a branch has no saved dayparts yet.
 */
export const DEFAULT_DAYPART_WINDOWS: readonly {
  slug: DaypartMenuSlug
  startTime: string
  endTime: string
}[] = [
  { slug: "morning", startTime: "08:00", endTime: "10:00" },
  { slug: "noon", startTime: "10:00", endTime: "16:00" },
  { slug: "evening", startTime: "16:00", endTime: "19:00" },
  { slug: "dinner", startTime: "19:00", endTime: "00:00" }
]

/**
 * Maps a daypart slug to its i18n label key, or null when unknown.
 * @param slug - API slug such as `morning`
 * @returns Label key for `Text` / `t()`, or null
 * @example
 * daypartSlugLabelKey("morning") // "daypart-menu-morning"
 */
export function daypartSlugLabelKey(slug: string): DaypartMenuLabelKey | null {
  if ((DAYPART_MENU_SLUGS as readonly string[]).includes(slug)) {
    return DAYPART_MENU_LABEL_KEYS[slug as DaypartMenuSlug]
  }
  return null
}
