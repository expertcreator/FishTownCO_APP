import { describe, expect, it } from "vitest"
import {
  addLine,
  type CartLine,
  type CartRestaurantRef,
  EMPTY_CART
} from "../cart-line"
import {
  addCartLine,
  cartFor,
  cartsItemCount,
  EMPTY_CARTS,
  readCartsState,
  removeLines,
  setCartLineQuantity,
  upsertCart
} from "../carts"

const REF: CartRestaurantRef = {
  branchCoordinates: null,
  citySlug: "gujranwala",
  deliveryFee: 70,
  deliveryRule: null,
  fulfillment: "delivery",
  minimumOrder: 500,
  restaurantName: "Chattha Chargha",
  restaurantSlug: "chattha-chargha",
  tenantId: "tenant-1"
}

const OTHER: CartRestaurantRef = {
  ...REF,
  citySlug: "lahore",
  restaurantName: "Butt Karahi",
  restaurantSlug: "butt-karahi",
  tenantId: "tenant-2"
}

/** A plain line, the 73% shape with nothing configured. */
function line(lineId: string, quantity = 1): CartLine {
  return {
    addons: [],
    combinationId: null,
    combinationLabel: null,
    imageUrl: null,
    inventoryId: "inv-plain",
    itemKey: "chargha-pulao",
    lineId,
    modifierSelections: [],
    modifierTotal: 0,
    name: "Chargha Pulao",
    productId: "product-plain",
    quantity,
    unitPrice: 690
  }
}

/** Two restaurants, two lines under the first, in first-add order. */
const TWO = addCartLine(
  addCartLine(addCartLine(EMPTY_CARTS, REF, line("a", 2)), REF, line("b")),
  OTHER,
  line("c", 3)
)

describe("cartFor", () => {
  it("answers the empty cart for a restaurant with none", () => {
    expect(cartFor(TWO, "kfc")).toBe(EMPTY_CART)
  })

  it("answers the restaurant's own cart", () => {
    expect(cartFor(TWO, OTHER.restaurantSlug).lines).toHaveLength(1)
  })
})

describe("addCartLine", () => {
  it("lets a second restaurant coexist instead of clearing the first", () => {
    expect(TWO.carts).toHaveLength(2)
    expect(TWO.carts[0]?.restaurantSlug).toBe(REF.restaurantSlug)
    expect(TWO.carts[0]?.lines.map((entry) => entry.lineId)).toEqual(["a", "b"])
    expect(TWO.carts[1]?.restaurantSlug).toBe(OTHER.restaurantSlug)
    expect(TWO.carts[1]?.citySlug).toBe("lahore")
  })

  it("merges an equal configuration into quantity", () => {
    const merged = addCartLine(TWO, REF, line("a", 1))

    expect(merged.carts[0]?.lines).toHaveLength(2)
    expect(merged.carts[0]?.lines[0]?.quantity).toBe(3)
  })
})

describe("upsertCart", () => {
  it("replaces in place, keeping first-add order", () => {
    const next = upsertCart(TWO, REF.restaurantSlug, {
      ...cartFor(TWO, REF.restaurantSlug),
      lines: [line("a", 9)]
    })

    expect(next.carts.map((cart) => cart.restaurantSlug)).toEqual([
      REF.restaurantSlug,
      OTHER.restaurantSlug
    ])
    expect(next.carts[0]?.lines[0]?.quantity).toBe(9)
  })

  it("drops the entry when the cart has no lines left", () => {
    const next = upsertCart(TWO, REF.restaurantSlug, EMPTY_CART)

    expect(next.carts.map((cart) => cart.restaurantSlug)).toEqual([
      OTHER.restaurantSlug
    ])
  })
})

describe("setCartLineQuantity", () => {
  it("sets a quantity without touching the other cart", () => {
    const next = setCartLineQuantity(TWO, REF.restaurantSlug, "a", 5)

    expect(next.carts[0]?.lines[0]?.quantity).toBe(5)
    expect(next.carts[1]?.lines[0]?.quantity).toBe(3)
  })

  it("drops the cart when zero empties it", () => {
    const one = addCartLine(EMPTY_CARTS, REF, line("a"))

    expect(setCartLineQuantity(one, REF.restaurantSlug, "a", 0)).toEqual(
      EMPTY_CARTS
    )
  })
})

describe("removeLines", () => {
  it("removes only the named lines and ignores unknown ids", () => {
    const next = removeLines(TWO, REF.restaurantSlug, ["a", "nope"])

    expect(next.carts[0]?.lines.map((entry) => entry.lineId)).toEqual(["b"])
    expect(next.carts).toHaveLength(2)
  })

  it("drops the cart when every line is taken", () => {
    const next = removeLines(TWO, REF.restaurantSlug, ["a", "b"])

    expect(next.carts.map((cart) => cart.restaurantSlug)).toEqual([
      OTHER.restaurantSlug
    ])
  })
})

describe("cartsItemCount", () => {
  it("sums every cart, which is what the global badge shows", () => {
    expect(cartsItemCount(TWO)).toBe(6)
    expect(cartsItemCount(EMPTY_CARTS)).toBe(0)
  })
})

describe("readCartsState", () => {
  it("reads a v1 single-cart blob as one cart", () => {
    const v1 = JSON.parse(JSON.stringify(addLine(EMPTY_CART, REF, line("a"))))

    expect(readCartsState(v1).carts.map((cart) => cart.restaurantSlug)).toEqual(
      [REF.restaurantSlug]
    )
  })

  it("reads the v2 shape and drops only the corrupt entry", () => {
    const raw = JSON.parse(JSON.stringify(TWO)) as { carts: unknown[] }

    raw.carts[0] = { lines: "not-an-array", restaurantSlug: 5 }

    expect(
      readCartsState(raw).carts.map((cart) => cart.restaurantSlug)
    ).toEqual([OTHER.restaurantSlug])
  })

  it("keeps the first of a repeated restaurant", () => {
    const first = cartFor(TWO, REF.restaurantSlug)
    const raw = JSON.parse(
      JSON.stringify({ carts: [first, { ...first, lines: [line("z")] }] })
    )
    const read = readCartsState(raw)

    expect(read.carts).toHaveLength(1)
    expect(read.carts[0]?.lines.map((entry) => entry.lineId)).toEqual([
      "a",
      "b"
    ])
  })

  it("degrades unreadable state to no carts", () => {
    expect(readCartsState(null)).toEqual(EMPTY_CARTS)
    expect(readCartsState("carts")).toEqual(EMPTY_CARTS)
    expect(readCartsState({ carts: "nope" })).toEqual(EMPTY_CARTS)
    expect(readCartsState({ carts: [null, 7] })).toEqual(EMPTY_CARTS)
  })
})
