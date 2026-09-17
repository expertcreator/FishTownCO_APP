/**
 * Which cart lines checkout takes.
 *
 * Mobile's rule, kept exactly (`CartScreen.tsx` line checkboxes plus
 * `cartStore.ts`'s `selectedItemIds`): a selection is one restaurant at a time,
 * and checking a line under another restaurant moves it rather than widening it
 * (D3). One order is one restaurant, so a selection that spanned two could
 * never be checked out.
 *
 * Selection is transient by design (D2). These functions are pure; the app puts
 * the result in `sessionStorage`.
 */

import { type CartState, EMPTY_CART } from "./cart-line"
import { type CartsState, cartFor } from "./carts"

/**
 * The checked lines, all from one restaurant.
 *
 * Invariant: `restaurantSlug` is `null` exactly when `lineIds` is empty.
 */
export interface CartSelection {
  readonly restaurantSlug: string | null
  readonly lineIds: readonly string[]
}

/** Nothing checked. */
export const EMPTY_SELECTION: CartSelection = {
  lineIds: [],
  restaurantSlug: null
}

/**
 * Checks or unchecks one line (D3).
 *
 * Checking a line under another restaurant moves the whole selection there.
 * Unchecking a line under a restaurant that is not the selected one changes
 * nothing, which is what a stale checkbox click on a re-rendered page does.
 * @param sel - The current selection
 * @param restaurantSlug - The restaurant the line belongs to
 * @param lineId - The line
 * @param checked - Its new checkbox state
 * @returns The next selection
 * @example toggleLine(EMPTY_SELECTION, "kfc", "l1", true).lineIds // -> ["l1"]
 */
export function toggleLine(
  sel: CartSelection,
  restaurantSlug: string,
  lineId: string,
  checked: boolean
): CartSelection {
  if (checked) {
    return selectAdded(sel, restaurantSlug, lineId)
  }

  if (sel.restaurantSlug !== restaurantSlug) {
    return sel
  }

  const lineIds = sel.lineIds.filter((id) => id !== lineId)

  return lineIds.length === 0 ? EMPTY_SELECTION : { lineIds, restaurantSlug }
}

/**
 * The group header checkbox (D3): checks a whole restaurant's cart, or clears
 * the selection when it is unchecked.
 * @param sel - The current selection
 * @param carts - Every cart
 * @param restaurantSlug - The restaurant whose header was clicked
 * @param checked - Its new checkbox state
 * @returns The next selection
 * @example toggleRestaurant(sel, carts, "kfc", true).lineIds.length // -> that cart's lines
 */
export function toggleRestaurant(
  sel: CartSelection,
  carts: CartsState,
  restaurantSlug: string,
  checked: boolean
): CartSelection {
  if (!checked) {
    return sel.restaurantSlug === restaurantSlug ? EMPTY_SELECTION : sel
  }

  const lineIds = cartFor(carts, restaurantSlug).lines.map(
    (line) => line.lineId
  )

  return lineIds.length === 0 ? EMPTY_SELECTION : { lineIds, restaurantSlug }
}

/**
 * Auto-checks a line the visitor just added from the item overlay (D3), mobile's
 * `selectAddedCartItem`.
 *
 * Adding from a second restaurant moves the selection, which is the same rule
 * {@link toggleLine} applies to a checkbox and the reason the overlay needs no
 * confirm-replace step any more.
 * @param sel - The current selection
 * @param restaurantSlug - The restaurant the added line belongs to
 * @param lineId - The added line
 * @returns The next selection
 * @example selectAdded(EMPTY_SELECTION, "kfc", "l1").restaurantSlug // -> "kfc"
 */
export function selectAdded(
  sel: CartSelection,
  restaurantSlug: string,
  lineId: string
): CartSelection {
  if (sel.restaurantSlug !== restaurantSlug) {
    return { lineIds: [lineId], restaurantSlug }
  }

  return sel.lineIds.includes(lineId)
    ? sel
    : { lineIds: [...sel.lineIds, lineId], restaurantSlug }
}

/**
 * Drops checked lines that are no longer in the cart.
 *
 * Run after every cart change (mobile runs the same effect at
 * `CartScreen.tsx:970`): a quantity set to zero, a removed line or a whole cart
 * dropped would otherwise leave checkout counting lines nobody can order.
 * @param sel - The current selection
 * @param carts - Every cart
 * @returns The selection with only lines that still exist
 * @example pruneSelection(sel, EMPTY_CARTS) // -> EMPTY_SELECTION
 */
export function pruneSelection(
  sel: CartSelection,
  carts: CartsState
): CartSelection {
  if (sel.restaurantSlug === null) {
    return EMPTY_SELECTION
  }

  const cart = cartFor(carts, sel.restaurantSlug)
  const lineIds = sel.lineIds.filter((id) =>
    cart.lines.some((line) => line.lineId === id)
  )

  return lineIds.length === 0
    ? EMPTY_SELECTION
    : { lineIds, restaurantSlug: sel.restaurantSlug }
}

/**
 * The selection to act on: pruned, and defaulted to the whole cart when there
 * is exactly one.
 *
 * A visitor with a single restaurant in their cart never has to tick anything,
 * which is also what keeps every one-cart flow behaving as it did before this
 * feature. With several carts and nothing ticked the answer stays empty, and
 * the checkout button stays disabled, because guessing which restaurant is
 * meant would place the wrong order.
 * @param sel - The current selection
 * @param carts - Every cart
 * @returns The effective selection
 * @example effectiveSelection(EMPTY_SELECTION, oneCart).lineIds.length // -> that cart's lines
 */
export function effectiveSelection(
  sel: CartSelection,
  carts: CartsState
): CartSelection {
  const pruned = pruneSelection(sel, carts)

  if (pruned.restaurantSlug !== null || carts.carts.length !== 1) {
    return pruned
  }

  const sole = carts.carts[0]

  return sole.restaurantSlug === null
    ? pruned
    : toggleRestaurant(pruned, carts, sole.restaurantSlug, true)
}

/**
 * The cart checkout consumes: one restaurant's cart with only the selected
 * lines in it.
 *
 * Every restaurant field is kept, so pricing, the coverage check and the order
 * payload read the same branch facts they always did (D1).
 *
 * Takes the selection as given rather than applying
 * {@link effectiveSelection} itself, so a caller cannot get a cart it did not
 * ask for; the cart page passes an effective selection in.
 * @param carts - Every cart
 * @param sel - The effective selection
 * @returns The cart to check out, or {@link EMPTY_CART}
 * @example selectedCart(carts, EMPTY_SELECTION) // -> EMPTY_CART
 */
export function selectedCart(carts: CartsState, sel: CartSelection): CartState {
  if (sel.restaurantSlug === null) {
    return EMPTY_CART
  }

  const cart = cartFor(carts, sel.restaurantSlug)

  return {
    ...cart,
    lines: cart.lines.filter((line) => sel.lineIds.includes(line.lineId))
  }
}

/**
 * Narrows unknown persisted state to a selection, degrading to
 * {@link EMPTY_SELECTION}.
 *
 * A selection is cheap to lose, so anything unreadable becomes nothing checked
 * rather than a guess. {@link pruneSelection} still has to run against the
 * carts afterwards: this only proves the shape.
 * @param raw - Whatever `JSON.parse` produced, of unknown shape
 * @returns The selection, or the empty one
 * @example readSelectionState(null) // -> EMPTY_SELECTION
 */
export function readSelectionState(raw: unknown): CartSelection {
  if (raw === null || typeof raw !== "object") {
    return EMPTY_SELECTION
  }

  const candidate = raw as Partial<CartSelection>

  if (
    typeof candidate.restaurantSlug !== "string" ||
    candidate.restaurantSlug === "" ||
    !Array.isArray(candidate.lineIds)
  ) {
    return EMPTY_SELECTION
  }

  const lineIds = candidate.lineIds.filter((id) => typeof id === "string")

  return lineIds.length === 0
    ? EMPTY_SELECTION
    : { lineIds, restaurantSlug: candidate.restaurantSlug }
}
