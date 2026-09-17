import { ERROR_MESSAGES } from "@/constants"
import type { DaypartMenuSlug } from "@/constants"
import { MENU_HOURS_NOTICE_KEYS } from "./constants"
import { formatMenuSlugLabels, type MenuHoursTranslateFn } from "./copy"
import { isDaypartMenuSlug, normalizeMenuSlugs } from "./slugs"
import type { DaypartSaveAlert } from "./types"

/** Parsed `400 OUTSIDE_MENU_HOURS` from place-order, reorder, or add-to-cart. */
export type OutsideMenuHoursError = {
  code: typeof ERROR_MESSAGES.OUTSIDE_MENU_HOURS
  message: string | null
  productName: string | null
  menuSlugs: DaypartMenuSlug[]
  liveMenuSlug: DaypartMenuSlug | null
}

function asSlugList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === "string")
}

/**
 * Reads overlap / invalid codes from a PUT error body.
 * @param body - JSON error payload
 * @returns Alert to show, or null when this is not a daypart validation error
 * @example
 * parseDaypartSaveError({
 *   code: "DAYPART_MENUS_OVERLAP",
 *   params: { slugs: ["evening", "dinner"] }
 * })
 * // { kind: "overlap", slugA: "evening", slugB: "dinner" }
 */
export function parseDaypartSaveError(body: {
  code?: string
  params?: Record<string, unknown>
}): DaypartSaveAlert | null {
  const slugs = asSlugList(body.params?.slugs)
  const slugA =
    typeof body.params?.slugA === "string" ? body.params.slugA : slugs[0]
  const slugB =
    typeof body.params?.slugB === "string" ? body.params.slugB : slugs[1]

  if (body.code === "DAYPART_MENUS_OVERLAP" && slugA && slugB) {
    return { kind: "overlap", slugA, slugB }
  }
  if (body.code === "DAYPART_MENUS_INVALID") {
    return { kind: "invalid" }
  }
  return null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

/**
 * Unwraps an axios/ky-shaped error to the JSON body, or returns `value`
 * when it already looks like `{ code, params }`.
 * @param value - Thrown error or decoded body
 * @returns JSON body, or `null`
 */
export function readApiErrorBody(value: unknown): unknown {
  const rec = asRecord(value)
  if (!rec) {
    return value ?? null
  }
  const response = asRecord(rec.response)
  if (response && "data" in response) {
    return response.data
  }
  return rec
}

function readErrorCode(body: Record<string, unknown>): string | null {
  if (typeof body.code === "string") {
    return body.code
  }
  const nested = asRecord(body.error)
  return typeof nested?.code === "string" ? nested.code : null
}

/**
 * Reads `400 OUTSIDE_MENU_HOURS` from a decoded body or thrown HTTP error.
 * Off-menu items used to fail as `404 PRODUCT_NOT_FOUND`.
 * @param value - JSON body or axios/ky error
 * @returns Parsed error, or `null` when this is not that code
 * @example
 * parseOutsideMenuHoursError({
 *   code: "OUTSIDE_MENU_HOURS",
 *   params: { productName: "Omelette", menuSlugs: ["morning"], liveMenuSlug: "noon" }
 * })?.productName // "Omelette"
 */
export function parseOutsideMenuHoursError(
  value: unknown
): OutsideMenuHoursError | null {
  const body = asRecord(readApiErrorBody(value))
  if (!body) {
    return null
  }
  if (readErrorCode(body) !== ERROR_MESSAGES.OUTSIDE_MENU_HOURS) {
    return null
  }
  const params = asRecord(body.params)
  const productName =
    typeof params?.productName === "string" && params.productName.trim()
      ? params.productName.trim()
      : null
  const liveRaw = params?.liveMenuSlug
  const liveMenuSlug =
    liveRaw === null
      ? null
      : typeof liveRaw === "string" && isDaypartMenuSlug(liveRaw)
        ? liveRaw
        : null

  return {
    code: ERROR_MESSAGES.OUTSIDE_MENU_HOURS,
    liveMenuSlug,
    menuSlugs: normalizeMenuSlugs(params?.menuSlugs),
    message: typeof body.message === "string" ? body.message : null,
    productName
  }
}

/**
 * Toast / dialog copy for `OUTSIDE_MENU_HOURS`. Prefers the product+menus
 * sentence when params are present; otherwise the current-menu refusal.
 * @param error - Parsed outside-hours error
 * @param t - App translator
 * @returns Localized message
 * @example
 * formatOutsideMenuHoursMessage(
 *   { code: "OUTSIDE_MENU_HOURS", message: null, productName: "Omelette", menuSlugs: ["morning"], liveMenuSlug: "noon" },
 *   (key, opts) => `${key}:${opts?.menus ?? ""}`
 * )
 */
export function formatOutsideMenuHoursMessage(
  error: OutsideMenuHoursError,
  t: MenuHoursTranslateFn
): string {
  const menus = formatMenuSlugLabels(error.menuSlugs, t)
  if (error.productName && menus) {
    return t(MENU_HOURS_NOTICE_KEYS.itemOnlyOn, {
      menus,
      productName: error.productName
    })
  }
  if (error.message && error.message.trim()) {
    return error.message.trim()
  }
  return t(MENU_HOURS_NOTICE_KEYS.notOnCurrentMenu)
}
