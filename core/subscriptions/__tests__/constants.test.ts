import { describe, expect, test } from "bun:test"
import { SUBSCRIPTIONS_API } from "../constants"

describe("SUBSCRIPTIONS_API", () => {
  test("encodes subscription and claim ids in path builders", () => {
    expect(SUBSCRIPTIONS_API.byId("a/b")).toBe("subscriptions/a%2Fb")
    expect(SUBSCRIPTIONS_API.reviewPaymentClaim("x y")).toBe(
      "subscription-payment-claims/x%20y/review"
    )
  })
})
