/**
 * The cart's money math, delegated to `calculatePricing` (`@/constants`).
 *
 * **A separate module from `cart-line.ts`, and the split is the point**
 * (ledger M-012): `cart-line.ts` is imported by client leaves on every route
 * (the item overlay, the view-cart bar, the floating stack) and stays
 * zero-dependency so none of them drags `@/constants` — and zod behind it —
 * into every page's first-load JS. Only the cart totals panel imports THIS
 * file, so the engine's bytes are paid exactly where its rows render.
 *
 * **The hardcodes are gone** (`mw-4-2`). `mw-2-2` priced every cart with
 * `addTaxEnabled: false` and the branch's flat captured fee, because tax and
 * distance config were not publicly readable. They are: the branch's effective
 * rule is captured into the cart at add time, and the resolution that turns it
 * into a config is `@/core/pricing`'s — copied from mobile's cart screen, so the
 * two apps quote the same number.
 *
 * **`platformFee: 0` stays, and it is the one deliberate understatement left.**
 * The public rule returns a platform fee unconditionally, but the server applies
 * it only when the tenant does not sell `pos`-only **and** that tenant's
 * `PLATFORM_FEE_SETTLEMENT` flag is on (`orderService.ts:2025-2043`) — neither
 * fact is publicly readable, so quoting the amount would overstate the total for
 * every tenant the flag is off for. Overstating is worse than understating.
 *
 * **`addTaxEnabled` is resolved from the rate, not from a flag read.**
 * `getTaxRatesForCountry` returns zeros when the `ADD_TAX` marketplace flag is
 * off, so a positive `taxRateCash` **is** the flag as far as a public client can
 * observe it.
 */

import {
  calculatePricing,
  DEFAULT_COUNTRY,
  type OrderFulfillment,
  type PaymentMethod,
  type PricingCalculationResult
} from "@/constants"
import type { Coordinates } from "../pricing/delivery-rule"
import {
  buildBranchPricingConfig,
  minimumOrderGate,
  resolveBranchPricing
} from "../pricing"
import { type CartState, cartSubtotal, cartToPricingItems } from "./cart-line"

/**
 * The country every branch on this marketplace trades in.
 *
 * `DEFAULT_COUNTRY` rather than a local `"PK"`: the same constant the HTTP
 * transport picks a rule row with, so the country a fee was configured for and
 * the country the engine falls back on cannot drift apart. Not a capture — the
 * catalog contract carries no country member, and the rule resolves
 * server-side for the tenant's own country anyway. It only reaches the engine
 * as the fallback fee/tax table for a cart that resolved neither.
 */
const CART_COUNTRY = DEFAULT_COUNTRY

/**
 * The fulfilment modes that do NOT charge delivery.
 *
 * `satisfies readonly OrderFulfillment[]` is the guard, and that type is
 * `(typeof ORDER_FULFILLMENT)[number]` — so this list is bound to the shared
 * enum in both directions. Removing a member fails the typecheck; ADDING one (a
 * future `drive_thru`) leaves it off this list and therefore DELIVERING, so a
 * real fee is still quoted rather than silently zeroed. Stated as the exception
 * list for exactly that reason — the `!== "delivery" && !== "hybrid"` form it
 * replaces had the unsafe default.
 */
const NON_DELIVERING = ["pickup"] as const satisfies readonly OrderFulfillment[]

/**
 * What the surface knows that the cart does not: where it is being delivered
 * and how it will be paid for.
 *
 * Both are absent on `/cart`, which is why they are optional rather than
 * required — the cart page quotes the branch's own fee, and the distance-derived
 * one only becomes knowable once an address is chosen.
 */
export interface CartPricingContext {
  /** The chosen delivery address's pin, or `null` while none is chosen. */
  readonly deliveryAddress?: Coordinates | null
  /**
   * The chosen payment method. Read **only** when the branch published no tax
   * rate, in which case the engine falls back to the country table's cash/card
   * split; a rule's `taxRateCash` overrides it.
   */
  readonly paymentMethod?: PaymentMethod
}

/**
 * Whether this cart is collected rather than delivered.
 *
 * Read from {@link NON_DELIVERING}, never open-coded. A `null`
 * fulfilment — a cart saved before the capture existed — is NOT pickup: assuming
 * it were would zero a delivery fee the visitor is going to be charged.
 * @param cart - The cart
 * @returns `true` when no delivery fee should be quoted at all
 */
function isPickupCart(cart: CartState): boolean {
  return (
    cart.fulfillment !== null &&
    (NON_DELIVERING as readonly OrderFulfillment[]).includes(cart.fulfillment)
  )
}

/**
 * Prices the cart through the shared engine, or answers `null` for a legacy
 * cart that captured neither its branch's delivery fee nor its rule — the
 * caller renders subtotal-plus-disclaimer instead of fabricating fee rows.
 * @param cart - The cart
 * @param context - The chosen address and payment method, where a surface has them
 * @returns The engine's breakdown, or `null` when no fee could be resolved honestly
 * @example cartPricing(cart)?.total // -> 1010
 */
export function cartPricing(
  cart: CartState,
  context?: CartPricingContext
): PricingCalculationResult | null {
  if (cart.deliveryFee === null && cart.deliveryRule === null) {
    return null
  }

  const resolved = resolveBranchPricing(
    {
      capturedDeliveryFee: cart.deliveryFee ?? undefined,
      // Web captures no per-branch tax rate — the rule carries it, and a cart
      // with no rule has no tax to charge. Present because the copied
      // resolution reads it, and because a later capture would land here.
      capturedTaxRate: undefined,
      // Likewise: the public catalog publishes no free-delivery flag, so this
      // is the rule's own free-delivery threshold's job, not a branch flag's.
      hasFreeDelivery: false,
      isPickup: isPickupCart(cart),
      subtotal: cartSubtotal(cart)
    },
    {
      branchCoordinates: cart.branchCoordinates,
      deliveryAddressCoords: context?.deliveryAddress ?? null,
      rule: cart.deliveryRule ?? undefined
    }
  )

  // The `mw-2-2` invariant, restated one layer down: an OMITTED `deliveryFee`
  // sends the engine to its country-default distance fallback, and
  // `COUNTRY_FEE_CONFIG.PK.defaultDeliveryFee` is 0 — so a cart that resolved
  // no fee at all would render a fabricated free delivery. The early guard
  // above catches "nothing was ever captured"; this catches the other case, a
  // cart holding a rule but no flat fee and no address to measure against.
  // Both degrade to subtotal-plus-disclaimer, which is the honest answer.
  if (resolved.deliveryFeeConfig.deliveryFee === undefined) {
    return null
  }

  return calculatePricing(cartToPricingItems(cart), {
    ...buildBranchPricingConfig({
      addTaxEnabled: resolved.taxRate !== undefined && resolved.taxRate > 0,
      cartCountry: CART_COUNTRY,
      checkoutPaymentMethod: context?.paymentMethod ?? "cash",
      resolved,
      selectedAddress: context?.deliveryAddress ?? null
    }),
    platformFee: 0
  })
}

/**
 * How far the cart is below the branch's minimum order, or `null` when there
 * is no captured minimum, the minimum is already met, or the cart is empty.
 * @param cart - The cart
 * @returns The missing amount, or `null`
 * @example minimumOrderShortfall(cart) // -> 200
 */
export function minimumOrderShortfall(cart: CartState): number | null {
  const gate = minimumOrderGate(
    cart.minimumOrder,
    cartSubtotal(cart),
    cart.lines.length
  )

  return gate.status === "below" ? gate.shortfall : null
}
