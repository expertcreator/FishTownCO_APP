import { describe, expect, it } from "vitest"
import {
  myReviewSummaryStars,
  orderPayloadHasMyReview,
  pickMyReviewFromOrderPayload
} from "../order-my-review"

/**
 * The alias tolerance is the whole reason this module exists (`mw-3-4`), so the
 * table below is written against the shapes the backend actually answers with:
 * a LIST row (`ratingsOnly`, no comments), a DETAIL payload (commented), and
 * each of the three wrapper depths this app's proxy can leave behind.
 */

/** One LIST-row review: `ratingsOnly:true`, so no comment fields at all. */
const LIST_REVIEW = {
  dealReviews: [],
  productReviews: [
    { productId: "p1", rating: 4 },
    { productId: "p2", rating: 5 }
  ],
  riderReview: null
}

/** One DETAIL review: the same rows plus the comments. */
const DETAIL_REVIEW = {
  dealReviews: [{ comment: "great deal", dealId: "d1", rating: 3 }],
  productReviews: [{ comment: "tasty", productId: "p1", rating: 4 }],
  riderReview: { comment: "quick", rating: 5 }
}

describe("pickMyReviewFromOrderPayload", () => {
  it.each([
    ["root", { myReview: LIST_REVIEW }],
    ["data", { data: { myReview: LIST_REVIEW } }],
    ["data.data", { data: { data: { myReview: LIST_REVIEW } } }]
  ])("finds the review nested at %s", (_where, payload) => {
    const review = pickMyReviewFromOrderPayload(payload)

    expect(review?.productRatings).toHaveLength(2)
    expect(review?.productRatings[0]).toEqual({
      comment: "",
      productId: "p1",
      rating: 4
    })
  })

  it("keeps comments and the rider block off a detail payload", () => {
    const review = pickMyReviewFromOrderPayload({ myReview: DETAIL_REVIEW })

    expect(review?.productRatings[0]?.comment).toBe("tasty")
    expect(review?.dealRatings).toEqual([
      { comment: "great deal", dealId: "d1", rating: 3 }
    ])
    expect(review?.riderRating).toEqual({ comment: "quick", rating: 5 })
  })

  it.each([
    ["an explicit null", { myReview: null }],
    ["an absent field", { id: "o1" }],
    ["a non-object payload", "nope"],
    ["nothing at all", null],
    ["an empty review object", { myReview: {} }],
    ["an empty array", { myReview: [] }],
    [
      "rows with no usable id",
      { myReview: { productReviews: [{ rating: 4 }] } }
    ],
    [
      "rows with no usable rating",
      { myReview: { productReviews: [{ productId: "p1" }] } }
    ],
    ["a non-object row", { myReview: { productReviews: ["p1"] } }],
    ["an out-of-range score", { myReview: { rating: 9 } }]
  ])("answers null for %s", (_case, payload) => {
    expect(pickMyReviewFromOrderPayload(payload)).toBeNull()
    expect(orderPayloadHasMyReview(payload)).toBe(false)
  })

  it.each([
    ["productRatings", { productRatings: [{ productId: "p1", rating: 4 }] }],
    ["products", { products: [{ productId: "p1", rating: 4 }] }],
    ["items", { items: [{ productId: "p1", rating: 4 }] }],
    ["reviews", { reviews: [{ productId: "p1", rating: 4 }] }]
  ])("accepts %s as the product array alias", (_alias, myReview) => {
    expect(
      pickMyReviewFromOrderPayload({ myReview })?.productRatings[0]?.productId
    ).toBe("p1")
  })

  it("reads a bare array of product ratings", () => {
    const review = pickMyReviewFromOrderPayload({
      myReview: [{ productId: "p1", stars: "3" }]
    })

    expect(review?.productRatings).toEqual([
      { comment: "", productId: "p1", rating: 3 }
    ])
  })

  it("accepts snake_case ids and the score/stars aliases", () => {
    const review = pickMyReviewFromOrderPayload({
      myReview: {
        dealReviews: [{ deal_id: "d1", reviewText: "ok", score: 2 }],
        productReviews: [{ product_id: "p1", review: "fine", stars: 5 }]
      }
    })

    expect(review?.productRatings[0]).toEqual({
      comment: "fine",
      productId: "p1",
      rating: 5
    })
    expect(review?.dealRatings?.[0]).toEqual({
      comment: "ok",
      dealId: "d1",
      rating: 2
    })
  })

  it("reads an overall-only review, with its comment", () => {
    const review = pickMyReviewFromOrderPayload({
      myReview: { comment: "all good", rating: 4 }
    })

    expect(review).toEqual({
      overallComment: "all good",
      overallRating: 4,
      productRatings: []
    })
  })

  it("reads a rider-only review with no product or deal rows", () => {
    const review = pickMyReviewFromOrderPayload({
      myReview: { riderRating: { rating: 5 } }
    })

    expect(review).toEqual({
      productRatings: [],
      riderRating: { comment: "", rating: 5 }
    })
  })

  it("rounds a fractional score into the 1–5 band", () => {
    expect(
      pickMyReviewFromOrderPayload({ myReview: { customerRating: 4.4 } })
        ?.overallRating
    ).toBe(4)
  })

  it("reads the driverRating and rider aliases", () => {
    expect(
      pickMyReviewFromOrderPayload({
        myReview: { driverRating: { rating: 2 } }
      })?.riderRating?.rating
    ).toBe(2)
    expect(
      pickMyReviewFromOrderPayload({ myReview: { rider: { score: "3" } } })
        ?.riderRating?.rating
    ).toBe(3)
  })

  it.each([
    ["a non-object deal row", { dealReviews: ["d1"] }],
    ["a deal row with no id", { dealReviews: [{ rating: 4 }] }],
    ["a deal row with no rating", { dealReviews: [{ dealId: "d1" }] }]
  ])("drops %s while keeping the product rows", (_case, myReview) => {
    const review = pickMyReviewFromOrderPayload({
      myReview: {
        ...myReview,
        productReviews: [{ productId: "p1", rating: 4 }]
      }
    })

    expect(review?.productRatings).toHaveLength(1)
    expect(review?.dealRatings).toBeUndefined()
  })

  it("answers null for a myReview that is a bare non-object", () => {
    // `normalizeMyReviewObject`'s own `asRecord` guard, reached only when the
    // field is present and is neither an array nor an object.
    expect(pickMyReviewFromOrderPayload({ myReview: 5 })).toBeNull()
  })

  it("ignores a rider block that carries no usable score", () => {
    expect(
      pickMyReviewFromOrderPayload({
        myReview: {
          productReviews: [{ productId: "p1", rating: 4 }],
          rider: {}
        }
      })?.riderRating
    ).toBeUndefined()
  })
})

describe("myReviewSummaryStars", () => {
  it.each([
    ["nothing", null, undefined],
    [
      "a product row",
      { productRatings: [{ comment: "", productId: "p", rating: 4 }] },
      4
    ],
    [
      "the first deal when there is no product row",
      {
        dealRatings: [{ comment: "", dealId: "d", rating: 3 }],
        productRatings: []
      },
      3
    ],
    ["the overall score", { overallRating: 2, productRatings: [] }, 2],
    [
      "the rider score last",
      { productRatings: [], riderRating: { comment: "", rating: 5 } },
      5
    ],
    ["an empty review", { productRatings: [] }, undefined]
  ])("reads %s", (_case, review, expected) => {
    expect(
      myReviewSummaryStars(review as Parameters<typeof myReviewSummaryStars>[0])
    ).toBe(expected)
  })
})
