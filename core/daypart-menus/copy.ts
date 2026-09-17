import type { DaypartMenuSlug } from "@/constants"
import type { MenuAvailability } from "./availability"
import { DAYPART_MENU_LABEL_KEYS, MENU_HOURS_NOTICE_KEYS } from "./constants"

/**
 * UI notice for an off-menu item. `none` when the item is on the live menu
 * or the flags are missing.
 */
export type MenuHoursNotice =
  | { kind: "none" }
  | { kind: "not-on-current-menu" }
  | { kind: "not-right-now" }
  | { kind: "available-on"; slugs: readonly DaypartMenuSlug[] }

/**
 * `t(key, { menus })` — apps pass i18n `t` (or a wrapper). Core never imports
 * next-intl / i18next.
 */
export type MenuHoursTranslateFn = (
  key: string,
  options?: Record<string, string>
) => string

/**
 * Cart line / checkout / reorder-error copy. Off-menu always maps to the
 * current-menu refusal; detail/favorite use {@link resolveMenuHoursNotice}.
 * @param availability - Line flags, or `null` when unread
 * @returns Notice to render on the cart line
 * @example
 * resolveMenuHoursCartNotice({ available: false, menuSlugs: ["morning"], liveMenuSlug: "noon" })
 * // { kind: "not-on-current-menu" }
 */
export function resolveMenuHoursCartNotice(
  availability: MenuAvailability | null | undefined
): MenuHoursNotice {
  if (!availability || availability.available) {
    return { kind: "none" }
  }
  return { kind: "not-on-current-menu" }
}

/**
 * Detail, favorite, and order-history copy.
 * `liveMenuSlug === null` is a gap between dayparts. Non-empty `menuSlugs`
 * name the menus the item belongs to. All-day items (`[]`) stay `available`.
 * @param availability - Root or nested product flags
 * @returns Notice to render on the screen
 * @example
 * resolveMenuHoursNotice({ available: false, menuSlugs: ["morning"], liveMenuSlug: "noon" })
 * // { kind: "available-on", slugs: ["morning"] }
 */
export function resolveMenuHoursNotice(
  availability: MenuAvailability | null | undefined
): MenuHoursNotice {
  if (!availability || availability.available) {
    return { kind: "none" }
  }
  if (availability.liveMenuSlug === null) {
    return { kind: "not-right-now" }
  }
  if (availability.menuSlugs.length > 0) {
    return { kind: "available-on", slugs: availability.menuSlugs }
  }
  return { kind: "not-on-current-menu" }
}

/**
 * Joins locked slug labels with the app translator. Unknown slugs are skipped.
 * @param slugs - Menu slugs from the API
 * @param t - App translator
 * @returns Comma-separated labels, e.g. `"Morning, Dinner"`
 * @example
 * formatMenuSlugLabels(["morning", "dinner"], (key) => key)
 * // "daypart-menu-morning, daypart-menu-dinner"
 */
export function formatMenuSlugLabels(
  slugs: readonly string[],
  t: MenuHoursTranslateFn
): string {
  return slugs
    .map((slug) =>
      slug in DAYPART_MENU_LABEL_KEYS
        ? t(DAYPART_MENU_LABEL_KEYS[slug as DaypartMenuSlug])
        : ""
    )
    .filter((label) => label.length > 0)
    .join(", ")
}

/**
 * Turns a notice into display copy. Apps own the locale files.
 * @param notice - Resolved notice
 * @param t - App translator
 * @returns Localized string, or `null` when there is nothing to show
 * @example
 * formatMenuHoursNotice({ kind: "not-right-now" }, (key) => key)
 * // "menu-hours-not-right-now"
 */
export function formatMenuHoursNotice(
  notice: MenuHoursNotice,
  t: MenuHoursTranslateFn
): string | null {
  if (notice.kind === "none") {
    return null
  }
  if (notice.kind === "not-on-current-menu") {
    return t(MENU_HOURS_NOTICE_KEYS.notOnCurrentMenu)
  }
  if (notice.kind === "not-right-now") {
    return t(MENU_HOURS_NOTICE_KEYS.notRightNow)
  }
  const menus = formatMenuSlugLabels(notice.slugs, t)
  if (!menus) {
    return t(MENU_HOURS_NOTICE_KEYS.notOnCurrentMenu)
  }
  return t(MENU_HOURS_NOTICE_KEYS.availableOn, { menus })
}

/**
 * Customer banner for an off-menu item. Always starts with the current-menu
 * refusal so cart, detail, and favorites share the same sentence. Detail
 * appends “Available on the {menus} menu” when slugs are present.
 * @param availability - Parsed flags, or `null` when unread
 * @param t - App translator
 * @returns Localized banner, or `null` when the item is on-menu / unread
 * @example
 * formatOffMenuCustomerBanner(
 *   { available: false, menuSlugs: ["morning"], liveMenuSlug: "noon" },
 *   (key, options) => options?.menus ? `${key}:${options.menus}` : key
 * )
 * // "menu-hours-not-on-current-menu. menu-hours-available-on:daypart-menu-morning"
 */
export function formatOffMenuCustomerBanner(
  availability: MenuAvailability | null | undefined,
  t: MenuHoursTranslateFn
): string | null {
  const currentMenu = formatMenuHoursNotice(
    resolveMenuHoursCartNotice(availability),
    t
  )
  if (!currentMenu) {
    return null
  }
  const detail = resolveMenuHoursNotice(availability)
  if (detail.kind !== "available-on") {
    return currentMenu
  }
  const extra = formatMenuHoursNotice(detail, t)
  if (!extra || extra === currentMenu) {
    return currentMenu
  }
  return `${currentMenu}. ${extra}`
}
