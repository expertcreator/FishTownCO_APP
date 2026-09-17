/**
 * Reopening a stored cart line as a selection — the `mw-2-2` edit path.
 *
 * **Its own module, and the split is the point** (ledger M-012): `cart-line.ts`
 * is reached from the root layout's floating stack, so everything defined there
 * ships in the chunk EVERY route pays for — measured at +0.6 KB gzipped on
 * `/privacy`, a page with no cart UI at all, when this function lived there.
 * Only the item overlay reverse-maps a line, so only the overlay's chunk should
 * carry the code that does it.
 *
 * Both imports are type-only and erase at build, so this file adds no runtime
 * edge back to the cart.
 */

import type { CartLine, CartableItem } from "../cart/cart-line"
import type { ItemSelection } from "./item-selection"

/**
 * The selection a stored cart line reopens the overlay with.
 *
 * Reverse-maps the line's identity onto the item **as it is offered today**:
 * the stored `combinationId` recovers the single-select options, and the
 * stored modifier option ids and add-on link ids are kept only where the item
 * still offers them. Anything the menu has since withdrawn is silently
 * dropped — the matrix's "prefill valid remainder" — and `lineProblems` gates
 * the save exactly as it gates any add.
 * @param item - The item as the proxy answers it now
 * @param line - The stored cart line being edited
 * @returns The prefilled selection
 * @example selectionFromLine(item, line).options // -> { "variant-size": "size-small" }
 */
export function selectionFromLine(
  item: CartableItem,
  line: CartLine
): ItemSelection {
  const options: Record<string, string> = {}
  const combination = item.combinations.find(
    (entry) => entry.id === line.combinationId
  )

  if (combination !== undefined) {
    const singleVariantIds = new Set(
      item.variants
        .filter((variant) => variant.selectionType !== "multiple")
        .map((variant) => variant.id)
    )

    for (const option of combination.options) {
      if (singleVariantIds.has(option.variantId)) {
        options[option.variantId] = option.id
      }
    }
  }

  const modifiers: Record<string, readonly string[]> = {}

  for (const group of line.modifierSelections) {
    const variant = item.variants.find(
      (entry) =>
        entry.id === group.variantId && entry.selectionType === "multiple"
    )

    if (variant === undefined) {
      continue
    }

    const kept = group.selectedOptions
      .map((option) => option.optionId)
      .filter((optionId) =>
        variant.options.some((option) => option.id === optionId)
      )

    if (kept.length > 0) {
      modifiers[variant.id] = kept
    }
  }

  const addonIds = line.addons
    .map((addon) => addon.addonId)
    .filter((addonId) => item.addons.some((addon) => addon.id === addonId))

  return { addonIds, modifiers, options }
}
