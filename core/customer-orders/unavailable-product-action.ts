/**
 * The customer's "if this item is unavailable…" preference (`mw-4-3`, copied
 * verbatim from `mobile-tenant-app`'s `features/orders/utils/unavailableProductAction.ts`).
 *
 * The action union itself is `@/constants`' `UnavailableProductAction`, shared
 * with the backends; what lives here is the label mapping and the row-level
 * decision about whether to show the preference at all. Translation is injected
 * — core holds message keys, never message catalogues.
 */

import type { UnavailableProductAction } from "@/constants"

type TranslateFn = (
  key: string,
  params?: Record<string, string | number>
) => string

/** Same labels as product-detail AvailabilityOptionsSheet dropdown. */
const ACTION_LABEL_KEYS: Record<UnavailableProductAction, string> = {
  call: "tenant-products-detail.callMeAndConfirm",
  remove: "tenant-products-detail.removeFromOrder",
  cancel: "tenant-products-detail.cancelEntireOrder"
}

/**
 * Narrows an unknown payload value to the shared `UnavailableProductAction`.
 * @param value - A raw `unavailableProductAction` field off an order or cart line
 * @returns `true` when the value is one of `remove` / `call` / `cancel`
 */
export function isUnavailableProductAction(
  value: unknown
): value is UnavailableProductAction {
  return value === "remove" || value === "call" || value === "cancel"
}

/**
 * The customer-facing label for an unavailable-product preference.
 *
 * Returns `null` rather than a placeholder for an unrecognised value, so a
 * payload carrying a new action renders nothing instead of raw key text.
 * @param action - A raw preference value, not yet narrowed
 * @param t - Translator supplied by the app; core ships keys, not copy
 * @returns The translated label, or `null` when the value is not an action
 */
export function formatUnavailableProductActionLabel(
  action: unknown,
  t: TranslateFn
): string | null {
  if (!isUnavailableProductAction(action)) {
    return null
  }
  return t(ACTION_LABEL_KEYS[action])
}

/**
 * Checkout / pending order: show only the selected dropdown option text.
 *
 * Currently identical to {@link formatUnavailableProductActionLabel}; it exists
 * as its own call site so the checkout line can diverge from the detail label
 * without touching every caller.
 * @param action - A raw preference value, not yet narrowed
 * @param t - Translator supplied by the app
 * @returns The translated line, or `null` when the value is not an action
 */
export function formatUnavailableProductPreferenceLine(
  action: unknown,
  t: TranslateFn
): string | null {
  return formatUnavailableProductActionLabel(action, t)
}

/**
 * Whether a line should show its unavailable-product preference at all.
 *
 * Add-ons, deals and deal members are excluded: the preference is chosen per
 * product, and a deal's parts cannot be individually removed or substituted.
 * @param item - The order line's addon/deal markers
 * @returns `true` for an ordinary product line
 */
export function shouldShowUnavailableProductPreference(item: {
  isAddon?: boolean
  dealId?: string | null
  isDeal?: boolean
}): boolean {
  if (item.isAddon || item.isDeal || Boolean(item.dealId?.trim())) {
    return false
  }
  return true
}
