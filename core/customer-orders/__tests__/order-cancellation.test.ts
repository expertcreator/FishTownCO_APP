import assert from "node:assert/strict"
import { describe, it } from "vitest"
import {
  getOrderCancellationEligibilityErrorCode,
  isOrderCancellable,
  ORDER_CANNOT_BE_CANCELLED_CODE
} from "../order-cancellation"

describe("order cancellation eligibility", () => {
  it("allows only pending and confirmed orders to be cancelled", () => {
    assert.equal(isOrderCancellable("pending"), true)
    assert.equal(isOrderCancellable("confirmed"), true)

    for (const status of [
      "inprogress",
      "preparing",
      "ready",
      "completed",
      "rejected",
      "cancelled",
      "canceled"
    ]) {
      assert.equal(isOrderCancellable(status), false)
    }
  })

  it("returns ORDER_CANNOT_BE_CANCELLED for non-cancellable statuses", () => {
    assert.equal(getOrderCancellationEligibilityErrorCode("pending"), null)
    assert.equal(getOrderCancellationEligibilityErrorCode("confirmed"), null)
    assert.equal(
      getOrderCancellationEligibilityErrorCode("completed"),
      ORDER_CANNOT_BE_CANCELLED_CODE
    )
    assert.equal(
      getOrderCancellationEligibilityErrorCode("cancelled"),
      ORDER_CANNOT_BE_CANCELLED_CODE
    )
  })
})

// --- Added by mw-4-3. Everything above is the mobile suite, verbatim apart
// from its runner import. These are the I/O-matrix rows it did not reach.
describe("order cancellation eligibility — absent and mid-kitchen statuses", () => {
  it("treats a missing status as not cancellable", () => {
    assert.equal(isOrderCancellable(null), false)
    assert.equal(isOrderCancellable(undefined), false)
    assert.equal(isOrderCancellable(""), false)
    assert.equal(
      getOrderCancellationEligibilityErrorCode(null),
      ORDER_CANNOT_BE_CANCELLED_CODE
    )
    assert.equal(
      getOrderCancellationEligibilityErrorCode(undefined),
      ORDER_CANNOT_BE_CANCELLED_CODE
    )
  })

  it("refuses a preparing order with the backend's own code", () => {
    assert.equal(isOrderCancellable("preparing"), false)
    assert.equal(
      getOrderCancellationEligibilityErrorCode("preparing"),
      "ORDER_CANNOT_BE_CANCELLED"
    )
  })

  it("does not accept an unknown status by accident", () => {
    assert.equal(isOrderCancellable("on_hold"), false)
    assert.equal(isOrderCancellable("PENDING"), false)
  })
})
