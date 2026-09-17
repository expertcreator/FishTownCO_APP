import type { DaypartMenuSlug } from "@/constants"
import { isDaypartMenuSlug, normalizeMenuSlugs } from "./slugs"

/**
 * Live menu-hours flags returned on cart lines, order rows, product/deal
 * detail, and favorites. Empty `menuSlugs` means the item is all-day.
 */
export type MenuAvailability = {
  available: boolean
  menuSlugs: DaypartMenuSlug[]
  liveMenuSlug: DaypartMenuSlug | null
}

/**
 * Why reorder is blocked. `menu-hours` when `reOrder === false` and
 * `available === false`; `other` is stock / deleted / expired deal.
 */
export type ReorderBlockReason = "none" | "menu-hours" | "other"

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

/**
 * JSON booleans, plus the string/number forms some gateways still emit.
 * @param value - Wire value for `available`
 * @returns Parsed boolean, or `null` when the field is absent or junk
 */
function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value
  }
  if (value === 1 || value === "true") {
    return true
  }
  if (value === 0 || value === "false") {
    return false
  }
  return null
}

function readLiveMenuSlug(value: unknown): DaypartMenuSlug | null {
  if (value == null) {
    return null
  }
  return typeof value === "string" && isDaypartMenuSlug(value) ? value : null
}

/**
 * Catalog `product.available` (in-stock) is not menu-hours. Menu-hours
 * payloads always include `menuSlugs` and/or `liveMenuSlug` next to
 * `available`.
 * @param rec - Candidate object
 * @returns Whether this looks like the shared menu-hours fragment
 */
function hasMenuHoursShape(rec: Record<string, unknown>): boolean {
  return Array.isArray(rec.menuSlugs) || "liveMenuSlug" in rec
}

/**
 * Reads the three menu-hours keys from a payload object.
 * Missing `available` is unknown, not off-menu — older payloads must not
 * block checkout. Unknown slug strings are dropped, not rejected.
 * A lone `available` without `menuSlugs` / `liveMenuSlug` is treated as the
 * older in-stock flag, not menu hours.
 * @param value - Cart line, order, product, deal, or favorite product
 * @returns Parsed flags, or `null` when menu-hours keys are not present
 * @example
 * readMenuAvailability({ available: false, menuSlugs: ["morning"], liveMenuSlug: "noon" })
 * // { available: false, menuSlugs: ["morning"], liveMenuSlug: "noon" }
 */
export function readMenuAvailability(value: unknown): MenuAvailability | null {
  const rec = asRecord(value)
  if (!(rec && hasMenuHoursShape(rec))) {
    return null
  }
  const available = coerceBoolean(rec.available)
  if (available == null) {
    return null
  }

  return {
    available,
    liveMenuSlug: readLiveMenuSlug(rec.liveMenuSlug),
    menuSlugs: normalizeMenuSlugs(rec.menuSlugs)
  }
}

/**
 * Ticket shape: flags on the detail `data` object and on nested `product`.
 * Also reads a cart line / favorite row that already is that fragment.
 * @param value - Inner `data`, `{ data }`, cart line, or favorite row
 * @returns First parsed menu-hours fragment, or `null`
 * @example
 * readMenuAvailabilityDeep({ product: { available: false, menuSlugs: [], liveMenuSlug: null } })
 * // { available: false, menuSlugs: [], liveMenuSlug: null }
 */
export function readMenuAvailabilityDeep(
  value: unknown
): MenuAvailability | null {
  const rec = asRecord(value)
  const data = asRecord(rec?.data)
  const candidates: unknown[] = [rec, rec?.product, data, data?.product]
  for (const candidate of candidates) {
    const parsed = readMenuAvailability(candidate)
    if (parsed) {
      return parsed
    }
  }
  return null
}

/**
 * Prefers a live fetch over a cart snapshot taken at add time.
 * @param live - Fresh product/deal/cart payload
 * @param snapshot - Stored line flags
 * @returns Live flags when readable, otherwise the snapshot
 * @example
 * pickLiveMenuAvailability({ available: false, menuSlugs: ["morning"], liveMenuSlug: "noon" }, null)
 * // { available: false, menuSlugs: ["morning"], liveMenuSlug: "noon" }
 */
export function pickLiveMenuAvailability(
  live: unknown,
  snapshot: unknown
): MenuAvailability | null {
  return readMenuAvailabilityDeep(live) ?? readMenuAvailability(snapshot)
}

/**
 * Menu-time only. `true` when the item is off the live branch menu.
 * @param value - Payload carrying `available`
 * @returns `true` when `available === false`
 * @example
 * isOffMenu({ available: false, menuSlugs: ["morning"], liveMenuSlug: "noon" }) // true
 */
export function isOffMenu(value: unknown): boolean {
  return readMenuAvailabilityDeep(value)?.available === false
}

/**
 * Whether any cart/order line is off the live menu.
 * @param lines - Cart lines or order items
 * @returns `true` when at least one line has `available === false`
 * @example
 * cartHasOffMenuLines([{ available: true }, { available: false }]) // true
 */
export function cartHasOffMenuLines(lines: readonly unknown[]): boolean {
  return lines.some(isOffMenu)
}

/**
 * Disable checkout when any selected line is off-menu.
 * @param lines - Selected cart lines for a branch
 * @returns `true` when checkout must not run
 * @example
 * shouldDisableCheckout([{ available: false, menuSlugs: ["morning"], liveMenuSlug: "noon" }]) // true
 */
export function shouldDisableCheckout(lines: readonly unknown[]): boolean {
  return cartHasOffMenuLines(lines)
}

/**
 * Disable add-to-cart / add-deal when detail or favorite `available` is false.
 * @param value - Product/deal detail or favorite product payload
 * @returns `true` when add must not run
 * @example
 * shouldDisableAddToCart({ available: false, menuSlugs: ["dinner"], liveMenuSlug: "noon" }) // true
 */
export function shouldDisableAddToCart(value: unknown): boolean {
  return isOffMenu(value)
}

/**
 * Reads `reOrder` from an order or `{ data: { reOrder } }` envelope.
 * @param order - Order list row or detail payload
 * @returns The boolean flag, or `null` when the field is absent
 * @example
 * readReorderFlag({ reOrder: false }) // false
 */
export function readReorderFlag(order: unknown): boolean | null {
  const rec = asRecord(order)
  if (!rec) {
    return null
  }
  const nested = asRecord(rec.data)
  const value = nested?.reOrder ?? rec.reOrder
  return typeof value === "boolean" ? value : null
}

/**
 * Full reorder eligibility. The API forces `reOrder` false when any line is
 * off-menu, out of stock, deleted, or outside a deal window.
 * @param order - Order list row or detail payload
 * @returns `true` when the reorder button must stay disabled
 * @example
 * shouldDisableReorder({ reOrder: false }) // true
 */
export function shouldDisableReorder(order: unknown): boolean {
  return readReorderFlag(order) === false
}

/**
 * Distinguishes menu-time from every other reorder refusal.
 * @param order - Order list row or detail payload
 * @returns `menu-hours` when both flags say off-menu, otherwise `other` or `none`
 * @example
 * resolveReorderBlockReason({ reOrder: false, available: false }) // "menu-hours"
 */
export function resolveReorderBlockReason(order: unknown): ReorderBlockReason {
  if (!shouldDisableReorder(order)) {
    return "none"
  }
  return isOffMenu(order) ? "menu-hours" : "other"
}

/**
 * Whether reorder is blocked specifically by menu hours.
 * @param order - Order list row or detail payload
 * @returns `true` when `reOrder === false` and `available === false`
 * @example
 * isReorderBlockedByMenuHours({ reOrder: false, available: true }) // false
 */
export function isReorderBlockedByMenuHours(order: unknown): boolean {
  return resolveReorderBlockReason(order) === "menu-hours"
}
