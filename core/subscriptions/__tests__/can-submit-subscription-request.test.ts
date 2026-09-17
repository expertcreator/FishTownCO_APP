import { describe, expect, test } from "bun:test"
import { canSubmitSubscriptionRequest } from "../can-submit-subscription-request"

const owner = {
  isOwner: true,
  branchId: null,
  claimStatus: null,
  hasActiveUnexpiredSubscription: false
}

describe("canSubmitSubscriptionRequest", () => {
  test("hides the request when the current plan is active and not expired", () => {
    expect(
      canSubmitSubscriptionRequest({
        ...owner,
        hasActiveUnexpiredSubscription: true
      })
    ).toBe(false)
  })

  test("allows a request when the owner has no live plan", () => {
    expect(canSubmitSubscriptionRequest(owner)).toBe(true)
  })
})
