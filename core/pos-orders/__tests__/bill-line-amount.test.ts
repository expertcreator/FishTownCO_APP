import { describe, expect, test } from "bun:test"
import {
  billAmountsIncludingAddons,
  billLineAddonAmount,
  billLineProductAmount,
  billLineTotal
} from "../bill-line-amount"

describe("billLineProductAmount", () => {
  test("keeps the parent product price off addon rows", () => {
    expect(
      billLineProductAmount({
        price: 100,
        subtotal: 100,
        quantity: 1,
        addons: [{ price: 100, quantity: 1 }]
      })
    ).toBe(100)
  })

  test("subtracts addons when only a bundled subtotal is present", () => {
    expect(
      billLineProductAmount({
        subtotal: 200,
        quantity: 1,
        addons: [{ price: 100, quantity: 1 }]
      })
    ).toBe(100)
  })
})

describe("billLineTotal", () => {
  test("adds addon prices when the line subtotal is product-only", () => {
    expect(
      billLineTotal({
        price: 500,
        subtotal: 500,
        quantity: 1,
        addons: [{ price: 700, quantity: 1 }]
      })
    ).toBe(1200)
  })

  test("does not double-count when the subtotal already includes add-ons", () => {
    expect(
      billLineTotal({
        price: 500,
        subtotal: 1200,
        quantity: 1,
        addons: [{ price: 700, quantity: 1 }]
      })
    ).toBe(1200)
  })
})

describe("billLineAddonAmount", () => {
  test("sums addon unit price times quantity", () => {
    expect(
      billLineAddonAmount([
        { price: 80, quantity: 3 },
        { price: 0, quantity: 1 }
      ])
    ).toBe(240)
  })
})

describe("billAmountsIncludingAddons", () => {
  test("raises the bill when server totals omit add-on prices", () => {
    expect(
      billAmountsIncludingAddons({
        subtotal: 500,
        total: 500,
        items: [
          {
            price: 500,
            subtotal: 500,
            quantity: 1,
            addons: [{ price: 700, quantity: 1 }]
          }
        ]
      })
    ).toEqual({ subtotal: 1200, total: 1200 })
  })
})
