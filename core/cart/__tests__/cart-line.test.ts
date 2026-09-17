import { describe, expect, it } from "vitest"
import {
  addLine,
  buildCartLine,
  type CartableItem,
  cartItemCount,
  type CartRestaurantRef,
  cartSubtotal,
  cartToPricingItems,
  EMPTY_CART,
  LINE_QUANTITY_MAX,
  lineProblems,
  lineTotal,
  readCartState,
  setLineQuantity
} from "../cart-line"
// Lives in `core/catalog` for byte reasons (see its header) but is exercised
// here, against this file's cart-line fixtures.
import { selectionFromLine } from "../../catalog/selection-from-line"

/** An item with one size picker, one capped modifier group and one add-on. */
const ITEM: CartableItem = {
  addons: [
    {
      id: "link-raita",
      inventoryId: "inv-raita",
      isAvailable: true,
      isRequired: false,
      name: "Raita",
      price: 90,
      productId: "product-raita",
      selectedCombinationIds: null
    },
    {
      id: "link-masala",
      inventoryId: null,
      isAvailable: true,
      isRequired: true,
      name: "Masala rub",
      price: 60,
      productId: "product-masala",
      selectedCombinationIds: ["combo-large"]
    }
  ],
  basePrice: 450,
  combinations: [
    {
      id: "combo-small",
      inventoryId: "inv-small",
      isAvailable: true,
      options: [{ id: "size-small", variantId: "variant-size" }],
      price: 450
    },
    {
      id: "combo-large",
      inventoryId: "inv-large",
      isAvailable: true,
      options: [{ id: "size-large", variantId: "variant-size" }],
      price: 650
    }
  ],
  id: "product-1",
  imageUrl: null,
  inventoryId: null,
  key: "seekh-platter",
  name: "Seekh Platter",
  variants: [
    {
      id: "variant-size",
      isRequired: true,
      maxSelections: null,
      minSelections: 0,
      name: "Size",
      options: [
        { id: "size-small", name: "Small", priceModifier: 0 },
        { id: "size-large", name: "Large", priceModifier: 0 }
      ],
      selectionType: "single"
    },
    {
      id: "variant-extras",
      isRequired: false,
      maxSelections: 2,
      minSelections: 0,
      name: "Extras",
      options: [
        { id: "extra-naan", name: "Naan", priceModifier: 80 },
        { id: "extra-fries", name: "Fries", priceModifier: 150 }
      ],
      selectionType: "multiple"
    }
  ]
}

/** A plain item — the 73% shape with nothing to configure. */
const PLAIN: CartableItem = {
  addons: [],
  basePrice: 690,
  combinations: [],
  id: "product-plain",
  imageUrl: "https://cdn.test.invalid/a.jpg",
  inventoryId: "inv-plain",
  key: "chargha-pulao",
  name: "Chargha Pulao",
  variants: []
}

const REF: CartRestaurantRef = {
  branchCoordinates: null,
  deliveryRule: null,
  citySlug: "gujranwala",
  deliveryFee: 70,
  fulfillment: "delivery",
  minimumOrder: 500,
  restaurantName: "Chattha Chargha",
  restaurantSlug: "chattha-chargha",
  tenantId: "tenant-1"
}

const SMALL_SELECTION = {
  addonIds: [],
  modifiers: {},
  options: { "variant-size": "size-small" }
}

describe("lineProblems", () => {
  it("answers nothing for a complete plain item", () => {
    expect(
      lineProblems(PLAIN, { addonIds: [], modifiers: {}, options: {} })
    ).toEqual([])
  })

  it("names an incomplete selection", () => {
    expect(
      lineProblems(ITEM, { addonIds: [], modifiers: {}, options: {} })
    ).toContain("incomplete-selection")
  })

  it("names a missing required add-on — the rule the backend never checks", () => {
    // Masala is required but gated to combo-large.
    expect(
      lineProblems(ITEM, {
        addonIds: [],
        modifiers: {},
        options: { "variant-size": "size-large" }
      })
    ).toEqual(["required-addon-missing"])
  })

  it("does not demand a required add-on its gate has withdrawn", () => {
    expect(lineProblems(ITEM, SMALL_SELECTION)).toEqual([])
  })
})

describe("buildCartLine", () => {
  it("refuses an unorderable selection", () => {
    expect(
      buildCartLine(ITEM, { addonIds: [], modifiers: {}, options: {} }, 1)
    ).toBeNull()
  })

  it("prices combination + modifiers into unitPrice and keeps add-ons out of it", () => {
    const line = buildCartLine(
      ITEM,
      {
        addonIds: ["link-raita"],
        modifiers: { "variant-extras": ["extra-naan"] },
        options: { "variant-size": "size-small" }
      },
      2
    )

    expect(line).not.toBeNull()
    // 450 (combo) + 80 (naan) — raita's 90 lives on the add-on, not the unit.
    expect(line?.unitPrice).toBe(530)
    expect(line?.modifierTotal).toBe(80)
    expect(line?.addons).toEqual([
      {
        addonId: "link-raita",
        inventoryId: "inv-raita",
        name: "Raita",
        price: 90,
        productId: "product-raita"
      }
    ])
    expect(line?.inventoryId).toBe("inv-small")
    expect(line?.combinationId).toBe("combo-small")
    expect(line?.combinationLabel).toBe("Small")
    expect(line?.quantity).toBe(2)
    // (530 + 90) * 2 — the same figure the overlay's total line showed.
    expect(line === null ? null : lineTotal(line)).toBe(1240)
  })

  it("stores the payload-shaped modifier selections", () => {
    const line = buildCartLine(
      ITEM,
      {
        addonIds: [],
        modifiers: { "variant-extras": ["extra-naan", "extra-fries"] },
        options: SMALL_SELECTION.options
      },
      1
    )

    expect(line?.modifierSelections).toEqual([
      {
        selectedOptions: [
          { optionId: "extra-naan", optionName: "Naan", priceModifier: 80 },
          { optionId: "extra-fries", optionName: "Fries", priceModifier: 150 }
        ],
        selectionType: "multiple",
        variantId: "variant-extras",
        variantName: "Extras"
      }
    ])
  })

  it("falls back to the item's own inventoryId when no combination resolves (the 73% shape)", () => {
    expect(
      buildCartLine(PLAIN, { addonIds: [], modifiers: {}, options: {} }, 1)
        ?.inventoryId
    ).toBe("inv-plain")
  })

  it("clamps quantity into the order API's 1..100", () => {
    expect(buildCartLine(PLAIN, SMALL_SELECTION, 0)?.quantity).toBe(1)
    expect(buildCartLine(PLAIN, SMALL_SELECTION, 250)?.quantity).toBe(
      LINE_QUANTITY_MAX
    )
  })

  it("gives equal configurations equal lineIds and different add-ons different ones", () => {
    const a = buildCartLine(ITEM, SMALL_SELECTION, 1)
    const b = buildCartLine(ITEM, SMALL_SELECTION, 3)
    const c = buildCartLine(
      ITEM,
      { ...SMALL_SELECTION, addonIds: ["link-raita"] },
      1
    )

    expect(a?.lineId).toBe(b?.lineId)
    expect(a?.lineId).not.toBe(c?.lineId)
  })
})

describe("cart state", () => {
  const line = buildCartLine(ITEM, SMALL_SELECTION, 1)
  if (line === null) {
    throw new Error("fixture line must build")
  }

  it("adds and merges equal configurations by summing quantity", () => {
    const once = addLine(EMPTY_CART, REF, line)
    const twice = addLine(once, REF, line)

    expect(twice.lines).toHaveLength(1)
    expect(twice.lines[0]?.quantity).toBe(2)
    expect(twice.restaurantSlug).toBe(REF.restaurantSlug)
    expect(cartItemCount(twice)).toBe(2)
  })

  it("captures the branch's fee fields into the cart at add time", () => {
    const cart = addLine(EMPTY_CART, REF, line)

    expect(cart.deliveryFee).toBe(70)
    expect(cart.minimumOrder).toBe(500)

    const noFees = addLine(EMPTY_CART, { ...REF, deliveryFee: null }, line)

    expect(noFees.deliveryFee).toBeNull()
  })

  it("sets, clamps and removes by quantity, forgetting the restaurant when emptied", () => {
    const cart = addLine(EMPTY_CART, REF, line)

    expect(setLineQuantity(cart, line.lineId, 5).lines[0]?.quantity).toBe(5)
    expect(setLineQuantity(cart, line.lineId, 500).lines[0]?.quantity).toBe(
      LINE_QUANTITY_MAX
    )
    expect(setLineQuantity(cart, line.lineId, 0)).toEqual(EMPTY_CART)
  })

  it("subtotals lines plus their add-ons, times quantity", () => {
    const withAddon = buildCartLine(
      ITEM,
      { ...SMALL_SELECTION, addonIds: ["link-raita"] },
      2
    )
    if (withAddon === null) {
      throw new Error("fixture line must build")
    }
    const cart = addLine(addLine(EMPTY_CART, REF, line), REF, withAddon)

    // 450*1 + (450+90)*2
    expect(cartSubtotal(cart)).toBe(450 + 1080)
  })

  it("flattens for calculatePricing exactly as mobile does — add-ons as their own priced entries", () => {
    const withAddon = buildCartLine(
      ITEM,
      { ...SMALL_SELECTION, addonIds: ["link-raita"] },
      2
    )
    if (withAddon === null) {
      throw new Error("fixture line must build")
    }
    const items = cartToPricingItems(addLine(EMPTY_CART, REF, withAddon))

    expect(items).toEqual([
      {
        inventoryId: "inv-small",
        price: 450,
        productId: "product-1",
        quantity: 2
      },
      {
        inventoryId: "inv-raita",
        price: 90,
        productId: "product-raita",
        quantity: 2
      }
    ])
  })
})

describe("readCartState", () => {
  const persisted = addLine(
    EMPTY_CART,
    REF,
    buildCartLine(ITEM, SMALL_SELECTION, 2) as NonNullable<
      ReturnType<typeof buildCartLine>
    >
  )

  it("round-trips its own JSON", () => {
    expect(readCartState(JSON.parse(JSON.stringify(persisted)))).toEqual(
      persisted
    )
  })

  it.each([
    ["null", null],
    ["a string", "cart"],
    ["a shapeless object", { lines: "no" }],
    ["a cart with no restaurant", { ...persisted, restaurantSlug: 7 }]
  ])("degrades %s to the empty cart", (_label, raw) => {
    expect(readCartState(raw)).toEqual(EMPTY_CART)
  })

  it("drops a corrupt line whole and keeps the readable one", () => {
    const raw = JSON.parse(JSON.stringify(persisted)) as {
      lines: unknown[]
    }
    raw.lines.push({ lineId: "broken", quantity: "many" })

    expect(readCartState(raw).lines).toHaveLength(1)
  })

  it("degrades a cart whose every line is corrupt to empty", () => {
    expect(readCartState({ ...persisted, lines: [{ lineId: 1 }] })).toEqual(
      EMPTY_CART
    )
  })

  it("keeps a legacy cart's lines and degrades its absent fees to null", () => {
    // A cart persisted before `mw-2-2` — the fee fields simply do not exist.
    const {
      deliveryFee: _fee,
      minimumOrder: _minimum,
      ...legacy
    } = JSON.parse(JSON.stringify(persisted)) as Record<string, unknown>

    const read = readCartState(legacy)

    expect(read.lines).toHaveLength(1)
    expect(read.deliveryFee).toBeNull()
    expect(read.minimumOrder).toBeNull()
  })

  it("degrades a corrupt fee to null without costing the cart", () => {
    const read = readCartState({ ...persisted, deliveryFee: "70" })

    expect(read.deliveryFee).toBeNull()
    expect(read.lines).toHaveLength(1)
    expect(read.minimumOrder).toBe(500)
  })
})

describe("selectionFromLine", () => {
  const line = buildCartLine(
    ITEM,
    {
      addonIds: ["link-raita"],
      modifiers: { "variant-extras": ["extra-naan", "extra-fries"] },
      options: { "variant-size": "size-small" }
    },
    2
  )
  if (line === null) {
    throw new Error("fixture line must build")
  }

  it("round-trips a stored line back to its exact selection", () => {
    expect(selectionFromLine(ITEM, line)).toEqual({
      addonIds: ["link-raita"],
      modifiers: { "variant-extras": ["extra-naan", "extra-fries"] },
      options: { "variant-size": "size-small" }
    })
  })

  it("prefills nothing single-select when the combination is gone", () => {
    const gone: CartableItem = {
      ...ITEM,
      combinations: ITEM.combinations.filter(
        (combination) => combination.id !== "combo-small"
      )
    }

    expect(selectionFromLine(gone, line).options).toEqual({})
  })

  it("keeps the valid remainder when one modifier option was withdrawn", () => {
    const withdrawn: CartableItem = {
      ...ITEM,
      variants: ITEM.variants.map((variant) =>
        variant.id === "variant-extras"
          ? {
              ...variant,
              options: variant.options.filter(
                (option) => option.id !== "extra-naan"
              )
            }
          : variant
      )
    }

    expect(selectionFromLine(withdrawn, line).modifiers).toEqual({
      "variant-extras": ["extra-fries"]
    })
  })

  it("drops an add-on the item no longer offers", () => {
    const withoutRaita: CartableItem = { ...ITEM, addons: [] }

    expect(selectionFromLine(withoutRaita, line).addonIds).toEqual([])
  })
})

describe("readCartState — branch identity (mw-2-6)", () => {
  const stored = addLine(
    EMPTY_CART,
    REF,
    buildCartLine(ITEM, SMALL_SELECTION, 1) as NonNullable<
      ReturnType<typeof buildCartLine>
    >
  )

  it("carries the branch id and fulfilment onto the cart", () => {
    expect(stored.tenantId).toBe("tenant-1")
    expect(stored.fulfillment).toBe("delivery")
  })

  it("degrades a cart saved before these fields to null, not to a guess", () => {
    // The legacy-cart matrix row: no migration, nullable by construction. The
    // checkout screen skips the coverage check rather than inventing a branch.
    const { tenantId, fulfillment, ...legacy } = JSON.parse(
      JSON.stringify(stored)
    )
    const read = readCartState(legacy)

    expect(read.tenantId).toBeNull()
    expect(read.fulfillment).toBeNull()
    expect(read.lines).toHaveLength(1)
  })

  it.each([
    ["an empty string", ""],
    ["whitespace", "   "],
    ["a number", 7],
    ["null", null]
  ])("reads %s as no branch id", (_label, value) => {
    const read = readCartState({
      ...JSON.parse(JSON.stringify(stored)),
      tenantId: value
    })

    expect(read.tenantId).toBeNull()
  })

  it("refuses a fulfilment mode outside the shared enum", () => {
    // Must degrade to null (ask the question), never to something that could
    // read as "pickup" and silently skip the coverage check.
    const read = readCartState({
      ...JSON.parse(JSON.stringify(stored)),
      fulfillment: "PICKUP"
    })

    expect(read.fulfillment).toBeNull()
  })

  it.each([
    "delivery",
    "pickup",
    "hybrid"
  ])("keeps the known fulfilment mode %s", (mode) => {
    const read = readCartState({
      ...JSON.parse(JSON.stringify(stored)),
      fulfillment: mode
    })

    expect(read.fulfillment).toBe(mode)
  })
})

describe("readCartState — the delivery rule and branch pin (mw-4-2)", () => {
  const RULE = {
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
  const PIN = { latitude: 31.5, longitude: 74.35 }

  const line = buildCartLine(ITEM, SMALL_SELECTION, 1)
  if (line === null) {
    throw new Error("fixture line must build")
  }
  const stored = addLine(
    EMPTY_CART,
    { ...REF, branchCoordinates: PIN, deliveryRule: RULE },
    line
  )

  /**
   * The stored cart as JSON, with one member replaced.
   * @param patch - Members to override on the parsed object
   * @returns The narrowed cart
   */
  function readWith(patch: Record<string, unknown>) {
    return readCartState({ ...JSON.parse(JSON.stringify(stored)), ...patch })
  }

  it("carries the rule and the pin onto the cart and back out of storage", () => {
    expect(stored.deliveryRule).toEqual(RULE)
    expect(stored.branchCoordinates).toEqual(PIN)
    expect(readCartState(JSON.parse(JSON.stringify(stored)))).toEqual(stored)
  })

  it("degrades a cart saved before these fields to null, not to a guess", () => {
    const { deliveryRule, branchCoordinates, ...legacy } = JSON.parse(
      JSON.stringify(stored)
    )
    const read = readCartState(legacy)

    expect(read.deliveryRule).toBeNull()
    expect(read.branchCoordinates).toBeNull()
    // THE LEGACY ROW: the lines survive, so the cart prices exactly as before.
    expect(read.lines).toHaveLength(1)
  })

  it.each([
    ["null", null],
    ["a string", "rule"],
    ["a missing base fee", { ...RULE, defaultDeliveryFee: undefined }],
    ["a stringly base fee", { ...RULE, defaultDeliveryFee: "50" }],
    ["a missing per-km rate", { ...RULE, deliveryFeePerKm: undefined }],
    ["a missing free threshold", { ...RULE, freeDeliveryThreshold: undefined }],
    ["a missing cash rate", { ...RULE, taxRateCash: undefined }],
    ["a non-boolean free flag", { ...RULE, freeDeliveryThresholdEnabled: 1 }],
    [
      "an infinite fee",
      { ...RULE, defaultDeliveryFee: Number.POSITIVE_INFINITY }
    ]
  ])("reads %s as no rule at all", (_label, value) => {
    expect(readWith({ deliveryRule: value }).deliveryRule).toBeNull()
  })

  it.each([
    ["platformFee"],
    ["riderSharePercentage"],
    ["taxRateCard"]
  ])("keeps a rule missing %s — web reads none of them", (key) => {
    // The inverse of the list above. Rejecting the whole rule over a field
    // nothing consumes would drop the tax row and the distance fee for every
    // cart on the site the day the backend stopped sending it.
    const read = readWith({ deliveryRule: { ...RULE, [key]: undefined } })

    expect(read.deliveryRule).not.toBeNull()
    expect(read.deliveryRule?.taxRateCash).toBe(0.05)
    expect(read.deliveryRule?.[key as "platformFee"]).toBe(0)
  })

  it("collapses an absent threshold onto null — the UNLIMITED reading", () => {
    const read = readWith({
      deliveryRule: { ...RULE, distanceThresholdKm: undefined }
    })

    expect(read.deliveryRule?.distanceThresholdKm).toBeNull()
  })

  it("drops the optional radii it cannot read rather than defaulting them", () => {
    const read = readWith({
      deliveryRule: {
        ...RULE,
        freeDeliveryDistanceKm: "3",
        maxFreeDeliveryDistanceKm: null
      }
    })

    expect(read.deliveryRule?.freeDeliveryDistanceKm).toBeUndefined()
    expect(read.deliveryRule?.maxFreeDeliveryDistanceKm).toBeUndefined()
    expect(read.deliveryRule?.maxDeliveryDistanceKm).toBeUndefined()
  })

  it("keeps a max radius when one was somehow stored", () => {
    expect(
      readWith({ deliveryRule: { ...RULE, maxDeliveryDistanceKm: 12 } })
        .deliveryRule?.maxDeliveryDistanceKm
    ).toBe(12)
  })

  it("keeps an already-captured rule when a later add re-reads it as null", () => {
    // `page.tsx` degrades a failed rule read to `null`, so one transient
    // upstream blip on a second add must not strip tax off a live cart.
    const second = buildCartLine(ITEM, SMALL_SELECTION, 1)
    if (second === null) {
      throw new Error("fixture line must build")
    }
    const after = addLine(
      stored,
      { ...REF, branchCoordinates: null, deliveryRule: null },
      second
    )

    expect(after.deliveryRule).toEqual(RULE)
    expect(after.branchCoordinates).toEqual(PIN)
  })

  it("takes a FRESH rule and pin over the captured ones", () => {
    const second = buildCartLine(ITEM, SMALL_SELECTION, 1)
    if (second === null) {
      throw new Error("fixture line must build")
    }
    const fresher = { ...RULE, taxRateCash: 0.17 }
    const pin = { latitude: 32, longitude: 74 }
    const after = addLine(
      stored,
      { ...REF, branchCoordinates: pin, deliveryRule: fresher },
      second
    )

    expect(after.deliveryRule?.taxRateCash).toBe(0.17)
    expect(after.branchCoordinates).toEqual(pin)
  })

  it.each([
    ["null", null],
    ["a string", "31.5,74.35"],
    ["an out-of-range latitude", { latitude: 500, longitude: 74.35 }],
    ["an out-of-range longitude", { latitude: 31.5, longitude: 400 }],
    ["a half pin", { latitude: 31.5 }],
    ["a stringly pin", { latitude: "31.5", longitude: "74.35" }],
    [
      "an infinite pin",
      { latitude: Number.POSITIVE_INFINITY, longitude: 74.35 }
    ]
  ])("reads %s as no branch pin", (_label, value) => {
    expect(readWith({ branchCoordinates: value }).branchCoordinates).toBeNull()
  })
})
