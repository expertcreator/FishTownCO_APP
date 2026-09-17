/**
 * The order-placement idempotency key lifecycle (`mw-2-7`).
 *
 * Mirrors mobile's `placementIdempotencyKeyRef`
 * (`ViewCartDetailScreen.tsx:629,2072-2080`): one key per distinct cart, held
 * across retries of the same submission, regenerated only when what would
 * actually be ordered changes. The app keeps the held `{fingerprint, key}`
 * pair in React state, keyed to {@link cartFingerprint}, and calls
 * {@link generateIdempotencyKey} exactly when the fingerprint changes.
 */

import type { CartState } from "../cart/cart-line"

/**
 * A fresh idempotency key for one order-placement submission.
 * @returns A random UUID
 * @example generateIdempotencyKey()
 */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID()
}

/**
 * A fingerprint of what the CART would actually order: every line's id and
 * quantity (order-independent), plus the restaurant and fulfilment mode.
 * Two carts that would place the same order share a fingerprint; anything a
 * visitor could change about what gets ordered changes it.
 *
 * **Cart-only on purpose, not the whole submission.** Mobile's
 * `checkoutPayloadFingerprint` also covers the address, notes and payment
 * method in one string; this function stays scoped to the cart
 * (`build-order-payload.ts` gap task: `cartFingerprint(cart)`) so it can be
 * tested and reasoned about on its own. The caller — `checkout-form.tsx` —
 * is responsible for composing the address id, phone and notes onto this
 * fingerprint before using it to key the held idempotency key: a retry after
 * changing the DELIVERY ADDRESS must mint a fresh key too, or the backend's
 * idempotency reservation replays the first attempt's already-created order
 * against the WRONG address (review finding, mw-2-7).
 * @param cart - The cart being checked out
 * @returns A stable string, equal for two carts that would place the same order
 * @example cartFingerprint(EMPTY_CART) // -> stable for an empty cart
 */
export function cartFingerprint(cart: CartState): string {
  const lines = cart.lines
    .map((line) => `${encodeURIComponent(line.lineId)}:${line.quantity}`)
    .sort()
    .join(",")

  return `${cart.restaurantSlug ?? ""}|${cart.fulfillment ?? ""}|${lines}`
}
