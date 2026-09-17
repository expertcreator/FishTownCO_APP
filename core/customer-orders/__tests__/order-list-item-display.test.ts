import assert from "node:assert/strict"
import { describe, it } from "vitest"
import type { OrderItem } from "../list-types"
import {
  getOrdersListFirstItemName,
  isOrdersListItemDeal
} from "../order-list-item-display"

/** Minimum orders-list row; every deal signal is absent unless a test adds one. */
function row(
  extra: Record<string, unknown> = {}
): OrderItem & Record<string, unknown> {
  return {
    id: "o1",
    status: "pending",
    total: 100,
    itemsCount: 1,
    totalQuantity: 1,
    firstItemImage: "https://cdn.example/burger.png",
    firstItemName: "Burger",
    ...extra
  } as OrderItem & Record<string, unknown>
}

describe("isOrdersListItemDeal", () => {
  it("answers false for an ordinary product row", () => {
    assert.equal(isOrdersListItemDeal(row()), false)
  })

  it("reads the explicit flags first", () => {
    assert.equal(isOrdersListItemDeal(row({ firstItemIsDeal: true })), true)
    assert.equal(isOrdersListItemDeal(row({ isDeal: true })), true)
  })

  it("reads a deal id at row or first-item level, ignoring blank ones", () => {
    assert.equal(isOrdersListItemDeal(row({ firstItemDealId: "d1" })), true)
    assert.equal(isOrdersListItemDeal(row({ dealId: "d1" })), true)
    assert.equal(isOrdersListItemDeal(row({ dealId: "   " })), false)
    assert.equal(
      isOrdersListItemDeal(row({ firstItem: { dealId: "d1" } })),
      true
    )
    assert.equal(
      isOrdersListItemDeal(row({ firstItem: { isDeal: true } })),
      true
    )
  })

  it("reads type / lineType strings case-insensitively", () => {
    assert.equal(isOrdersListItemDeal(row({ firstItemType: "DEAL" })), true)
    assert.equal(isOrdersListItemDeal(row({ firstItemLineType: "Deal" })), true)
    assert.equal(isOrdersListItemDeal(row({ firstItemType: "product" })), false)
  })

  it("reads a variantDetails discriminator at row or first-item level", () => {
    assert.equal(
      isOrdersListItemDeal(row({ firstItemVariantDetails: { type: "deal" } })),
      true
    )
    assert.equal(
      isOrdersListItemDeal(
        row({ firstItem: { variantDetails: { type: "deal" } } })
      ),
      true
    )
  })

  it("reads the line array, skipping soft-deleted lines", () => {
    assert.equal(isOrdersListItemDeal(row({ items: [{ dealId: "d1" }] })), true)
    assert.equal(isOrdersListItemDeal(row({ items: [{ isDeal: true }] })), true)
    assert.equal(
      isOrdersListItemDeal(
        row({ items: [{ variantDetails: { type: "deal" } }] })
      ),
      true
    )
    assert.equal(
      isOrdersListItemDeal(row({ items: [{ dealId: "d1", isDeleted: true }] })),
      false
    )
    assert.equal(isOrdersListItemDeal(row({ items: [null, {}] })), false)
  })

  it("falls back to the list-API heuristic: no image plus a deal-looking name", () => {
    assert.equal(
      isOrdersListItemDeal(
        row({ firstItemImage: "", firstItemName: "Family Deal" })
      ),
      true
    )
    assert.equal(
      isOrdersListItemDeal(
        row({ firstItemImage: null, firstItemName: { en: "Ramzan deal" } })
      ),
      true
    )
  })

  it("does not fire the heuristic when the image is present", () => {
    assert.equal(
      isOrdersListItemDeal(row({ firstItemName: "Family Deal" })),
      false
    )
  })

  it("does not fire the heuristic on a substring match", () => {
    // \bdeal\b — "Dealer's Burger" is not a deal.
    assert.equal(
      isOrdersListItemDeal(
        row({ firstItemImage: "", firstItemName: "Dealership Burger" })
      ),
      false
    )
  })

  it("never throws on missing or wrongly-typed fields", () => {
    assert.equal(
      isOrdersListItemDeal({
        firstItemImage: 42,
        firstItemName: undefined,
        items: "not-an-array"
      } as unknown as OrderItem),
      false
    )
  })
})

describe("getOrdersListFirstItemName", () => {
  it("answers an empty string when the row carries no name", () => {
    assert.equal(
      getOrdersListFirstItemName({ firstItemName: undefined }, "en"),
      ""
    )
    assert.equal(getOrdersListFirstItemName({ firstItemName: "" }, "en"), "")
  })

  it("trims a plain string name", () => {
    assert.equal(
      getOrdersListFirstItemName({ firstItemName: "  Burger " }, "en"),
      "Burger"
    )
  })

  it("routes a localized record through the shared fallback chain", () => {
    const name = { en: "Chicken", ar: "دجاج", ur: "مرغی" }
    assert.equal(
      getOrdersListFirstItemName({ firstItemName: name }, "ar"),
      "دجاج"
    )
    assert.equal(
      getOrdersListFirstItemName({ firstItemName: name }, "ur"),
      "مرغی"
    )
    assert.equal(
      getOrdersListFirstItemName({ firstItemName: { en: "Chicken" } }, "ur-PK"),
      "Chicken"
    )
    assert.equal(getOrdersListFirstItemName({ firstItemName: {} }, "en"), "")
  })
})

describe("isOrdersListItemDeal — heuristic with no name at all", () => {
  it("answers false when the image is missing and the name is absent", () => {
    assert.equal(
      isOrdersListItemDeal(
        row({ firstItemImage: "", firstItemName: undefined })
      ),
      false
    )
    assert.equal(
      isOrdersListItemDeal(row({ firstItemImage: null, firstItemName: "" })),
      false
    )
  })

  it("scans every localized member of the name for the deal word", () => {
    assert.equal(
      isOrdersListItemDeal(
        row({
          firstItemImage: "",
          firstItemName: { en: "Burger", ur: "Ramzan deal" }
        })
      ),
      true
    )
    assert.equal(
      isOrdersListItemDeal(
        row({ firstItemImage: "", firstItemName: { en: 7 as never } })
      ),
      false
    )
  })
})
