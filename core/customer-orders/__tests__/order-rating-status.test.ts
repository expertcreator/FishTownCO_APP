import { describe, expect, it } from "vitest"
import {
  orderPayloadCustomerRatingStars,
  orderPayloadIndicatesCustomerRated
} from "../order-rating-status"

/**
 * The one question both web rating surfaces ask (`mw-3-4`). The `myReview`
 * cases are the ones this app actually hits; the flag-scan cases pin the
 * verbatim mobile fallbacks so a later "cleanup" cannot quietly narrow what
 * counts as rated.
 */

describe("orderPayloadIndicatesCustomerRated", () => {
  it.each([
    [
      "a LIST row carrying myReview",
      {
        id: "o1",
        myReview: { productReviews: [{ productId: "p1", rating: 4 }] }
      }
    ],
    [
      "a DETAIL payload carrying myReview",
      { data: { myReview: { rating: 5 } } }
    ],
    ["a root flag", { rated: true }],
    ["a numeric flag", { hasCustomerRated: 1 }],
    ["a stringly flag", { reviewSubmitted: "TRUE" }],
    ["a flag under data", { data: { customerRated: true } }],
    [
      "a flag under data.customerRating",
      { data: { customerRating: { isRated: true } } }
    ],
    [
      "a flag under data.ratingSummary",
      { data: { ratingSummary: { hasRated: true } } }
    ]
  ])("answers true for %s", (_case, payload) => {
    expect(orderPayloadIndicatesCustomerRated(payload)).toBe(true)
  })

  it.each([
    ["an explicit myReview: null", { id: "o1", myReview: null }],
    ["a completed row with no review field", { id: "o1", status: "completed" }],
    ["a false flag", { rated: false }],
    ["a zero flag", { hasRated: 0 }],
    ["a non-object payload", 7],
    ["nothing", null],
    ["a data wrapper with nothing in it", { data: {} }],
    [
      "a nested rating object with no flag",
      { data: { ratingSummary: { rating: 4 } } }
    ]
  ])("answers false for %s", (_case, payload) => {
    expect(orderPayloadIndicatesCustomerRated(payload)).toBe(false)
  })
})

describe("orderPayloadCustomerRatingStars", () => {
  it("prefers the parsed myReview over any scanned key", () => {
    expect(
      orderPayloadCustomerRatingStars({
        customerRating: 2,
        myReview: { productReviews: [{ productId: "p1", rating: 5 }] }
      })
    ).toBe(5)
  })

  it.each([
    ["a root key", { orderRating: 3 }, 3],
    ["a nested value", { customerRating: { value: 4 } }, 4],
    ["a listed key holding an object", { customerRating: { overall: 2 } }, 2],
    ["the ratingSummary fallback", { ratingSummary: { rating: 2 } }, 2],
    ["a stringly score", { myRating: "5" }, 5],
    ["a score above the band, clamped", { starRating: 9 }, 5],
    ["a wrapped payload", { data: { userRating: 1 } }, 1]
  ])("reads %s", (_case, payload, expected) => {
    expect(orderPayloadCustomerRatingStars(payload)).toBe(expected)
  })

  it.each([
    ["nothing", null],
    ["a non-object", "x"],
    ["a payload with no score anywhere", { id: "o1" }],
    ["a zero score", { rating: 0 }],
    ["an unparseable string", { rating: "later" }]
  ])("answers undefined for %s", (_case, payload) => {
    expect(orderPayloadCustomerRatingStars(payload)).toBeUndefined()
  })

  it("stops recursing past five wrapper levels", () => {
    // Six `data` layers: the guard fires before the score is reached.
    const deep = {
      data: { data: { data: { data: { data: { data: { rating: 4 } } } } } }
    }

    expect(orderPayloadCustomerRatingStars(deep)).toBeUndefined()
  })
})
