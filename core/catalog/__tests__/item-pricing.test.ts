import { describe, expect, it } from "vitest"
import {
  combinationPrice,
  itemLineTotal,
  lowestCombinationPrice,
  optionPriceDeltas,
  parsePriceModifier
} from "../item-pricing"

describe("parsePriceModifier", () => {
  it.each([
    ["a decimal string", "0.00", 0],
    ["a whole string", "50", 50],
    ["a negative string", "-50", -50],
    ["a negative decimal string", "-12.50", -12.5],
    ["a number", 75, 75],
    ["zero", 0, 0]
  ])("reads %s", (_label, raw, expected) => {
    expect(parsePriceModifier(raw)).toBe(expected)
  })

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an empty string", ""],
    ["free text", "n/a"],
    ["exponent notation", "1e3"],
    ["a trailing unit", "50 PKR"],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["an object", { amount: 50 }],
    ["a boolean", true]
  ])("answers 0 for %s rather than throwing", (_label, raw) => {
    // A modifier is a delta on a price that already parsed, so an unreadable
    // one costs that option its surcharge — never the item its page.
    expect(parsePriceModifier(raw)).toBe(0)
  })

  it("keeps negatives, which priceSchema's PRICE_MIN floor would reject", () => {
    expect(parsePriceModifier("-50")).toBeLessThan(0)
  })
})

describe("combinationPrice", () => {
  it("returns a legitimate zero rather than substituting a base price", () => {
    // THE DEFECT THIS FUNCTION EXISTS TO REFUSE. Mobile's
    // `combinationPriceOrBase` discards anything not `> 0` in favour of the
    // item's base price, so a free size silently charges full price.
    expect(combinationPrice({ price: 0 })).toBe(0)
  })

  it("returns the price the branch set", () => {
    expect(combinationPrice({ price: 450 })).toBe(450)
  })
})

describe("lowestCombinationPrice", () => {
  it("answers null for an item with no combinations", () => {
    // `null` rather than `0`: zero is a real price this domain must express.
    expect(lowestCombinationPrice([])).toBeNull()
  })

  it("finds the cheapest", () => {
    expect(
      lowestCombinationPrice([{ price: 450 }, { price: 300 }, { price: 900 }])
    ).toBe(300)
  })

  it("counts a zero-priced combination as the cheapest", () => {
    expect(lowestCombinationPrice([{ price: 450 }, { price: 0 }])).toBe(0)
  })

  it("does not skip a sold-out combination", () => {
    // A price is what the dish costs, which does not stop being true because
    // the kitchen has run out of it.
    expect(lowestCombinationPrice([{ price: 300 }, { price: 250 }])).toBe(250)
  })
})

describe("optionPriceDeltas", () => {
  const COMBINATIONS = [
    { options: [{ id: "small" }, { id: "beef" }], price: 300 },
    { options: [{ id: "large" }, { id: "beef" }], price: 450 },
    { options: [{ id: "large" }, { id: "chicken" }], price: 500 }
  ]

  it("prices each option against the cheapest line on the item", () => {
    const deltas = optionPriceDeltas(COMBINATIONS)

    expect(deltas.get("small")).toBe(0)
    expect(deltas.get("large")).toBe(150)
    expect(deltas.get("beef")).toBe(0)
    expect(deltas.get("chicken")).toBe(200)
  })

  it("takes the LOWEST line an option appears in, not the first", () => {
    // `beef` appears at 300 and at 450; the figure that means anything before a
    // full selection exists is the cheapest reachable line.
    expect(
      optionPriceDeltas([
        { options: [{ id: "beef" }], price: 450 },
        { options: [{ id: "beef" }], price: 300 }
      ]).get("beef")
    ).toBe(0)
  })

  it("is empty when there are no combinations", () => {
    expect(optionPriceDeltas([]).size).toBe(0)
  })

  it("keeps a zero-priced combination in the denominator", () => {
    // Mobile skips any combination priced `<= 0`, which is
    // `combinationPriceOrBase` one layer on.
    const deltas = optionPriceDeltas([
      { options: [{ id: "free" }], price: 0 },
      { options: [{ id: "paid" }], price: 250 }
    ])

    expect(deltas.get("free")).toBe(0)
    expect(deltas.get("paid")).toBe(250)
  })

  it("reads 0 everywhere on the live shape, where every option costs the same", () => {
    const deltas = optionPriceDeltas([
      { options: [{ id: "a" }], price: 450 },
      { options: [{ id: "b" }], price: 450 }
    ])

    expect([...deltas.values()]).toEqual([0, 0])
  })
})

describe("itemLineTotal", () => {
  it("prices the plain item that is 73% of production", () => {
    const line = itemLineTotal({
      addons: [],
      basePrice: 450,
      combination: null,
      options: [],
      quantity: 1
    })

    expect(line).toEqual({
      addonsTotal: 0,
      optionsTotal: 0,
      quantity: 1,
      total: 450,
      unitBase: 450,
      unitTotal: 450
    })
  })

  it("prefers the combination's price over the base price", () => {
    expect(
      itemLineTotal({
        addons: [],
        basePrice: 450,
        combination: { price: 900 },
        options: [],
        quantity: 1
      }).unitBase
    ).toBe(900)
  })

  it("uses a combination priced zero rather than falling back to the base", () => {
    // The whole point of `combinationPrice`, asserted at the layer that would
    // otherwise hide it.
    expect(
      itemLineTotal({
        addons: [],
        basePrice: 450,
        combination: { price: 0 },
        options: [],
        quantity: 1
      }).total
    ).toBe(0)
  })

  it("adds every chosen modifier and every chosen add-on", () => {
    const line = itemLineTotal({
      addons: [{ price: 120 }, { price: 80 }],
      basePrice: 0,
      combination: { price: 450 },
      options: [{ priceModifier: 50 }, { priceModifier: 25 }],
      quantity: 1
    })

    expect(line.optionsTotal).toBe(75)
    expect(line.addonsTotal).toBe(200)
    expect(line.unitTotal).toBe(725)
    expect(line.total).toBe(725)
  })

  it("lets a negative modifier reduce the line", () => {
    expect(
      itemLineTotal({
        addons: [],
        basePrice: 0,
        combination: { price: 450 },
        options: [{ priceModifier: -50 }],
        quantity: 1
      }).unitTotal
    ).toBe(400)
  })

  it("multiplies the whole unit, not only its base", () => {
    // The seam mw-2-1 plugs into: quantity is a parameter here even though
    // mw-1-7 always passes 1 and renders no stepper.
    const line = itemLineTotal({
      addons: [{ price: 100 }],
      basePrice: 0,
      combination: { price: 450 },
      options: [{ priceModifier: 50 }],
      quantity: 3
    })

    expect(line.unitTotal).toBe(600)
    expect(line.total).toBe(1800)
    expect(line.quantity).toBe(3)
  })

  it("answers 0 at quantity 0 rather than the unit price", () => {
    expect(
      itemLineTotal({
        addons: [],
        basePrice: 450,
        combination: null,
        options: [],
        quantity: 0
      }).total
    ).toBe(0)
  })

  it("computes no fee, no tax and no discount", () => {
    // `calculatePricing` in `@/constants` owns all of those and takes the
    // number this function returns. Nothing here may grow one.
    const line = itemLineTotal({
      addons: [],
      basePrice: 1000,
      combination: null,
      options: [],
      quantity: 1
    })

    expect(line.total).toBe(1000)
    expect(Object.keys(line).sort()).toEqual([
      "addonsTotal",
      "optionsTotal",
      "quantity",
      "total",
      "unitBase",
      "unitTotal"
    ])
  })
})
