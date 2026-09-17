/**
 * Assembles the `POST discovery/api/v1/orders` request body from checkout
 * state (`mw-2-7`) — the confirmed core gap `mw-4-2`/`mw-4-3` left open:
 * request/response *types* were ported (`mw-4-3`) and the pricing
 * config/gate layer landed (`mw-4-2`), but nothing ever assembled a
 * {@link CreateOrderRequest}.
 *
 * **No totals.** `deliveryFee`/`tax`/`platformFee`/`total` are never in the
 * payload — the backend computes all money server-side, which is what keeps
 * web and mobile totals identical by construction rather than by duplicated
 * math (`orderValidation.ts`'s `placeOrderBodySchema` does not even declare
 * those fields as accepted input for THIS story's fields).
 *
 * Mirrors mobile's payload assembly
 * (`ViewCartDetailScreen.tsx:2072-2117`), adapted to the no-client-totals
 * contract and to a single-restaurant cart: mobile groups multiple branches
 * into several `orders[]` entries; web checkout receives one restaurant's
 * `selectedCart` (`cart/selection.ts`), so exactly one entry is ever built
 * here.
 *
 * The `CreateOrderRequest` type (`./types.ts`) is a verbatim mobile port and
 * does not declare `modifierSelections` on an item, but the backend's
 * `orderItemSchema` does (`Boundaries`: "productId+inventoryId or dealId,
 * quantity, selections/modifierSelections/addons"). The cast below is the
 * one place that gap is bridged — building the field the wire actually reads
 * without redefining the ported type, which the domain's own rule forbids.
 */

import type { CartLine, CartState } from "../cart/cart-line"
import type { CheckoutDraft } from "../checkout/draft"
import {
  composePakistanE164,
  DEFAULT_CHECKOUT_COUNTRY
} from "../checkout/phone"
import type { SavedAddress } from "../checkout/schemas"
import type { CreateOrderRequest } from "./types"

/** One non-deal order item, as the backend's `orderItemSchema` reads it. */
type OrderItemPayload = CreateOrderRequest["orders"][number]["items"][number]

/**
 * One cart line as an order item, or `null` when it cannot be ordered.
 *
 * `inventoryId` is nullable on {@link CartLine} until checkout re-validates
 * against a fresh item fetch (`cart-line.ts`'s own docblock) — a gap
 * `be-3-1a` (2026-08-31) closed for every line added since, but a cart
 * persisted before that still carries `null`. Mobile drops such a line with
 * a toast (`ViewCartDetailScreen.tsx:1794`); this pure function has no
 * toast, so it only drops the line — the app layer decides what, if
 * anything, to tell the visitor about a shrunk order. Not exercised by this
 * story's I/O matrix, which assumes a post-`be-3-1a` cart throughout.
 * @param line - The cart line to convert
 * @returns The order item, or `null` when it lacks an inventory row
 */
function buildOrderItem(line: CartLine): OrderItemPayload | null {
  if (line.inventoryId === null) {
    return null
  }

  // An addon missing its own inventory row (the same `be-3-1a` gap, one
  // level down) is dropped rather than sent as an invalid uuid — filtered
  // BEFORE the length check below, so a line whose every addon was dropped
  // omits `addons` entirely instead of sending `addons: []`.
  const addons = line.addons
    .filter((addon) => addon.inventoryId !== null)
    .map((addon) => ({
      productId: addon.productId,
      inventoryId: addon.inventoryId as string,
      // Addon order quantity is the line's quantity (`cart-line.ts`).
      quantity: line.quantity
    }))

  return {
    productId: line.productId,
    inventoryId: line.inventoryId,
    quantity: line.quantity,
    ...(line.modifierSelections.length > 0
      ? {
          modifierSelections: line.modifierSelections.map((group) => ({
            variantId: group.variantId,
            selectedOptions: group.selectedOptions.map((option) => ({
              optionId: option.optionId
            }))
          }))
        }
      : {}),
    ...(addons.length > 0 ? { addons } : {})
  } as OrderItemPayload
}

/**
 * Composes `customerPhone` from the draft, or `undefined` for nothing typed.
 *
 * PK-only, `phone.ts`'s own scope: `composePakistanE164` is what this
 * package offers for the app's one special-cased country. A non-PK draft
 * (unreachable today — checkout only collects PK contacts) falls back to the
 * raw national number, which still matches the backend's character-class
 * regex even though it carries no country prefix.
 * @param draft - The checkout draft
 * @returns The E.164 phone, or `undefined`
 */
function composeCustomerPhone(draft: CheckoutDraft): string | undefined {
  const nsn = draft.mobileNumber.trim()

  if (nsn === "") {
    return undefined
  }

  return draft.countryCode.toUpperCase() === DEFAULT_CHECKOUT_COUNTRY
    ? composePakistanE164(nsn)
    : nsn
}

/**
 * Assembles the order-placement request body.
 *
 * `addressId` is included only when the order is not pickup AND an address
 * was actually selected — the matrix's pickup row ("addressId omitted from
 * payload") and the ordinary "no address chosen yet" case collapse to the
 * same omission. `paymentMethod` is fixed to `"cash"`: COD is the only
 * method this build supports.
 * @param cart - The single-restaurant cart being checked out
 * @param draft - The checkout draft — contact, notes, chosen address id
 * @param address - The selected saved address, or `null`
 * @param idempotencyKey - This submission's key (`generateIdempotencyKey`)
 * @returns The request body for `POST discovery/api/v1/orders`
 * @example buildOrderPayload(cart, draft, address, key).paymentMethod // -> "cash"
 */
export function buildOrderPayload(
  cart: CartState,
  draft: CheckoutDraft,
  address: SavedAddress | null,
  idempotencyKey: string
): CreateOrderRequest {
  const fulfillmentType =
    cart.fulfillment === "pickup" ? "takeaway" : "delivery"
  const items = cart.lines
    .map(buildOrderItem)
    .filter((item): item is NonNullable<typeof item> => item !== null)
  const customerPhone = composeCustomerPhone(draft)
  const deliveryInstructions = draft.notes.trim()

  return {
    ...(fulfillmentType === "delivery" && address !== null
      ? { addressId: address.id }
      : {}),
    ...(customerPhone === undefined ? {} : { customerPhone }),
    ...(deliveryInstructions === "" ? {} : { deliveryInstructions }),
    idempotencyKey,
    orders: [
      {
        // Named `tenantId` on the cart (captured verbatim from
        // `RestaurantDetail.id`, `transport.ts`'s own docblock) but IS the
        // branch id the order API wants — this marketplace has one branch
        // per restaurant record, so the two never diverge.
        branchId: cart.tenantId ?? "",
        fulfillmentType,
        items
      }
    ],
    paymentMethod: "cash"
  } as CreateOrderRequest
}

/**
 * Whether the assembled payload actually has anything to place.
 *
 * `buildOrderItem` drops any line whose `inventoryId` is still `null` — a
 * cart persisted before `be-3-1a` (2026-08-31) closed that gap. When every
 * line in a single-restaurant cart drops, `orders[0].items` comes out `[]`,
 * which the backend's `orderItemSchema`/`branchOrderSchema` would reject
 * with `AT_LEAST_ONE_ITEM_REQUIRED` — a doomed round trip for a condition
 * this module can already see locally. `place-order.ts` checks this before
 * calling the upstream at all, and reuses the existing `"no-valid-orders"`
 * outcome: from the visitor's side, "the backend rejected every line" and
 * "every line was already stale" read the same — "review your cart, items
 * may have changed since you added them."
 * @param request - The assembled request body
 * @returns `false` when no order in the payload has any items
 * @example orderHasItems(buildOrderPayload(cart, draft, address, key))
 */
export function orderHasItems(request: CreateOrderRequest): boolean {
  return request.orders.some((order) => order.items.length > 0)
}
