import { describe, expect, test } from "bun:test"
import { mapOrderItemsToPosBillLines } from "../items"

describe("mapOrderItemsToPosBillLines", () => {
  test("returns an empty list for missing items", () => {
    expect(mapOrderItemsToPosBillLines(null)).toEqual([])
    expect(mapOrderItemsToPosBillLines(undefined)).toEqual([])
  })

  test("keeps ids and defaults addon quantity to 1", () => {
    expect(
      mapOrderItemsToPosBillLines([
        {
          id: "line-1",
          quantity: 2,
          productId: "p1",
          combinationId: "c1",
          addons: [{ addonProductId: "a1", combinationId: "addon-combo" }]
        }
      ])
    ).toEqual([
      {
        id: "line-1",
        quantity: 2,
        productId: "p1",
        combinationId: "c1",
        addons: [
          {
            addonProductId: "a1",
            quantity: 1,
            combinationId: "addon-combo"
          }
        ]
      }
    ])
  })
})
