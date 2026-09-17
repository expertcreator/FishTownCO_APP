import { describe, expect, it } from "vitest"
import type { OrderMyReview } from "../order-my-review"
import {
  buildRateableLines,
  buildRateOrderPayload,
  hydrateRatingsFromMyReview,
  isRatingComplete,
  type RateableLine
} from "../order-rateable-lines"
import type { GetOrderDetailResponse, OrderDetailItem } from "../types"

/**
 * The dialog's line model (`mw-3-4`). The ids below are real UUIDs because the
 * upstream declares `z.string().uuid()` and this module drops anything else —
 * a fixture with `"p1"` would silently exercise the drop path instead of the
 * happy one.
 */

/**
 * The ids the proxy's own `z.uuid()` accepts and rejects.
 *
 * The same table is run against the route's schema in
 * `src/app/api/account/order-rating/__tests__/route.test.ts`. It is duplicated
 * rather than imported because that spec is in the APP repo and this one is in
 * the `core` submodule, and lint forbids exporting from a test file — so the
 * two copies must be edited together. What actually guarantees they agree is
 * that both sides now call the same `z.uuid()`; this table is what fails if
 * either ever grows a check of its own again.
 *
 * The nil and max ids are the whole point: RFC 9562 special-cases both and zod
 * accepts them, while the hand-written variant regex this module used to carry
 * did not.
 */
const ACCEPTED_RATING_IDS = [
  ["a v4 id", "11111111-1111-4111-8111-111111111111"],
  ["a v1 id", "11111111-1111-1111-8111-111111111111"],
  ["a v7 id", "11111111-1111-7111-8111-111111111111"],
  ["an upper-case id", "AAAAAAAA-1111-4111-8111-111111111111"],
  ["the nil id", "00000000-0000-0000-0000-000000000000"],
  ["the max id", "ffffffff-ffff-ffff-ffff-ffffffffffff"]
] as const

/** Ids neither side may accept. */
const REJECTED_RATING_IDS = [
  ["a bare word", "p1"],
  ["a traversal segment", ".."],
  ["a bad variant", "11111111-1111-4111-c111-111111111111"],
  ["version 0", "11111111-1111-0111-8111-111111111111"],
  ["version 9", "11111111-1111-9111-8111-111111111111"],
  ["a blank id", "   "]
] as const

const PRODUCT_A = "11111111-1111-4111-8111-111111111111"
const PRODUCT_B = "22222222-2222-4222-8222-222222222222"
const DEAL_A = "33333333-3333-4333-8333-333333333333"

/**
 * Builds one order line.
 * @param overrides - Fields to set on the line
 * @returns The line
 */
function line(overrides: Partial<OrderDetailItem>): OrderDetailItem {
  return {
    id: "li-default",
    orderId: "o1",
    productId: null,
    inventoryId: "inv-1",
    quantity: 1,
    price: "100",
    subtotal: "100",
    productName: { ar: "", en: "Item" },
    product: { id: "prod", images: [], name: [] },
    inventory: { branchId: "b1", id: "inv-1", price: "100", productId: null },
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    ...overrides
  } as OrderDetailItem
}

/**
 * Wraps lines into an order-detail response.
 * @param items - The order's lines
 * @param wrapped - When true, nests them under `data`
 * @returns The response
 */
function order(
  items: OrderDetailItem[],
  wrapped = false
): GetOrderDetailResponse {
  return (wrapped ? { data: { items } } : { items }) as GetOrderDetailResponse
}

describe("buildRateableLines", () => {
  it("reads lines from both wrapper depths", () => {
    const items = [
      line({
        id: "li1",
        productId: PRODUCT_A,
        productName: { ar: "", en: "Zinger" },
        quantity: 2
      })
    ]

    for (const payload of [order(items), order(items, true)]) {
      expect(buildRateableLines(payload, "en")).toEqual([
        { key: "li1", name: "Zinger", productId: PRODUCT_A, quantity: 2 }
      ])
    }
  })

  it("keeps a deal-only line, whose productId is null", () => {
    const lines = buildRateableLines(
      order([line({ dealId: DEAL_A, id: "li2", productId: null })]),
      "en"
    )

    expect(lines).toEqual([
      { dealId: DEAL_A, key: "li2", name: "Item", quantity: 1 }
    ])
  })

  it("carries the first product image when the line has one", () => {
    const lines = buildRateableLines(
      order([
        line({
          id: "li1",
          product: { id: "prod", images: ["https://cdn.test/a.png"], name: [] },
          productId: PRODUCT_A
        })
      ]),
      "en"
    )

    expect(lines[0]?.imageUri).toBe("https://cdn.test/a.png")
  })

  it.each([
    ["an addon row", line({ id: "li3", isAddon: true, productId: PRODUCT_A })],
    [
      "a line with neither id",
      line({ dealId: undefined, id: "li4", productId: null })
    ],
    ["a non-UUID productId", line({ id: "li5", productId: "not-a-uuid" })],
    ["a blank productId", line({ id: "li6", productId: "   " })]
  ])("drops %s", (_case, dropped) => {
    expect(buildRateableLines(order([dropped]), "en")).toEqual([])
  })

  it.each(ACCEPTED_RATING_IDS)("keeps a line carrying %s", (_case, id) => {
    // Alignment with the proxy: a line the route would forward must never be
    // dropped here, or it can never be rated and nothing says why.
    expect(
      buildRateableLines(order([line({ id: "li1", productId: id })]), "en")
    ).toHaveLength(1)
  })

  it.each(REJECTED_RATING_IDS)("drops a line carrying %s", (_case, id) => {
    expect(
      buildRateableLines(order([line({ id: "li1", productId: id })]), "en")
    ).toEqual([])
  })

  it.each([
    ["a missing quantity", undefined, 1],
    ["a null quantity", null, 1],
    ["a stringly quantity", "3", 1],
    ["a zero quantity", 0, 1],
    ["a fractional quantity", 2.7, 2],
    ["a real quantity", 4, 4]
  ])("reads %s as a whole count", (_case, quantity, expected) => {
    // `quantity` is declared `number` but the wire is never validated against
    // that, and unguarded a missing value renders as "undefined×".
    const lines = buildRateableLines(
      order([
        line({
          id: "li1",
          productId: PRODUCT_A,
          quantity: quantity as number
        })
      ]),
      "en"
    )

    expect(lines[0]?.quantity).toBe(expected)
  })

  it("gives two blank-id lines of the SAME product distinct keys", () => {
    // Collided, React renders a duplicate key and the dialog treats the two
    // lines as one rating: starring either stars both, and the body carries
    // one entry where the order has two.
    const lines = buildRateableLines(
      order([
        line({ id: "", productId: PRODUCT_A }),
        line({ id: "", productId: PRODUCT_A })
      ]),
      "en"
    )

    expect(lines).toHaveLength(2)
    expect(lines[0]?.key).not.toBe(lines[1]?.key)
  })

  it("keeps a line whose productId is malformed but whose dealId is not", () => {
    const lines = buildRateableLines(
      order([line({ dealId: DEAL_A, id: "li7", productId: "nope" })]),
      "en"
    )

    expect(lines).toEqual([
      { dealId: DEAL_A, key: "li7", name: "Item", quantity: 1 }
    ])
  })

  it("falls back to an em dash when the line carries no name", () => {
    const lines = buildRateableLines(
      order([
        line({
          id: "li1",
          productId: PRODUCT_A,
          productName: undefined as unknown as OrderDetailItem["productName"]
        })
      ]),
      "en"
    )

    expect(lines[0]?.name).toBe("—")
  })

  it("reads a plain-string name", () => {
    const lines = buildRateableLines(
      order([
        line({
          id: "li1",
          productId: PRODUCT_A,
          productName: "Plain" as unknown as OrderDetailItem["productName"]
        })
      ]),
      "en"
    )

    expect(lines[0]?.name).toBe("Plain")
  })

  it("keys off the id, so two lines of the same product stay two rows", () => {
    const lines = buildRateableLines(
      order([
        line({ id: "li1", productId: PRODUCT_A }),
        line({ id: "li2", productId: PRODUCT_A })
      ]),
      "en"
    )

    expect(lines.map((entry) => entry.key)).toEqual(["li1", "li2"])
  })

  it("keys off the id it has when the row id is blank", () => {
    const lines = buildRateableLines(
      order([line({ id: "", productId: PRODUCT_A })]),
      "en"
    )

    expect(lines[0]?.key).toBe(`${PRODUCT_A}-0`)

    const dealOnly = buildRateableLines(
      order([line({ dealId: DEAL_A, id: "", productId: null })]),
      "en"
    )

    expect(dealOnly[0]?.key).toBe(`${DEAL_A}-0`)
  })

  it.each([
    ["no order at all", undefined],
    ["an order with no items", order([])]
  ])("answers [] for %s", (_case, payload) => {
    expect(buildRateableLines(payload, "en")).toEqual([])
  })
})

const LINES: RateableLine[] = [
  { key: "li1", name: "Zinger", productId: PRODUCT_A, quantity: 1 },
  { dealId: DEAL_A, key: "li2", name: "Family Deal", quantity: 1 }
]

describe("hydrateRatingsFromMyReview", () => {
  it("matches by productId, then by dealId", () => {
    const review: OrderMyReview = {
      dealRatings: [{ comment: "value", dealId: DEAL_A, rating: 3 }],
      productRatings: [{ comment: "tasty", productId: PRODUCT_A, rating: 5 }]
    }

    expect(hydrateRatingsFromMyReview(LINES, review)).toEqual({
      li1: { comment: "tasty", stars: 5 },
      li2: { comment: "value", stars: 3 }
    })
  })

  it("fills a LIST-row review, whose entries carry no comment text", () => {
    expect(
      hydrateRatingsFromMyReview(LINES, {
        productRatings: [{ comment: "", productId: PRODUCT_A, rating: 4 }]
      })
    ).toEqual({ li1: { comment: "", stars: 4 } })
  })

  it("drops an overall score onto the first line when nothing matched", () => {
    expect(
      hydrateRatingsFromMyReview(LINES, {
        overallComment: "fine",
        overallRating: 2,
        productRatings: []
      })
    ).toEqual({ li1: { comment: "fine", stars: 2 } })
  })

  it("supplies an empty comment for an overall score that carries none", () => {
    expect(
      hydrateRatingsFromMyReview(LINES, {
        overallRating: 2,
        productRatings: []
      })
    ).toEqual({ li1: { comment: "", stars: 2 } })
  })

  it.each([
    ["no review", null],
    ["an empty review", { productRatings: [] } as OrderMyReview],
    [
      "a review naming a product not on the order",
      {
        productRatings: [{ comment: "", productId: PRODUCT_B, rating: 5 }]
      } as OrderMyReview
    ]
  ])("fills nothing for %s", (_case, review) => {
    expect(hydrateRatingsFromMyReview(LINES, review)).toEqual({})
  })

  it("fills nothing when the order has no rateable line to hang an overall score on", () => {
    expect(
      hydrateRatingsFromMyReview([], { overallRating: 5, productRatings: [] })
    ).toEqual({})
  })
})

describe("buildRateOrderPayload", () => {
  it("splits products and deals, sending rating as a number", () => {
    const body = buildRateOrderPayload(LINES, {
      li1: { comment: "tasty", stars: 5 },
      li2: { comment: "", stars: 3 }
    })

    expect(body).toEqual({
      dealRatings: [{ dealId: DEAL_A, rating: 3 }],
      productRatings: [{ comment: "tasty", productId: PRODUCT_A, rating: 5 }]
    })
    expect(typeof body.productRatings?.[0]?.rating).toBe("number")
  })

  it("omits a comment that is only whitespace", () => {
    expect(
      buildRateOrderPayload(LINES, { li1: { comment: "   ", stars: 4 } })
    ).toEqual({ productRatings: [{ productId: PRODUCT_A, rating: 4 }] })
  })

  it("skips an unstarred line rather than sending a zero", () => {
    expect(
      buildRateOrderPayload(LINES, {
        li1: { comment: "", stars: 0 },
        li2: { comment: "", stars: 4 }
      })
    ).toEqual({ dealRatings: [{ dealId: DEAL_A, rating: 4 }] })
  })

  it("omits every array rather than sending an empty one", () => {
    // An empty `productRatings: []` still trips the upstream's at-least-one
    // refine, so the body must carry no key at all.
    expect(buildRateOrderPayload(LINES, {})).toEqual({})
    expect(buildRateOrderPayload([], {})).toEqual({})
  })
})

describe("isRatingComplete", () => {
  it.each([
    [
      "every line starred",
      { li1: { comment: "", stars: 4 }, li2: { comment: "", stars: 1 } },
      true
    ],
    ["one line missing", { li1: { comment: "", stars: 4 } }, false],
    [
      "one line at zero",
      { li1: { comment: "", stars: 4 }, li2: { comment: "", stars: 0 } },
      false
    ],
    ["nothing set", {}, false]
  ])("answers %s -> %s", (_case, ratings, expected) => {
    expect(isRatingComplete(LINES, ratings)).toBe(expected)
  })

  it("is false when there is nothing to rate", () => {
    expect(isRatingComplete([], {})).toBe(false)
  })
})
