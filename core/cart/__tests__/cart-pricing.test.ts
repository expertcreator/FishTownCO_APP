import { describe, expect, it } from "vitest"
import type { TenantDeliveryChargeRule } from "../../pricing/delivery-rule"
import {
  addLine,
  buildCartLine,
  type CartableItem,
  type CartRestaurantRef,
  EMPTY_CART
} from "../cart-line"
import { cartPricing, minimumOrderShortfall } from "../cart-pricing"

/** A plain item priced so one line of two lands on the matrix's Rs 940. */
const PLAIN: CartableItem = {
  addons: [],
  basePrice: 470,
  combinations: [],
  id: "product-plain",
  imageUrl: null,
  inventoryId: "inv-plain",
  key: "chargha-pulao",
  name: "Chargha Pulao",
  variants: []
}

/** The same item repriced so two units land on the matrix's Rs 1,000 subtotal. */
const ROUND: CartableItem = { ...PLAIN, basePrice: 500 }

const EMPTY_SELECTION = { addonIds: [], modifiers: {}, options: {} }

/** Gujranwala-ish branch pin. */
const BRANCH = { latitude: 31.5, longitude: 74.35 }

/**
 * A pin exactly 6 km due north of {@link BRANCH} — the matrix's checkout row.
 * Due north because along a meridian the haversine reduces to `R × Δlat`.
 */
const SIX_KM_NORTH = { latitude: 31.553_959_296_355_124, longitude: 74.35 }

/**
 * The matrix's rule: base 50, tax 5%, no free-delivery offer.
 *
 * `defaultDeliveryFee` is deliberately NOT the branch's captured Rs 70. With
 * the two equal, every precedence assertion below would pass whichever fee won,
 * which is exactly how the live cart page could have silently switched to the
 * country default without a test noticing.
 */
const RULE: TenantDeliveryChargeRule = {
  country: "PK",
  defaultDeliveryFee: 50,
  deliveryFeePerKm: 20,
  distanceThresholdKm: 2,
  freeDeliveryDistanceKm: 0,
  freeDeliveryThreshold: 800,
  freeDeliveryThresholdEnabled: false,
  maxFreeDeliveryDistanceKm: 10,
  platformFee: 30,
  riderSharePercentage: 80,
  taxRateCard: 0.05,
  taxRateCash: 0.05
}

const REF: CartRestaurantRef = {
  branchCoordinates: null,
  citySlug: "gujranwala",
  deliveryFee: 70,
  deliveryRule: null,
  minimumOrder: 500,
  restaurantName: "Chattha Chargha",
  fulfillment: "delivery" as const,
  tenantId: "tenant-1",
  restaurantSlug: "chattha-chargha"
}

/**
 * One cart holding `quantity` units of an item under `ref`'s captures.
 * @param ref - The restaurant identity carrying the fee capture
 * @param quantity - How many units
 * @param item - Which priced item, defaulting to the Rs 470 one
 * @returns The cart
 */
function cartOf(
  ref: CartRestaurantRef,
  quantity: number,
  item: CartableItem = PLAIN
) {
  const line = buildCartLine(item, EMPTY_SELECTION, quantity)
  if (line === null) {
    throw new Error("fixture line must build")
  }

  return addLine(EMPTY_CART, ref, line)
}

describe("cartPricing — the legacy cart is untouched", () => {
  it("prices the matrix row: fee 70 on subtotal 940 totals 1010", () => {
    const pricing = cartPricing(cartOf(REF, 2))

    expect(pricing).not.toBeNull()
    expect(pricing?.subtotal).toBe(940)
    expect(pricing?.deliveryFee).toBe(70)
    expect(pricing?.total).toBe(1010)
  })

  it("charges no tax and no platform fee without a captured rule", () => {
    // THE REGRESSION PIN. A cart with `deliveryRule: null` must render the
    // pre-mw-4-2 numbers to the rupee: flat fee, zero tax, zero platform fee.
    const pricing = cartPricing(cartOf(REF, 2))

    expect(pricing?.tax).toBe(0)
    expect(pricing?.platformFee).toBe(0)
    expect(pricing?.discount).toBe(0)
    expect(pricing?.tip).toBe(0)
  })

  it("answers null for a legacy cart that captured neither fee nor rule", () => {
    expect(cartPricing(cartOf({ ...REF, deliveryFee: null }, 2))).toBeNull()
    expect(cartPricing(EMPTY_CART)).toBeNull()
  })

  it("prices a zero fee as a real zero, not as an omission", () => {
    // Omitting `deliveryFee` would trigger the engine's distance fallback; a
    // captured 0 must reach the engine as an explicit 0 instead.
    const pricing = cartPricing(cartOf({ ...REF, deliveryFee: 0 }, 2))

    expect(pricing?.deliveryFee).toBe(0)
    expect(pricing?.total).toBe(940)
  })

  it("degrades to null for a rule with no flat fee and no address", () => {
    // No fee resolves at all: the rule cannot measure a distance and there is
    // no captured fee to fall back on. Omitting `deliveryFee` would send the
    // engine to its country fallback, and PK's default is 0 — a fabricated
    // free delivery. Subtotal-plus-disclaimer is the honest render.
    expect(
      cartPricing(
        cartOf({ ...REF, deliveryFee: null, deliveryRule: RULE }, 2, ROUND)
      )
    ).toBeNull()
  })

  it("prices a rule-only cart once an address makes the distance measurable", () => {
    const pricing = cartPricing(
      cartOf(
        {
          ...REF,
          branchCoordinates: BRANCH,
          deliveryFee: null,
          deliveryRule: RULE
        },
        2,
        ROUND
      ),
      { deliveryAddress: SIX_KM_NORTH }
    )

    expect(pricing?.deliveryFee).toBe(130)
    expect(pricing?.tax).toBe(50)
  })
})

describe("cartPricing — with a captured rule", () => {
  const withRule: CartRestaurantRef = {
    ...REF,
    branchCoordinates: BRANCH,
    deliveryRule: RULE
  }

  it("charges tax but keeps the CAPTURED flat fee — THE NO-ADDRESS ROW", () => {
    // Subtotal 1,000 · tax 5% = 50 · fee 70 · total 1,120. The fee is the
    // branch's captured 70, NOT the rule's 50: with no address there is no
    // distance to measure, so the rule's default is not a measurement and must
    // not displace the fee the branch actually publishes.
    const pricing = cartPricing(cartOf(withRule, 2, ROUND))

    expect(pricing?.subtotal).toBe(1000)
    expect(pricing?.tax).toBe(50)
    expect(pricing?.deliveryFee).toBe(70)
    expect(pricing?.deliveryFee).not.toBe(RULE.defaultDeliveryFee)
    expect(pricing?.total).toBe(1120)
    // Still understated on purpose: the rule carries a platform fee, but
    // whether the server will charge it is not publicly readable.
    expect(pricing?.platformFee).toBe(0)
  })

  it("replaces the flat fee with the distance one once an address is chosen", () => {
    // Base 50 + max(0, 6 − 2) × 20 = 130, against a captured flat fee of 70 —
    // the rule wins here precisely because both pins are now present.
    const pricing = cartPricing(cartOf(withRule, 2, ROUND), {
      deliveryAddress: SIX_KM_NORTH
    })

    expect(pricing?.deliveryFee).toBe(130)
    expect(pricing?.total).toBe(1180)
  })

  it("keeps the captured fee when the branch itself has no pin to measure from", () => {
    // An address but no branch coordinate is still no distance, so the rule
    // stays out of it and the captured 70 stands.
    const pricing = cartPricing(
      cartOf({ ...withRule, branchCoordinates: null }, 2, ROUND),
      { deliveryAddress: SIX_KM_NORTH }
    )

    expect(pricing?.deliveryFee).toBe(70)
    expect(pricing?.deliveryFee).not.toBe(RULE.defaultDeliveryFee)
  })

  it("drops the fee to zero when the free-delivery threshold is met", () => {
    const pricing = cartPricing(
      cartOf(
        {
          ...withRule,
          deliveryRule: { ...RULE, freeDeliveryThresholdEnabled: true }
        },
        2,
        ROUND
      ),
      { deliveryAddress: SIX_KM_NORTH }
    )

    expect(pricing?.deliveryFee).toBe(0)
    // Tax is still charged — free delivery is a fee waiver, not a tax one.
    expect(pricing?.tax).toBe(50)
    expect(pricing?.total).toBe(1050)
  })

  it("is not eligible for free delivery with either coordinate missing", () => {
    const pricing = cartPricing(
      cartOf(
        {
          ...withRule,
          deliveryRule: { ...RULE, freeDeliveryThresholdEnabled: true }
        },
        2,
        ROUND
      )
    )

    expect(pricing?.deliveryFee).toBe(70)
  })

  it("renders no tax when the branch publishes a zero rate", () => {
    // `getTaxRatesForCountry` returns zeros when the ADD_TAX marketplace flag
    // is off, so a zero rate IS the flag as a public client observes it.
    const pricing = cartPricing(
      cartOf(
        { ...withRule, deliveryRule: { ...RULE, taxRateCash: 0 } },
        2,
        ROUND
      )
    )

    expect(pricing?.tax).toBe(0)
    expect(pricing?.total).toBe(1070)
  })

  it("zeroes the fee for a pickup cart and never quotes a distance", () => {
    const pricing = cartPricing(
      cartOf({ ...withRule, fulfillment: "pickup" }, 2, ROUND),
      { deliveryAddress: SIX_KM_NORTH }
    )

    expect(pricing?.deliveryFee).toBe(0)
    expect(pricing?.total).toBe(1050)
  })

  it("treats a hybrid branch as delivering, and a legacy null likewise", () => {
    expect(
      cartPricing(cartOf({ ...withRule, fulfillment: "hybrid" }, 2, ROUND))
        ?.deliveryFee
    ).toBe(70)
    expect(
      cartPricing(cartOf({ ...withRule, fulfillment: null }, 2, ROUND))
        ?.deliveryFee
    ).toBe(70)
  })

  it("reads the payment method only when the branch published no rate", () => {
    // With a rule, the rule's cash rate wins whatever the method is.
    expect(
      cartPricing(cartOf(withRule, 2, ROUND), { paymentMethod: "card" })?.tax
    ).toBe(50)
    // Without one, tax stays off entirely — `addTaxEnabled` resolves false.
    expect(
      cartPricing(cartOf(REF, 2, ROUND), { paymentMethod: "card" })?.tax
    ).toBe(0)
  })
})

describe("minimumOrderShortfall", () => {
  it("names the gap between the subtotal and the branch minimum", () => {
    // This table's single line subtotals to 470, so the matrix row's
    // (minimum - subtotal) arithmetic is pinned twice: against the ref's own
    // 500 minimum (gap 30) and against a 670 one (the matrix's gap of 200).
    expect(minimumOrderShortfall(cartOf(REF, 1))).toBe(30)
    expect(
      minimumOrderShortfall(cartOf({ ...REF, minimumOrder: 670 }, 1))
    ).toBe(200)
  })

  it("answers null once the minimum is met exactly or exceeded", () => {
    expect(
      minimumOrderShortfall(cartOf({ ...REF, minimumOrder: 470 }, 1))
    ).toBeNull()
    expect(minimumOrderShortfall(cartOf(REF, 2))).toBeNull()
  })

  it("answers null with no captured minimum and on an empty cart", () => {
    expect(
      minimumOrderShortfall(cartOf({ ...REF, minimumOrder: null }, 1))
    ).toBeNull()
    expect(minimumOrderShortfall(EMPTY_CART)).toBeNull()
  })
})
