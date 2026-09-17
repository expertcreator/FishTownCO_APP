/**
 * Runs the shared pricing table against the real engine.
 *
 * This file executes under BOTH runners unchanged — web's Vitest and mobile's
 * `bun test`, which aliases `vitest` imports onto its own runner. That is the whole
 * point: the same table, the same engine, the same totals to the paisa on both
 * platforms. Keep it to `describe` / `it` / `expect` and plain loops; a
 * Vitest-only helper (`vi.*`, `test.each` table formatting, custom matchers) would
 * quietly make the mobile half stop running.
 */

import { calculatePricing } from "@/constants"
import { describe, expect, it } from "vitest"
import {
  COMPOSED_PRICE_FIXTURE_NAMES,
  findPricingFixture,
  PRICING_FIXTURES,
  type PricingFixture,
  type PricingFixtureExpectation,
  SINGLE_ITEM_FIXTURE_NAME
} from "../index"

/** Message shape `findPricingFixture` must produce for an unknown name. */
const UNKNOWN_FIXTURE_MESSAGE = /No pricing fixture named "no-such-fixture"/

/**
 * Number of rows the table is expected to carry.
 *
 * Deliberately a hard-coded count rather than a lower bound: the name assertions
 * below use `arrayContaining`, which cannot notice a row that is DELETED unless it
 * happens to be one of the names listed there. Bumping this number when you add a
 * row is the price of a table that cannot silently shrink.
 */
const EXPECTED_FIXTURE_COUNT = 49

/**
 * The money fields a fixture pins, in a stable order.
 *
 * `satisfies` is load-bearing, not decoration: a bare `as const` has no
 * compile-time link to `PricingFixtureExpectation`, so adding an eighth money
 * field to that interface would leave this list silently one short and the
 * finiteness check would stop covering it.
 */
const MONEY_KEYS = [
  "subtotal",
  "tax",
  "deliveryFee",
  "platformFee",
  "discount",
  "tip",
  "total"
] as const satisfies readonly (keyof PricingFixtureExpectation)[]

/** The engine's own 2dp rounding, restated so the per-item invariant can be checked. */
function round2(value: number) {
  return Math.round(value * 100) / 100
}

/**
 * Runs a fixture through the engine.
 *
 * The spread on `items` is load-bearing: the table is `readonly` so no test can
 * mutate a shared row out from under the next one, while `calculatePricing` takes
 * a mutable array.
 */
function priceFixture(fixture: PricingFixture) {
  return calculatePricing([...fixture.items], fixture.config)
}

/** Narrows an engine result to the seven fields the table pins. */
function moneyOf(
  result: ReturnType<typeof calculatePricing>
): PricingFixtureExpectation {
  return {
    deliveryFee: result.deliveryFee,
    discount: result.discount,
    platformFee: result.platformFee,
    subtotal: result.subtotal,
    tax: result.tax,
    tip: result.tip,
    total: result.total
  }
}

/** Convenience for the cross-fixture comparisons, which only care about money. */
function moneyForFixtureNamed(name: string): PricingFixtureExpectation {
  return moneyOf(priceFixture(findPricingFixture(name)))
}

describe("PRICING_FIXTURES", () => {
  it("is not empty", () => {
    // Every loop below is `for (… of PRICING_FIXTURES)`. An empty table would
    // make all of them pass vacuously, which is the one failure this whole file
    // could not otherwise detect.
    expect(PRICING_FIXTURES.length).toBeGreaterThan(0)
  })

  it("carries exactly the expected number of rows", () => {
    expect(PRICING_FIXTURES).toHaveLength(EXPECTED_FIXTURE_COUNT)
  })

  it("has a unique name for every row", () => {
    const names = PRICING_FIXTURES.map((fixture) => fixture.name)

    expect(new Set(names).size).toBe(names.length)
  })

  it("gives every row a non-empty description of what it pins", () => {
    for (const fixture of PRICING_FIXTURES) {
      expect(fixture.describes.length).toBeGreaterThan(0)
    }
  })

  it("covers every scenario the I/O matrix requires", () => {
    const names = PRICING_FIXTURES.map((fixture) => fixture.name)

    expect(names).toEqual(
      expect.arrayContaining([
        "zero-items",
        SINGLE_ITEM_FIXTURE_NAME,
        ...COMPOSED_PRICE_FIXTURE_NAMES,
        "promo-below-minimum",
        "promo-exactly-at-minimum",
        "free-delivery-boundary-inclusive",
        "free-delivery-country-default-is-inert",
        "tax-off-when-flag-unset",
        "tax-on-cash-pk",
        "tax-on-card-pk",
        "country-jo-delivery-per-km",
        "country-unknown-falls-back-to-jo"
      ])
    )
  })
})

// One `it` per row, named after the row, so a failure names the fixture in the
// runner output instead of pointing at an anonymous loop iteration. Every
// invariant that applies to every row lives in here for the same reason.
describe("calculatePricing over the shared table", () => {
  for (const fixture of PRICING_FIXTURES) {
    describe(fixture.name, () => {
      it(`produces the measured totals — ${fixture.describes}`, () => {
        expect(moneyOf(priceFixture(fixture))).toEqual(fixture.expected)
      })

      it("keeps `breakdown` in step with the top-level fields", () => {
        // `breakdown` duplicates the seven money fields. Nothing in the engine
        // forces the two copies to agree, so a divergence would ship silently to
        // whichever surface reads the one that was not asserted.
        const result = priceFixture(fixture)

        expect(result.breakdown).toEqual(moneyOf(result))
      })

      it("itemises every input line and derives the subtotal from them", () => {
        const result = priceFixture(fixture)

        expect(result.items).toHaveLength(fixture.items.length)

        for (const item of result.items) {
          expect(Number.isFinite(item.unitPrice)).toBe(true)
          expect(item.unitPrice).toBeGreaterThanOrEqual(0)
          expect(item.quantity).toBeGreaterThanOrEqual(0)
          expect(item.subtotal).toBe(round2(item.unitPrice * item.quantity))
        }

        // Only meaningful when the caller did not override the subtotal — that
        // override deliberately severs the link to the items.
        if (fixture.config.subtotal === undefined) {
          const summed = round2(
            result.items.reduce((total, item) => total + item.subtotal, 0)
          )

          expect(result.subtotal).toBe(summed)
        }
      })

      it("produces no non-finite amount and no negative total", () => {
        const money = moneyOf(priceFixture(fixture))

        for (const key of MONEY_KEYS) {
          expect(Number.isFinite(money[key])).toBe(true)
        }

        expect(money.total).toBeGreaterThanOrEqual(0)
      })
    })
  }
})

describe("composed prices are indistinguishable from plain ones", () => {
  for (const name of COMPOSED_PRICE_FIXTURE_NAMES) {
    it(`${name} prices identically to ${SINGLE_ITEM_FIXTURE_NAME}`, () => {
      // Resolved INSIDE the test, never in the `describe` body: a throw at
      // collection time aborts the whole file with a suite-level error instead of
      // failing this one assertion, which is a much worse diagnostic.
      //
      // `CartItemInput` has no addon and no variant field. The caller folds the
      // delta into the unit price, so at the engine boundary an addon-composed
      // 500 and a plain 500 are the same input. This assertion pins that
      // convention: if the engine ever grows real addon inputs, it fails here
      // rather than silently double-counting in one app and not the other.
      expect(moneyForFixtureNamed(name)).toEqual(
        moneyForFixtureNamed(SINGLE_ITEM_FIXTURE_NAME)
      )
    })
  }
})

describe("country handling", () => {
  it("falls back to JO for an unrecognised country", () => {
    expect(moneyForFixtureNamed("country-unknown-falls-back-to-jo")).toEqual(
      moneyForFixtureNamed("country-jo-delivery-per-km")
    )
  })

  it("falls back to JO when country is omitted entirely", () => {
    expect(moneyForFixtureNamed("country-omitted-falls-back-to-jo")).toEqual(
      moneyForFixtureNamed("country-jo-delivery-per-km")
    )
  })

  it("resolves a lowercase code rather than falling back", () => {
    expect(moneyForFixtureNamed("country-lowercase-resolves-to-pk")).toEqual(
      moneyForFixtureNamed("free-delivery-country-default-is-inert")
    )
  })

  it("charges PK 20.0/km where JO charges 0.6/km for the same distance", () => {
    const pk = moneyForFixtureNamed("free-delivery-country-default-is-inert")
    const jo = moneyForFixtureNamed("country-jo-delivery-per-km")

    expect(pk.subtotal).toBe(jo.subtotal)
    expect(pk.deliveryFee).toBeGreaterThan(jo.deliveryFee)
  })

  it("charges the same tax in both countries", () => {
    expect(moneyForFixtureNamed("tax-on-cash-jo").tax).toBe(
      moneyForFixtureNamed("tax-on-cash-pk").tax
    )
    expect(moneyForFixtureNamed("tax-on-card-jo").tax).toBe(
      moneyForFixtureNamed("tax-on-card-pk").tax
    )
  })
})

describe("delivery fee", () => {
  it("bills the measured Haversine distance itself at 1.0/km", () => {
    // The anchor for every other distance row. If this number moves, the
    // free-delivery boundary below is no longer sitting on a boundary — it would
    // otherwise keep passing while silently testing nothing.
    expect(
      moneyForFixtureNamed("measured-distance-is-pinned").deliveryFee
    ).toBe(3.56)
  })

  it("is inclusive at exactly the configured free-delivery radius", () => {
    expect(
      moneyForFixtureNamed("free-delivery-boundary-inclusive").deliveryFee
    ).toBe(0)
    expect(
      moneyForFixtureNamed("free-delivery-just-outside-boundary").deliveryFee
    ).toBeGreaterThan(0)
  })

  it("is inclusive at exactly the configured subtotal threshold", () => {
    expect(
      moneyForFixtureNamed("free-delivery-subtotal-threshold-exactly-met")
        .deliveryFee
    ).toBe(0)
    expect(
      moneyForFixtureNamed("free-delivery-subtotal-threshold-just-below")
        .deliveryFee
    ).toBeGreaterThan(0)
  })

  it("is inert on country defaults, because no country config enables it", () => {
    // Pinned finding, not a fix: neither `COUNTRY_FEE_CONFIG` entry sets
    // `freeDeliveryThresholdEnabled`, so a cart that would qualify for free
    // delivery under a tenant override is billed in full on defaults.
    expect(
      moneyForFixtureNamed("free-delivery-country-default-is-inert").deliveryFee
    ).toBe(
      moneyForFixtureNamed("free-delivery-just-outside-boundary").deliveryFee
    )
  })

  it("subtracts a distance threshold before billing, and clamps at zero", () => {
    const billed = moneyForFixtureNamed(
      "distance-threshold-shortens-billable-km"
    ).deliveryFee
    const full = moneyForFixtureNamed(
      "free-delivery-country-default-is-inert"
    ).deliveryFee

    expect(billed).toBeGreaterThan(0)
    expect(billed).toBeLessThan(full)
    expect(
      moneyForFixtureNamed("distance-threshold-above-distance-clamps-to-zero")
        .deliveryFee
    ).toBe(0)
  })

  it("lets an explicit zero beat the distance calculation", () => {
    // The `Number.isFinite(x) && x !== undefined` guard rather than `x ||`. With
    // a truthiness check this row would bill the full distance instead of 0.
    expect(
      moneyForFixtureNamed("explicit-zero-delivery-fee-beats-distance")
        .deliveryFee
    ).toBe(0)
    expect(
      moneyForFixtureNamed("free-delivery-country-default-is-inert").deliveryFee
    ).toBeGreaterThan(0)
  })
})

describe("discount", () => {
  it("lets an explicit zero beat a valid promo", () => {
    expect(
      moneyForFixtureNamed("explicit-zero-discount-beats-promo").discount
    ).toBe(0)
  })

  it("caps at the subtotal without wiping fees or tip", () => {
    // Pinned finding: the cap protects the subtotal ONLY. A fully discounted
    // cart still owes delivery, platform fee and tip.
    const withFees = moneyForFixtureNamed(
      "promo-exceeds-subtotal-with-fees-and-tip"
    )

    expect(withFees.discount).toBe(withFees.subtotal)
    expect(withFees.total).toBe(
      withFees.deliveryFee + withFees.platformFee + withFees.tip
    )
    expect(withFees.total).toBeGreaterThan(0)
  })

  it("treats the usage limit as reached at equality, not one past it", () => {
    expect(moneyForFixtureNamed("promo-usage-limit-reached").discount).toBe(0)
    expect(
      moneyForFixtureNamed("promo-usage-limit-one-below").discount
    ).toBeGreaterThan(0)
  })

  it("honours a future expiry and rejects a past one", () => {
    expect(
      moneyForFixtureNamed("promo-valid-until-far-future").discount
    ).toBeGreaterThan(0)
    expect(moneyForFixtureNamed("promo-expired").discount).toBe(0)
  })

  it("clamps a percentage to the 0-100 range in both directions", () => {
    const over = moneyForFixtureNamed("promo-percentage-above-100-clamps")

    expect(over.discount).toBe(over.subtotal)
    expect(
      moneyForFixtureNamed("promo-percentage-negative-clamps-to-zero").discount
    ).toBe(0)
  })
})

describe("rounding", () => {
  it("rounds per item and then sums, not once over the raw sum", () => {
    // 0.125 x 3: round-then-sum gives 0.39, sum-then-round gives 0.38. Only a
    // row where the two orderings DISAGREE can pin which one the engine uses —
    // `multiple-items-mixed-cart` gives 750.97 either way and proves nothing
    // about ordering.
    const fixture = findPricingFixture("rounding-is-per-item-not-on-the-sum")
    const rawSum = fixture.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    )

    expect(moneyOf(priceFixture(fixture)).subtotal).toBe(0.39)
    expect(round2(rawSum)).toBe(0.38)
  })
})

describe("findPricingFixture", () => {
  it("returns the row with the given name", () => {
    expect(findPricingFixture("zero-items").name).toBe("zero-items")
  })

  it("throws rather than returning undefined for an unknown name", () => {
    expect(() => findPricingFixture("no-such-fixture")).toThrow(
      UNKNOWN_FIXTURE_MESSAGE
    )
  })
})
