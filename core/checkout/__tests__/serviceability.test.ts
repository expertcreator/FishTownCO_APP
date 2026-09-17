import { describe, expect, it } from "vitest"
import {
  awaitingVerdict,
  blocksOrder,
  type ServiceabilityState,
  serviceabilitySkipReason,
  toServiceabilityState
} from "../serviceability"

describe("serviceabilitySkipReason", () => {
  it("skips a pickup branch", () => {
    expect(
      serviceabilitySkipReason({ tenantId: "t1", fulfillment: "pickup" })
    ).toBe("pickup")
  })

  it("checks delivery and hybrid branches", () => {
    expect(
      serviceabilitySkipReason({ tenantId: "t1", fulfillment: "delivery" })
    ).toBeNull()
    expect(
      serviceabilitySkipReason({ tenantId: "t1", fulfillment: "hybrid" })
    ).toBeNull()
  })

  it("skips a cart saved before the branch id was captured", () => {
    // Legacy cart: nullable by construction, no migration. It must degrade,
    // never throw and never silently claim coverage.
    expect(
      serviceabilitySkipReason({ tenantId: null, fulfillment: "delivery" })
    ).toBe("unknown-branch")
    expect(
      serviceabilitySkipReason({ tenantId: "   ", fulfillment: "delivery" })
    ).toBe("unknown-branch")
  })

  it("checks when the fulfilment mode itself is unknown", () => {
    // Unknown fulfilment is not pickup. Asking is the safe default.
    expect(
      serviceabilitySkipReason({ tenantId: "t1", fulfillment: null })
    ).toBeNull()
  })
})

describe("toServiceabilityState", () => {
  it("maps a positive verdict", () => {
    expect(toServiceabilityState({ serviceable: true })).toEqual({
      status: "allowed"
    })
  })

  it("carries the refusal reason through", () => {
    expect(
      toServiceabilityState({
        serviceable: false,
        reason: "OUTSIDE_COVERAGE_ZONE"
      })
    ).toEqual({ status: "blocked", reason: "OUTSIDE_COVERAGE_ZONE" })
  })

  it("an unreadable body is unavailable, never allowed", () => {
    expect(toServiceabilityState(null)).toEqual({ status: "unavailable" })
  })
})

describe("blocksOrder", () => {
  it("only a definite refusal blocks", () => {
    const cases: [ServiceabilityState, boolean][] = [
      [{ status: "blocked", reason: "OUTSIDE_DELIVERY_RADIUS" }, true],
      [{ status: "allowed" }, false],
      // An outage must not take checkout down with it: placement re-validates
      // server-side, so letting this through fails safe.
      [{ status: "unavailable" }, false],
      [{ status: "skipped", cause: "pickup" }, false],
      [{ status: "skipped", cause: "unknown-branch" }, false],
      [{ status: "idle" }, false],
      [{ status: "checking" }, false]
    ]

    for (const [state, expected] of cases) {
      expect(blocksOrder(state)).toBe(expected)
    }
  })
})

describe("awaitingVerdict", () => {
  it("is true only before the first answer lands", () => {
    expect(awaitingVerdict({ status: "idle" })).toBe(true)
    expect(awaitingVerdict({ status: "checking" })).toBe(true)
    expect(awaitingVerdict({ status: "allowed" })).toBe(false)
    expect(awaitingVerdict({ status: "unavailable" })).toBe(false)
    expect(awaitingVerdict({ status: "skipped", cause: "pickup" })).toBe(false)
  })
})
