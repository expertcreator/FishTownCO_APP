/**
 * Every restaurant's guest cart, one {@link CartState} per restaurant.
 *
 * Mobile keeps one flat `items[]` tagged with `restaurantId`
 * (`features/cart/store/cartStore.ts`) and groups it for display. Web keeps the
 * groups themselves, because every checkout consumer downstream
 * (`core/pricing`, `core/customer-orders/build-order-payload.ts`, the totals
 * panel) already takes one `CartState` and keeps its signature that way.
 *
 * **Core-first and zero-dependency**, for the reason `cart-line.ts`'s header
 * states: this module is reached from the floating badge on every route's first
 * load, so it imports nothing but its sibling.
 */

import {
  addLine,
  type CartLine,
  cartItemCount,
  type CartRestaurantRef,
  type CartState,
  EMPTY_CART,
  readCartState,
  setLineQuantity
} from "./cart-line"

/**
 * Every restaurant's cart, in first-add order.
 *
 * Two invariants hold everywhere below: no entry is ever an empty cart, and no
 * two entries share a `restaurantSlug`.
 */
export interface CartsState {
  readonly carts: readonly CartState[]
}

/** No carts at all, and what unreadable persisted state degrades to. */
export const EMPTY_CARTS: CartsState = { carts: [] }

/**
 * One restaurant's cart, or the empty one when it has none.
 *
 * This is what makes a cart same-restaurant-or-empty by construction, which is
 * why {@link addLine} needs no conflict rule of its own.
 * @param carts - Every cart
 * @param restaurantSlug - The restaurant to read
 * @returns Its cart, or {@link EMPTY_CART}
 * @example cartFor(EMPTY_CARTS, "kfc") === EMPTY_CART // -> true
 */
export function cartFor(carts: CartsState, restaurantSlug: string): CartState {
  return (
    carts.carts.find((cart) => cart.restaurantSlug === restaurantSlug) ??
    EMPTY_CART
  )
}

/**
 * Replaces, or appends, one restaurant's cart, and drops it when it has no
 * lines left.
 *
 * The slug is passed rather than read off `cart`: {@link setLineQuantity}
 * returns {@link EMPTY_CART} when it empties a cart, and an empty cart has
 * forgotten which restaurant it belonged to.
 * @param carts - Every cart
 * @param restaurantSlug - The restaurant the cart belongs to
 * @param cart - Its next state
 * @returns The next carts, order preserved
 * @example upsertCart(carts, "kfc", EMPTY_CART).carts.length // -> one fewer
 */
export function upsertCart(
  carts: CartsState,
  restaurantSlug: string,
  cart: CartState
): CartsState {
  if (cart.lines.length === 0) {
    return {
      carts: carts.carts.filter(
        (entry) => entry.restaurantSlug !== restaurantSlug
      )
    }
  }

  const held = carts.carts.some(
    (entry) => entry.restaurantSlug === restaurantSlug
  )

  return {
    carts: held
      ? carts.carts.map((entry) =>
          entry.restaurantSlug === restaurantSlug ? cart : entry
        )
      : [...carts.carts, cart]
  }
}

/**
 * Adds one line to its restaurant's cart, creating that cart on the first add.
 *
 * The one write path for adding: it is what guarantees a line only ever reaches
 * a cart that is already its own restaurant's or empty.
 * @param carts - Every cart
 * @param restaurant - The restaurant the line belongs to
 * @param line - The line to add
 * @returns The next carts
 * @example addCartLine(EMPTY_CARTS, ref, line).carts.length // -> 1
 */
export function addCartLine(
  carts: CartsState,
  restaurant: CartRestaurantRef,
  line: CartLine
): CartsState {
  return upsertCart(
    carts,
    restaurant.restaurantSlug,
    addLine(cartFor(carts, restaurant.restaurantSlug), restaurant, line)
  )
}

/**
 * Sets one line's quantity; `0` removes the line, and an emptied cart is
 * dropped.
 * @param carts - Every cart
 * @param restaurantSlug - The restaurant whose line changes
 * @param lineId - The line to change
 * @param quantity - The new quantity, clamped by `setLineQuantity`
 * @returns The next carts
 * @example setCartLineQuantity(carts, "kfc", id, 0) // -> without that line
 */
export function setCartLineQuantity(
  carts: CartsState,
  restaurantSlug: string,
  lineId: string,
  quantity: number
): CartsState {
  return upsertCart(
    carts,
    restaurantSlug,
    setLineQuantity(cartFor(carts, restaurantSlug), lineId, quantity)
  )
}

/**
 * Removes the named lines from one restaurant's cart, dropping the cart when
 * nothing is left.
 *
 * What a placed order leaves behind (D5): the ordered lines go, everything the
 * backend did not take stays.
 * @param carts - Every cart
 * @param restaurantSlug - The restaurant that was ordered from
 * @param lineIds - The lines to remove; unknown ids are ignored
 * @returns The next carts
 * @example removeLines(carts, "kfc", [id]).carts.length // -> unchanged or one fewer
 */
export function removeLines(
  carts: CartsState,
  restaurantSlug: string,
  lineIds: readonly string[]
): CartsState {
  const cart = cartFor(carts, restaurantSlug)

  return upsertCart(carts, restaurantSlug, {
    ...cart,
    lines: cart.lines.filter((line) => !lineIds.includes(line.lineId))
  })
}

/** How many units every cart holds together, for the global badge (D6). */
export function cartsItemCount(carts: CartsState): number {
  return carts.carts.reduce((count, cart) => count + cartItemCount(cart), 0)
}

/**
 * Narrows unknown persisted state to every cart, degrading to
 * {@link EMPTY_CARTS}.
 *
 * Reads the `v2` shape and a `v1` single-cart blob alike (D8): anything without
 * a `carts` array is offered to {@link readCartState} whole, so the visitor who
 * had one cart before this feature keeps it. Each entry is validated by that
 * function; an unreadable entry drops rather than taking the rest with it, and
 * a repeated restaurant keeps the first entry.
 *
 * Hand-written rather than zod for the byte reason `cart-line.ts` documents.
 * @param raw - Whatever `JSON.parse` produced, of unknown shape
 * @returns Every readable cart
 * @example readCartsState(null) // -> EMPTY_CARTS
 */
export function readCartsState(raw: unknown): CartsState {
  if (raw === null || typeof raw !== "object") {
    return EMPTY_CARTS
  }

  const persisted = (raw as { carts?: unknown }).carts
  const entries = Array.isArray(persisted) ? persisted : [raw]
  const carts: CartState[] = []

  for (const entry of entries) {
    const cart = readCartState(entry)

    if (
      cart.restaurantSlug !== null &&
      !carts.some((held) => held.restaurantSlug === cart.restaurantSlug)
    ) {
      carts.push(cart)
    }
  }

  return { carts }
}
