import assert from "node:assert/strict"
import { describe, it } from "vitest"
import {
  buildMainLineItemsForModal,
  formatOrderItemsLabelFromDetail,
  getFirstMainLineImageFromDetail,
  getMainProductNamesFromOrderDetail
} from "../order-modal-line-items"
import type { GetOrderDetailResponse, OrderDetailItem } from "../types"

function item(partial: Partial<OrderDetailItem>): OrderDetailItem {
  return {
    id: "i1",
    orderId: "o1",
    productId: "p1",
    inventoryId: "inv1",
    quantity: 1,
    price: "100",
    subtotal: "100",
    productName: { en: "Burger", ar: "برجر" },
    product: { id: "p1", name: [], images: [] },
    inventory: { id: "inv1", branchId: "b1", productId: "p1", price: "100" },
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...partial
  } as OrderDetailItem
}

/** Detail responses arrive both wrapped in `data` and flat; both must read. */
function wrapped(items: OrderDetailItem[]): GetOrderDetailResponse {
  return { data: { items } } as unknown as GetOrderDetailResponse
}
function flat(items: OrderDetailItem[]): GetOrderDetailResponse {
  return { items } as unknown as GetOrderDetailResponse
}

const money = (amount: number) => `Rs. ${amount.toFixed(2)}`

describe("getMainProductNamesFromOrderDetail", () => {
  it("answers an empty list for a missing order", () => {
    assert.deepEqual(getMainProductNamesFromOrderDetail(undefined, "en"), [])
  })

  it("reads both the wrapped and the flat payload shape", () => {
    const lines = [item({ productName: { en: "Burger", ar: "برجر" } })]
    assert.deepEqual(getMainProductNamesFromOrderDetail(wrapped(lines), "en"), [
      "Burger"
    ])
    assert.deepEqual(getMainProductNamesFromOrderDetail(flat(lines), "en"), [
      "Burger"
    ])
  })

  it("answers an empty list when neither shape carries items", () => {
    assert.deepEqual(
      getMainProductNamesFromOrderDetail({} as GetOrderDetailResponse, "en"),
      []
    )
  })

  it("drops add-on and soft-deleted rows", () => {
    const lines = [
      item({ id: "1", productName: { en: "Burger", ar: "برجر" } }),
      item({
        id: "2",
        isAddon: true,
        productName: { en: "Cheese", ar: "جبن" }
      }),
      item({
        id: "3",
        deletedAt: "2026-01-02",
        productName: { en: "Fries", ar: "بطاطس" }
      })
    ]
    assert.deepEqual(getMainProductNamesFromOrderDetail(wrapped(lines), "en"), [
      "Burger"
    ])
  })

  it("routes localized names through the shared fallback chain", () => {
    const lines = [item({ productName: { en: "Chicken", ar: "دجاج" } })]
    // No `ur` member, so Urdu falls back to English rather than blanking.
    assert.deepEqual(getMainProductNamesFromOrderDetail(wrapped(lines), "ur"), [
      "Chicken"
    ])
    assert.deepEqual(getMainProductNamesFromOrderDetail(wrapped(lines), "ar"), [
      "دجاج"
    ])
  })

  it("drops lines whose name resolves to nothing", () => {
    const lines = [
      item({ id: "1", productName: undefined as never }),
      item({ id: "2", productName: {} as never }),
      item({ id: "3", productName: "  " as never })
    ]
    assert.deepEqual(
      getMainProductNamesFromOrderDetail(wrapped(lines), "en"),
      []
    )
  })

  it("accepts an already-flattened string name", () => {
    const lines = [item({ productName: "Zinger" as never })]
    assert.deepEqual(getMainProductNamesFromOrderDetail(wrapped(lines), "en"), [
      "Zinger"
    ])
  })
})

describe("formatOrderItemsLabelFromDetail", () => {
  it("answers an empty string when there are no main lines", () => {
    assert.equal(formatOrderItemsLabelFromDetail(undefined, "en"), "")
    assert.equal(formatOrderItemsLabelFromDetail(wrapped([]), "en"), "")
  })

  it("answers the bare name for a single line", () => {
    assert.equal(
      formatOrderItemsLabelFromDetail(
        wrapped([item({ productName: { en: "Burger", ar: "برجر" } })]),
        "en"
      ),
      "Burger"
    )
  })

  it("joins several names with a comma", () => {
    assert.equal(
      formatOrderItemsLabelFromDetail(
        wrapped([
          item({ id: "1", productName: { en: "Burger", ar: "برجر" } }),
          item({ id: "2", productName: { en: "Fries", ar: "بطاطس" } })
        ]),
        "en"
      ),
      "Burger, Fries"
    )
  })
})

describe("getFirstMainLineImageFromDetail", () => {
  it("answers undefined for a missing order or no image", () => {
    assert.equal(getFirstMainLineImageFromDetail(undefined), undefined)
    assert.equal(getFirstMainLineImageFromDetail(wrapped([])), undefined)
    assert.equal(
      getFirstMainLineImageFromDetail(wrapped([item({})])),
      undefined
    )
    assert.equal(
      getFirstMainLineImageFromDetail({} as GetOrderDetailResponse),
      undefined
    )
  })

  it("skips add-on rows and takes the first main line's first image", () => {
    const image = getFirstMainLineImageFromDetail(
      wrapped([
        item({
          id: "1",
          isAddon: true,
          product: { id: "p0", name: [], images: ["addon.png"] }
        }),
        item({
          id: "2",
          product: { id: "p1", name: [], images: ["main.png", "other.png"] }
        })
      ])
    )
    assert.equal(image, "main.png")
  })
})

describe("buildMainLineItemsForModal", () => {
  it("answers an empty list for a missing order", () => {
    assert.deepEqual(buildMainLineItemsForModal(undefined, "en", money), [])
  })

  it("builds one row per main line, formatting the subtotal", () => {
    const rows = buildMainLineItemsForModal(
      wrapped([
        item({
          id: "1",
          quantity: 2,
          subtotal: "250.5",
          productName: { en: "Burger", ar: "برجر" },
          product: { id: "p1", name: [], images: ["burger.png"] }
        }),
        item({ id: "2", isAddon: true })
      ]),
      "en",
      money
    )
    assert.deepEqual(rows, [
      {
        id: "1",
        name: "Burger",
        quantity: 2,
        priceLabel: "Rs. 250.50",
        imageUri: "burger.png"
      }
    ])
  })

  it("falls back to an em dash for a nameless line and 0 for a junk subtotal", () => {
    const rows = buildMainLineItemsForModal(
      wrapped([
        item({ id: "1", productName: {} as never, subtotal: "abc" as never })
      ]),
      "en",
      money
    )
    assert.equal(rows[0]?.name, "—")
    assert.equal(rows[0]?.priceLabel, "Rs. 0.00")
    assert.equal(rows[0]?.imageUri, undefined)
  })

  it("keeps soft-deleted main lines, unlike the name readers", () => {
    const rows = buildMainLineItemsForModal(
      flat([item({ id: "1", deletedAt: "2026-01-02" })]),
      "en",
      money
    )
    assert.equal(rows.length, 1)
  })
})

describe("order-modal readers on a payload with no items key at all", () => {
  it("answers an empty row list rather than throwing", () => {
    const empty = {} as GetOrderDetailResponse
    assert.deepEqual(buildMainLineItemsForModal(empty, "en", money), [])
  })
})
