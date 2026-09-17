import { describe, expect, it } from "vitest"
import type { CartLine, CartState } from "../../cart/cart-line"
import { EMPTY_CART } from "../../cart/cart-line"
import { cartFingerprint, generateIdempotencyKey } from "../idempotency"

const LINE: CartLine = {
  addons: [],
  combinationId: null,
  combinationLabel: null,
  imageUrl: null,
  inventoryId: "inv-1",
  itemKey: "seekh-platter",
  lineId: "p1|-||",
  modifierSelections: [],
  modifierTotal: 0,
  name: "Seekh Platter",
  productId: "p1",
  quantity: 1,
  unitPrice: 690
}

const CART: CartState = {
  ...EMPTY_CART,
  fulfillment: "delivery",
  lines: [LINE],
  restaurantSlug: "chattha-chargha"
}

describe("generateIdempotencyKey", () => {
  it("mints a fresh, distinct value each call", () => {
    const first = generateIdempotencyKey()
    const second = generateIdempotencyKey()

    expect(first).not.toBe(second)
    expect(first.length).toBeGreaterThan(0)
  })
})

describe("cartFingerprint", () => {
  it("is stable for an unchanged cart", () => {
    expect(cartFingerprint(CART)).toBe(cartFingerprint(CART))
    expect(cartFingerprint(CART)).toBe(cartFingerprint({ ...CART }))
  })

  it("changes when a line's quantity changes", () => {
    const bumped: CartState = {
      ...CART,
      lines: [{ ...LINE, quantity: 2 }]
    }

    expect(cartFingerprint(bumped)).not.toBe(cartFingerprint(CART))
  })

  it("changes when a line is added or removed", () => {
    const twoLines: CartState = {
      ...CART,
      lines: [LINE, { ...LINE, lineId: "p2|-||", productId: "p2" }]
    }

    expect(cartFingerprint(twoLines)).not.toBe(cartFingerprint(CART))
  })

  it("changes when the fulfilment mode changes", () => {
    expect(cartFingerprint({ ...CART, fulfillment: "pickup" })).not.toBe(
      cartFingerprint(CART)
    )
  })

  it("is order-independent — line order alone does not change it", () => {
    const secondLine: CartLine = { ...LINE, lineId: "p2|-||", productId: "p2" }
    const forward: CartState = { ...CART, lines: [LINE, secondLine] }
    const reversed: CartState = { ...CART, lines: [secondLine, LINE] }

    expect(cartFingerprint(forward)).toBe(cartFingerprint(reversed))
  })

  it("is stable for the empty cart", () => {
    expect(cartFingerprint(EMPTY_CART)).toBe(cartFingerprint(EMPTY_CART))
  })

  it("does not collide when one line's own id embeds the exact bytes an unescaped join would produce for two lines", () => {
    // Pre-fix: `${lineId}:${quantity}` entries joined with "," meant a
    // SINGLE line whose id happened to equal "p1:1,p2" (quantity 2) serialised
    // to the byte-identical "p1:1,p2:2" that TWO real lines ("p1" qty 1,
    // "p2" qty 2) also produce — two structurally different carts, one
    // fingerprint. `encodeURIComponent` on each id breaks the collision.
    const twoRealLines: CartState = {
      ...CART,
      lines: [
        { ...LINE, lineId: "p1", quantity: 1 },
        { ...LINE, lineId: "p2", quantity: 2 }
      ]
    }
    const oneLineWithEmbeddedDelimiters: CartState = {
      ...CART,
      lines: [{ ...LINE, lineId: "p1:1,p2", quantity: 2 }]
    }

    expect(cartFingerprint(twoRealLines)).not.toBe(
      cartFingerprint(oneLineWithEmbeddedDelimiters)
    )
  })
})
