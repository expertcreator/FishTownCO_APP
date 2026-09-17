import { describe, expect, test } from "bun:test"
import {
  isOrderLineItemDeleted,
  mapApiOrderItemsToUi,
  resolveOrderLineItemPrice
} from "../line-items"

describe("isOrderLineItemDeleted", () => {
  test("treats isDeleted, deleted, and deletedAt as removed", () => {
    expect(isOrderLineItemDeleted({ isDeleted: true })).toBe(true)
    expect(isOrderLineItemDeleted({ deleted: true })).toBe(true)
    expect(isOrderLineItemDeleted({ deletedAt: "2026-09-01T00:00:00Z" })).toBe(
      true
    )
    expect(isOrderLineItemDeleted({ id: "1" })).toBe(false)
    expect(isOrderLineItemDeleted(null)).toBe(false)
  })
})

describe("resolveOrderLineItemPrice", () => {
  test("prefers price aliases then derives from line total", () => {
    expect(resolveOrderLineItemPrice({ price: "9.5" })).toBe(9.5)
    expect(resolveOrderLineItemPrice({ unitPrice: 4 })).toBe(4)
    expect(resolveOrderLineItemPrice({ subtotal: 20, quantity: 4 })).toBe(5)
    expect(resolveOrderLineItemPrice({})).toBe(0)
  })
})

describe("mapApiOrderItemsToUi", () => {
  test("drops deleted lines and resolves nested product fields", () => {
    expect(
      mapApiOrderItemsToUi([
        {
          id: "keep",
          productName: "Burger",
          qty: 2,
          unitPrice: "10",
          product: { images: ["https://cdn/b.jpg"] }
        },
        { id: "gone", isDeleted: true, price: 1 },
        null
      ])
    ).toEqual([
      {
        id: "keep",
        name: "Burger",
        quantity: 2,
        price: 10,
        image: "https://cdn/b.jpg"
      }
    ])
  })

  test("returns an empty list for missing items", () => {
    expect(mapApiOrderItemsToUi(null)).toEqual([])
    expect(mapApiOrderItemsToUi([])).toEqual([])
  })
})
