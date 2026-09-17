/**
 * Shared money-math fixture table for `calculatePricing` (`@/constants`).
 *
 * This module is **pure data**. It imports types from `@/constants` and nothing
 * else — no test framework, no runner helper, no assertion library — so the same
 * table can be executed by web's Vitest and by mobile's `bun test` without either
 * runner needing to understand the other. Anything that would only work under one
 * runner belongs in that app's `__tests__` file, never here.
 *
 * Every `expected` value in this table was **produced by running the engine**, not
 * hand-computed and asserted as if authoritative. Where the engine's real output is
 * surprising, the surprise is documented on the fixture rather than smoothed over —
 * a fixture that lies about behaviour is worse than no fixture, because it turns a
 * regression into a silent pass.
 *
 * Four engine findings are pinned here rather than fixed. All of them live in the
 * 5-backend-pinned `@/constants` package, so changing them is not this table's
 * call:
 *
 * 1. Neither `COUNTRY_FEE_CONFIG` entry sets `freeDeliveryThresholdEnabled`, so the
 *    whole free-delivery branch in `calculateDeliveryFee` is **inert on defaults**.
 *    A free-delivery boundary only exists when a tenant passes a `feeConfig`
 *    override. See `free-delivery-country-default-is-inert`.
 * 2. `CountryFeeConfig.maxFreeDeliveryDistanceKm` (20.0 for both countries) is
 *    **never read**. `calculateDeliveryFee` reads `freeDeliveryDistanceKm`, a
 *    differently-named field that no country config sets.
 * 3. With `addTaxEnabled: true` and no `paymentMethod`, the engine's else-branch is
 *    the **card** rate, so omitting the payment method silently charges 15% rather
 *    than 5%. See `tax-on-payment-method-omitted-uses-card-rate`.
 * 4. The discount cap protects the **subtotal only**. Delivery fee, platform fee
 *    and tip are added after the cap, so an over-cap promo does not zero the order.
 *    See `promo-exceeds-subtotal-with-fees-and-tip`.
 *
 * @example
 * for (const fixture of PRICING_FIXTURES) {
 *   const actual = calculatePricing([...fixture.items], fixture.config)
 *   // actual.total === fixture.expected.total
 * }
 */

import type { CartItemInput, PricingCalculationConfig } from "@/constants"

/**
 * The money fields a fixture pins, mirroring `PricingCalculationResult` minus the
 * per-item breakdown and the duplicated `breakdown` object.
 *
 * All seven are asserted, not just `total`: a table that only checks the grand
 * total cannot tell a tax regression apart from a delivery-fee regression, and the
 * point of sharing this table with mobile is to localise a divergence, not just
 * detect one.
 */
export interface PricingFixtureExpectation {
  /** Sum of every item's `price * quantity`, rounded to 2dp. */
  readonly subtotal: number
  /** Tax amount. Zero unless `addTaxEnabled` is exactly `true`. */
  readonly tax: number
  /** Delivery fee, either the explicit override or distance x per-km. */
  readonly deliveryFee: number
  /** Platform fee. Zero unless explicitly provided; never derived. */
  readonly platformFee: number
  /** Discount actually applied, already capped at `subtotal`. */
  readonly discount: number
  /** Tip. Zero unless explicitly provided. */
  readonly tip: number
  /** `subtotal + tax + deliveryFee + platformFee + tip - discount`, floored at 0. */
  readonly total: number
}

/**
 * One row of the shared pricing table: a named input pair plus the totals the
 * engine actually produces for it.
 */
export interface PricingFixture {
  /** Stable kebab-case identifier. Used as the test name and by `findPricingFixture`. */
  readonly name: string
  /** Why this row exists — which behaviour or boundary it pins. */
  readonly describes: string
  /** Cart items exactly as `calculatePricing` receives them. */
  readonly items: readonly CartItemInput[]
  /** Pricing config exactly as `calculatePricing` receives it. */
  readonly config: PricingCalculationConfig
  /** Totals measured from the engine. */
  readonly expected: PricingFixtureExpectation
}

/**
 * Branch coordinates used by every distance-based fixture (central Lahore).
 * Paired with `DELIVERY_COORDINATES`, the engine's Haversine returns
 * `MEASURED_DISTANCE_KM`.
 */
const BRANCH_COORDINATES = {
  latitude: 31.5204,
  longitude: 74.3587
} as const

/** Delivery address coordinates used by every distance-based fixture. */
const DELIVERY_COORDINATES = {
  latitude: 31.5497,
  longitude: 74.3436
} as const

/**
 * The exact Haversine distance the engine computes between the two coordinate
 * pairs above, in kilometres.
 *
 * This literal is not a guess and must not be rounded. It was read out of the
 * engine itself by calling `calculateDeliveryFee` with `deliveryFeePerKm: 1` and
 * `distanceThresholdKm: 0`, which makes the returned fee numerically equal to the
 * distance. It is the shortest round-tripping decimal for that double, so
 * `distance <= freeDeliveryDistanceKm` compares exactly equal when this value is
 * used as the free-delivery radius — which is what makes the boundary fixture a
 * real test of `<=` rather than `<`.
 *
 * `measured-distance-is-pinned` asserts this number directly. Without that row the
 * boundary fixture could degrade silently: if the Haversine ever returned a
 * SMALLER distance, the radius would still cover it, the fee would still be 0, and
 * the boundary test would keep passing while no longer sitting on the boundary.
 */
const MEASURED_DISTANCE_KM = 3.558_459_793_304_852

/**
 * A free-delivery radius deliberately **shorter** than `MEASURED_DISTANCE_KM`, so
 * the delivery address falls *outside* it and the fee is charged.
 *
 * The gap is about 8.5 metres — small enough that only the boundary comparison can
 * tell the two apart, which is the point, but not so small that it depends on
 * floating-point noise.
 */
const RADIUS_SHORTER_THAN_MEASURED_DISTANCE_KM = 3.55

/** Unit price shared by the single-item and composed-price fixtures. */
const BASE_UNIT_PRICE = 500

/**
 * A `validUntil` far enough ahead that the fixture cannot rot into a false
 * negative. `isPromoValid` compares against `new Date()` at call time, so a
 * near-future date would silently start failing the suite on a fixed day.
 */
const FAR_FUTURE_EXPIRY = new Date("2099-12-31T23:59:59.000Z")

/** A `validUntil` safely in the past, for the expired-promo fixture. */
const PAST_EXPIRY = new Date("2020-01-01T00:00:00.000Z")

/**
 * Config shared by the single-item fixture and both composed-price fixtures.
 *
 * They must be byte-identical or the equality assertion in the test proves
 * nothing: the claim is that a composed price is indistinguishable from a plain
 * one *as an engine input*, and that only holds when the only difference is how
 * the caller arrived at the number.
 */
const PLAIN_PK_CONFIG: PricingCalculationConfig = { country: "PK" }

/** Expectation shared by the single-item fixture and both composed-price fixtures. */
const PLAIN_PK_EXPECTATION: PricingFixtureExpectation = {
  deliveryFee: 0,
  discount: 0,
  platformFee: 0,
  subtotal: 500,
  tax: 0,
  tip: 0,
  total: 500
}

/** Coordinates pair shared by every distance-based fixture, as engine config. */
const DISTANCE_CONFIG = {
  branchCoordinates: BRANCH_COORDINATES,
  deliveryAddress: DELIVERY_COORDINATES
} as const

/** A promo that is valid on its own terms, reused by the override fixtures. */
const VALID_TEN_PERCENT_PROMO = {
  discountType: "PERCENTAGE",
  discountValue: 10,
  isActive: true,
  usedCount: 0
} as const

/**
 * Name of the plain single-item fixture. The composed-price fixtures assert
 * equality against this row, so the link is a constant rather than a repeated
 * string literal that a rename could silently break.
 */
export const SINGLE_ITEM_FIXTURE_NAME = "single-item"

/**
 * Names of the fixtures whose unit price is a *composed* price — a base price with
 * an addon or a variant delta already folded in by the caller.
 *
 * `CartItemInput` carries only `price` and `quantity`; there is no addon field and
 * no variant field. So "addon" and "variant" are not engine concepts at all: the
 * caller folds the delta into the unit price before calling. These fixtures pin
 * exactly that convention by asserting they are indistinguishable from
 * `SINGLE_ITEM_FIXTURE_NAME`. The real variant/addon arithmetic is mw-1-7's and
 * lands in core, not in `@/constants`.
 */
export const COMPOSED_PRICE_FIXTURE_NAMES = [
  "composed-price-addon",
  "composed-price-variant"
] as const

/**
 * The shared input -> expected-total table. Web and mobile run this same array
 * against the same `calculatePricing`, so a divergence to the paisa fails on both
 * sides rather than turning into a customer dispute.
 *
 * @example
 * const zero = findPricingFixture("zero-items")
 * calculatePricing([...zero.items], zero.config).total // -> 0
 */
export const PRICING_FIXTURES: readonly PricingFixture[] = [
  {
    config: { country: "PK" },
    describes:
      "An empty cart produces zeroes, not NaN. `reduce` over [] with a 0 seed is the guard.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 0,
      tax: 0,
      tip: 0,
      total: 0
    },
    items: [],
    name: "zero-items"
  },
  {
    config: PLAIN_PK_CONFIG,
    describes:
      "One item, no fees, no tax, no promo. The baseline every composed-price row is compared against.",
    expected: PLAIN_PK_EXPECTATION,
    items: [{ price: BASE_UNIT_PRICE, quantity: 1 }],
    name: SINGLE_ITEM_FIXTURE_NAME
  },
  {
    config: PLAIN_PK_CONFIG,
    describes:
      "Base 400 + a 100 addon, folded into the unit price by the caller. Must equal `single-item`.",
    expected: PLAIN_PK_EXPECTATION,
    items: [{ price: 400 + 100, quantity: 1 }],
    name: "composed-price-addon"
  },
  {
    config: PLAIN_PK_CONFIG,
    describes:
      "Base 450 + a 50 variant delta, folded into the unit price by the caller. Must equal `single-item`.",
    expected: PLAIN_PK_EXPECTATION,
    items: [{ price: 450 + 50, quantity: 1 }],
    name: "composed-price-variant"
  },
  {
    config: { country: "PK" },
    describes:
      "A mixed cart: two lines, different unit prices and quantities, summed. 249.99 x 3 = 749.97 plus 0.50 x 2 = 1.00. NOTE this row does NOT discriminate rounding order — both orderings give 750.97. `rounding-is-per-item-not-on-the-sum` is the row that does.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 750.97,
      tax: 0,
      tip: 0,
      total: 750.97
    },
    items: [
      { price: 249.99, quantity: 3 },
      { price: 0.5, quantity: 2 }
    ],
    name: "multiple-items-mixed-cart"
  },
  {
    config: { country: "PK" },
    describes:
      "Rounding happens PER ITEM and then the rounded subtotals are summed — it is not applied once to the raw sum. Three lines of 0.125 make the two orderings disagree: round-then-sum gives 0.13 x 3 = 0.39, sum-then-round gives 0.375 -> 0.38. The engine produces 0.39, so a change to sum-then-round fails here.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 0.39,
      tax: 0,
      tip: 0,
      total: 0.39
    },
    items: [
      { price: 0.125, quantity: 1 },
      { price: 0.125, quantity: 1 },
      { price: 0.125, quantity: 1 }
    ],
    name: "rounding-is-per-item-not-on-the-sum"
  },
  {
    config: {
      country: "PK",
      promoCode: {
        discountType: "PERCENTAGE",
        discountValue: 10,
        isActive: true,
        minOrderAmount: 1000,
        usedCount: 0
      }
    },
    describes:
      "Subtotal 500 is below the promo's 1000 minimum, so the promo is rejected outright: discount 0.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 500,
      tax: 0,
      tip: 0,
      total: 500
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 1 }],
    name: "promo-below-minimum"
  },
  {
    config: {
      country: "PK",
      promoCode: {
        discountType: "PERCENTAGE",
        discountValue: 10,
        isActive: true,
        minOrderAmount: 1000,
        usedCount: 0
      }
    },
    describes:
      "Subtotal exactly equals the minimum. `subtotal < minOrderAmount` is the rejection test, so equal is ACCEPTED.",
    expected: {
      deliveryFee: 0,
      discount: 100,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 900
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "promo-exactly-at-minimum"
  },
  {
    config: {
      country: "PK",
      promoCode: {
        discountType: "PERCENTAGE",
        discountValue: 10,
        isActive: true,
        maxDiscountAmount: 120,
        minOrderAmount: 1000,
        usedCount: 0
      }
    },
    describes:
      "10% of 1500 is 150, but `maxDiscountAmount` caps it at 120. Pins the cap, not just the rate.",
    expected: {
      deliveryFee: 0,
      discount: 120,
      platformFee: 0,
      subtotal: 1500,
      tax: 0,
      tip: 0,
      total: 1380
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 3 }],
    name: "promo-above-minimum-capped"
  },
  {
    config: {
      country: "PK",
      promoCode: {
        discountType: "FIXED",
        discountValue: 250,
        isActive: true,
        usedCount: 0
      }
    },
    describes:
      "A FIXED promo with no minimum. Subtracted straight off the subtotal.",
    expected: {
      deliveryFee: 0,
      discount: 250,
      platformFee: 0,
      subtotal: 500,
      tax: 0,
      tip: 0,
      total: 250
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 1 }],
    name: "promo-fixed-amount"
  },
  {
    config: {
      country: "PK",
      promoCode: {
        discountType: "FIXED",
        discountValue: 900,
        isActive: true,
        usedCount: 0
      }
    },
    describes:
      "A promo worth more than the cart. Discount is capped at the subtotal and the total floors at 0 — never negative, never NaN.",
    expected: {
      deliveryFee: 0,
      discount: 500,
      platformFee: 0,
      subtotal: 500,
      tax: 0,
      tip: 0,
      total: 0
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 1 }],
    name: "promo-exceeds-subtotal"
  },
  {
    config: {
      country: "PK",
      deliveryFee: 70,
      platformFee: 15,
      promoCode: {
        discountType: "FIXED",
        discountValue: 900,
        isActive: true,
        usedCount: 0
      },
      tip: 30
    },
    describes:
      "FINDING 4, pinned. The same over-cap promo, but with a delivery fee, a platform fee and a tip alongside it. The cap protects the SUBTOTAL ONLY — the other three are added after it, so the customer still owes 70 + 15 + 30 = 115 on a fully discounted cart. `promo-exceeds-subtotal` alone cannot show this, because there everything else is zero.",
    expected: {
      deliveryFee: 70,
      discount: 500,
      platformFee: 15,
      subtotal: 500,
      tax: 0,
      tip: 30,
      total: 115
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 1 }],
    name: "promo-exceeds-subtotal-with-fees-and-tip"
  },
  {
    config: {
      country: "PK",
      promoCode: {
        discountType: "PERCENTAGE",
        discountValue: 10,
        isActive: false,
        usedCount: 0
      }
    },
    describes:
      "`isActive: false` is the first gate in `isPromoValid` and rejects before any other check.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1000
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "promo-inactive"
  },
  {
    config: {
      country: "PK",
      promoCode: {
        discountType: "PERCENTAGE",
        discountValue: 10,
        isActive: true,
        usedCount: 0,
        validUntil: PAST_EXPIRY
      }
    },
    describes:
      "An active promo whose `validUntil` is in the past is rejected. The comparison is against `new Date()` at call time.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1000
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "promo-expired"
  },
  {
    config: {
      country: "PK",
      promoCode: {
        discountType: "PERCENTAGE",
        discountValue: 10,
        isActive: true,
        usedCount: 0,
        validUntil: FAR_FUTURE_EXPIRY
      }
    },
    describes:
      "The other side of the expiry branch: a future `validUntil` does not block the promo. Dated 2099 on purpose so this row cannot rot into a false negative.",
    expected: {
      deliveryFee: 0,
      discount: 100,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 900
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "promo-valid-until-far-future"
  },
  {
    config: {
      country: "PK",
      promoCode: {
        discountType: "PERCENTAGE",
        discountValue: 10,
        isActive: true,
        usageLimit: 5,
        usedCount: 5
      }
    },
    describes:
      "Usage limit reached. The test is `usedCount >= usageLimit`, so the fifth use of a five-use promo is the one that is REFUSED, not the one that is allowed.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1000
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "promo-usage-limit-reached"
  },
  {
    config: {
      country: "PK",
      promoCode: {
        discountType: "PERCENTAGE",
        discountValue: 10,
        isActive: true,
        usageLimit: 5,
        usedCount: 4
      }
    },
    describes:
      "One below the usage limit, so the promo still applies. Paired with `promo-usage-limit-reached` this pins which side of `>=` the boundary falls on.",
    expected: {
      deliveryFee: 0,
      discount: 100,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 900
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "promo-usage-limit-one-below"
  },
  {
    config: {
      country: "PK",
      promoCode: {
        discountType: "PERCENTAGE",
        discountValue: 150,
        isActive: true,
        usedCount: 0
      }
    },
    describes:
      "A percentage above 100 is clamped to 100, not treated as 150%. The order goes to zero; it never produces a negative total or a refund.",
    expected: {
      deliveryFee: 0,
      discount: 1000,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 0
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "promo-percentage-above-100-clamps"
  },
  {
    config: {
      country: "PK",
      promoCode: {
        discountType: "PERCENTAGE",
        discountValue: -10,
        isActive: true,
        usedCount: 0
      }
    },
    describes:
      "A negative percentage is clamped to 0, so a malformed promo cannot ADD to the bill.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1000
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "promo-percentage-negative-clamps-to-zero"
  },
  {
    config: {
      country: "PK",
      discount: 0,
      promoCode: VALID_TEN_PERCENT_PROMO
    },
    describes:
      "An explicit `discount: 0` alongside a perfectly valid promo. The engine tests `Number.isFinite(config.discount) && !== undefined`, so 0 WINS and the promo is never evaluated — a `||` here would have fallen through to the promo and given 100.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1000
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "explicit-zero-discount-beats-promo"
  },
  {
    config: {
      ...DISTANCE_CONFIG,
      country: "PK",
      feeConfig: {
        distanceThresholdKm: 0,
        deliveryFeePerKm: 1
      }
    },
    describes:
      "Pins the measured Haversine distance ITSELF: at 1.0/km with no threshold the fee IS the distance, 3.558459793304852 -> 3.56. Without this row the free-delivery boundary fixture could degrade silently — a smaller distance would still sit inside the radius, still bill 0, and still pass while no longer testing the boundary.",
    expected: {
      deliveryFee: 3.56,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1003.56
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "measured-distance-is-pinned"
  },
  {
    config: {
      ...DISTANCE_CONFIG,
      country: "PK",
      feeConfig: {
        freeDeliveryDistanceKm: MEASURED_DISTANCE_KM,
        freeDeliveryThresholdEnabled: true
      }
    },
    describes:
      "Distance is EXACTLY the free-delivery radius. The engine tests `distance <= freeDeliveryDistanceKm`, so the boundary is inclusive and the fee is 0. Requires a tenant `feeConfig` override — see finding 1 in the module header.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1000
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "free-delivery-boundary-inclusive"
  },
  {
    config: {
      ...DISTANCE_CONFIG,
      country: "PK",
      feeConfig: {
        freeDeliveryDistanceKm: RADIUS_SHORTER_THAN_MEASURED_DISTANCE_KM,
        freeDeliveryThresholdEnabled: true
      }
    },
    describes:
      "The same address against a radius ~8.5 m shorter than the distance, so it falls outside. Free delivery does not apply and the full distance is billed — this is the row that makes the inclusive boundary above mean something.",
    expected: {
      deliveryFee: 71.17,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1071.17
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "free-delivery-just-outside-boundary"
  },
  {
    config: {
      ...DISTANCE_CONFIG,
      country: "PK",
      feeConfig: {
        freeDeliveryThreshold: 1000,
        freeDeliveryThresholdEnabled: true
      }
    },
    describes:
      "The OTHER free-delivery branch: subtotal-based, not distance-based. Subtotal exactly equals the threshold and the test is `subtotal >= freeDeliveryThreshold`, so equal qualifies. With no radius configured the distance clause is skipped entirely.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1000
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "free-delivery-subtotal-threshold-exactly-met"
  },
  {
    config: {
      ...DISTANCE_CONFIG,
      country: "PK",
      feeConfig: {
        freeDeliveryThreshold: 1000.01,
        freeDeliveryThresholdEnabled: true
      }
    },
    describes:
      "One paisa short of the subtotal threshold, so free delivery does not apply and the distance is billed in full. Pairs with the row above to pin which side of `>=` the boundary sits on.",
    expected: {
      deliveryFee: 71.17,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1071.17
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "free-delivery-subtotal-threshold-just-below"
  },
  {
    config: {
      ...DISTANCE_CONFIG,
      country: "PK"
    },
    describes:
      "FINDING 1, pinned. With no `feeConfig` override, `COUNTRY_FEE_CONFIG.PK` leaves `freeDeliveryThresholdEnabled` unset, so the free-delivery branch never runs and the fee is plain distance x 20.0/km. Identical to `free-delivery-just-outside-boundary` despite that one asking for free delivery.",
    expected: {
      deliveryFee: 71.17,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1071.17
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "free-delivery-country-default-is-inert"
  },
  {
    config: {
      ...DISTANCE_CONFIG,
      country: "PK",
      feeConfig: { distanceThresholdKm: 2 }
    },
    describes:
      "A non-null `distanceThresholdKm` makes the first 2 km free of charge: billable km is `distance - threshold` = 1.5584..., billed at 20.0/km. Neither country config sets this — it is null in both — so only a tenant override reaches this arithmetic.",
    expected: {
      deliveryFee: 31.17,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1031.17
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "distance-threshold-shortens-billable-km"
  },
  {
    config: {
      ...DISTANCE_CONFIG,
      country: "PK",
      feeConfig: { distanceThresholdKm: 10 }
    },
    describes:
      "A threshold longer than the trip. `Math.max(0, distance - threshold)` clamps billable km to 0 rather than producing a negative fee that would credit the customer.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1000
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "distance-threshold-above-distance-clamps-to-zero"
  },
  {
    config: {
      branchCoordinates: BRANCH_COORDINATES,
      country: "PK"
    },
    describes:
      "Only one half of the coordinate pair. The engine requires BOTH and returns 0 rather than falling back to a flat fee — so a missing delivery address undercharges silently instead of erroring.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1000
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "only-branch-coordinates-supplied"
  },
  {
    config: {
      ...DISTANCE_CONFIG,
      country: "PK",
      deliveryFee: 0
    },
    describes:
      "An explicit `deliveryFee: 0` with usable coordinates. Like the discount case, the engine's finite-check means 0 WINS over the distance calculation; a `||` would have billed 71.17. This is how a free-delivery promotion is actually expressed today, given finding 1.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1000
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "explicit-zero-delivery-fee-beats-distance"
  },
  {
    config: {
      ...DISTANCE_CONFIG,
      country: "JO"
    },
    describes:
      "Same cart, same coordinates, JO instead of PK: 0.6/km rather than 20.0/km. The only thing country changes about delivery.",
    expected: {
      deliveryFee: 2.14,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1002.14
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "country-jo-delivery-per-km"
  },
  {
    config: {
      ...DISTANCE_CONFIG,
      country: "XX"
    },
    describes:
      "An unrecognised country falls back to JO, not to PK and not to an error. Must match `country-jo-delivery-per-km` exactly.",
    expected: {
      deliveryFee: 2.14,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1002.14
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "country-unknown-falls-back-to-jo"
  },
  {
    config: DISTANCE_CONFIG,
    describes:
      "No `country` at all. `getFeeConfigForCountry` returns the JO default rather than throwing, so an unset country quietly bills Jordanian rates in Pakistan. Pinned because it is a plausible mistake with a 33x price difference.",
    expected: {
      deliveryFee: 2.14,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1002.14
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "country-omitted-falls-back-to-jo"
  },
  {
    config: {
      ...DISTANCE_CONFIG,
      country: "pk"
    },
    describes:
      "A lowercase country code resolves to PK. The lookup upper-cases before matching, so casing is not a silent fallback to JO.",
    expected: {
      deliveryFee: 71.17,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1071.17
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "country-lowercase-resolves-to-pk"
  },
  {
    config: { country: "PK", paymentMethod: "card" },
    describes:
      "`addTaxEnabled` is unset, so tax is 0 even though a taxable payment method and a country with a configured rate are both present. The flag gates everything.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1000
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "tax-off-when-flag-unset"
  },
  {
    config: { addTaxEnabled: false, country: "PK", paymentMethod: "card" },
    describes:
      "`addTaxEnabled: false` behaves identically to unset. The engine tests `!== true`, so only an explicit `true` enables tax.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1000
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "tax-off-when-flag-explicitly-false"
  },
  {
    config: { addTaxEnabled: true, country: "PK", paymentMethod: "cash" },
    describes: "Tax on, cash: 5% of subtotal (PK).",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 50,
      tip: 0,
      total: 1050
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "tax-on-cash-pk"
  },
  {
    config: { addTaxEnabled: true, country: "PK", paymentMethod: "card" },
    describes: "Tax on, card: 15% of subtotal (PK).",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 150,
      tip: 0,
      total: 1150
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "tax-on-card-pk"
  },
  {
    config: { addTaxEnabled: true, country: "JO", paymentMethod: "cash" },
    describes:
      "Tax on, cash, JO: also 5%. `COUNTRY_TAX_CONFIG` is identical for both countries — country changes delivery, never tax.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 50,
      tip: 0,
      total: 1050
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "tax-on-cash-jo"
  },
  {
    config: { addTaxEnabled: true, country: "JO", paymentMethod: "card" },
    describes: "Tax on, card, JO: also 15%. See `tax-on-cash-jo`.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 150,
      tip: 0,
      total: 1150
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "tax-on-card-jo"
  },
  {
    config: { addTaxEnabled: true, country: "PK", paymentMethod: "wallet" },
    describes:
      "There are EIGHT payment methods, and only `cash` gets the cash rate. `wallet` — like online, jazzcash, bank_transfer, easypaisa and nayapay — falls to the else-branch and is taxed at the card rate.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 150,
      tip: 0,
      total: 1150
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "tax-on-wallet-uses-card-rate"
  },
  {
    config: { addTaxEnabled: true, country: "PK" },
    describes:
      "FINDING 3, pinned. Tax on with NO `paymentMethod`. The engine's else-branch is the CARD rate, so omitting the payment method silently charges 15% rather than 5%. Pinned because it is the expensive way round.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 150,
      tip: 0,
      total: 1150
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "tax-on-payment-method-omitted-uses-card-rate"
  },
  {
    config: {
      addTaxEnabled: true,
      country: "PK",
      paymentMethod: "card",
      taxRate: 0.02
    },
    describes:
      "An explicit `taxRate` beats BOTH the country config and the payment method: 2% is charged where the card rate would have been 15%.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 20,
      tip: 0,
      total: 1020
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "explicit-tax-rate-beats-country-and-payment-method"
  },
  {
    config: { country: "PK", subtotal: 250 },
    describes:
      "An explicit `config.subtotal` REPLACES the value derived from items — the items are still itemised in the breakdown, but they do not drive the total. A caller that passes a stale subtotal is believed.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 250,
      tax: 0,
      tip: 0,
      total: 250
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "subtotal-override-replaces-items"
  },
  {
    config: { country: "PK", subtotal: -50 },
    describes:
      "A negative subtotal override is clamped to 0 by `Math.max(0, …)` before anything else uses it.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 0,
      tax: 0,
      tip: 0,
      total: 0
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "subtotal-override-negative-clamps-to-zero"
  },
  {
    config: { country: "PK" },
    describes:
      "Malformed lines contribute nothing instead of poisoning the total: a NaN price, a negative price and a zero quantity each collapse to 0, leaving only the one good line (250 x 2). No NaN reaches the output.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 500,
      tax: 0,
      tip: 0,
      total: 500
    },
    items: [
      { price: Number.NaN, quantity: 2 },
      { price: -100, quantity: 1 },
      { price: BASE_UNIT_PRICE, quantity: 0 },
      { price: 250, quantity: 2 }
    ],
    name: "malformed-items-contribute-nothing"
  },
  {
    config: { country: "PK", tip: null },
    describes:
      "`tip: null` is the shape the API actually sends for 'no tip'. It must read as 0, not NaN.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1000
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "tip-null-is-zero"
  },
  {
    config: { country: "PK", tip: -50 },
    describes:
      "A negative tip is clamped to 0, so it cannot be used to discount an order.",
    expected: {
      deliveryFee: 0,
      discount: 0,
      platformFee: 0,
      subtotal: 1000,
      tax: 0,
      tip: 0,
      total: 1000
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 2 }],
    name: "tip-negative-clamps-to-zero"
  },
  {
    config: {
      addTaxEnabled: true,
      country: "PK",
      deliveryFee: 70,
      discount: 20,
      paymentMethod: "cash",
      platformFee: 15,
      tip: 30
    },
    describes:
      "Every term of the total formula non-zero at once, with explicit overrides beating any derivation: 500 + 25 tax + 70 delivery + 15 platform + 30 tip - 20 discount.",
    expected: {
      deliveryFee: 70,
      discount: 20,
      platformFee: 15,
      subtotal: 500,
      tax: 25,
      tip: 30,
      total: 620
    },
    items: [{ price: BASE_UNIT_PRICE, quantity: 1 }],
    name: "all-terms-with-explicit-overrides"
  }
]

/**
 * Looks a fixture up by name.
 *
 * Used by the equality assertions that pair two rows (composed price vs single
 * item, unknown country vs JO), where hard-coding an index would break the moment
 * a row is inserted above it.
 * @param name - The fixture's `name` field
 * @returns The matching fixture
 * @throws {Error} When no fixture carries that name — a silent `undefined` here
 * would turn a broken pairing into a skipped assertion.
 * @example findPricingFixture("zero-items").expected.total // -> 0
 */
export function findPricingFixture(name: string): PricingFixture {
  const fixture = PRICING_FIXTURES.find((entry) => entry.name === name)

  if (fixture === undefined) {
    throw new Error(
      `No pricing fixture named "${name}". Known fixtures: ${PRICING_FIXTURES.map((entry) => entry.name).join(", ")}`
    )
  }

  return fixture
}
