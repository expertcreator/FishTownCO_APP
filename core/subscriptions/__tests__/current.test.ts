import { describe, expect, test } from "bun:test"
import { getCurrentSubscription } from "../current"
import type { Subscription } from "../types"

function subscription(overrides: Partial<Subscription>): Subscription {
  return {
    id: "s1",
    tenantId: "t1",
    startDate: "2026-01-01T00:00:00.000Z",
    expireAt: "2026-02-01T00:00:00.000Z",
    amount: "2010",
    isActive: true,
    isFreeTrial: false,
    plan: "lite",
    paidAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  }
}

describe("getCurrentSubscription", () => {
  test("returns the active covering row that expires last", () => {
    const now = Date.parse("2026-01-15T00:00:00.000Z")
    const current = getCurrentSubscription(
      [
        subscription({
          id: "soon",
          expireAt: "2026-01-20T00:00:00.000Z"
        }),
        subscription({
          id: "later",
          expireAt: "2026-03-01T00:00:00.000Z"
        }),
        subscription({
          id: "inactive",
          isActive: false,
          expireAt: "2026-04-01T00:00:00.000Z"
        })
      ],
      now
    )

    expect(current?.id).toBe("later")
  })

  test("returns undefined when no row covers now", () => {
    const now = Date.parse("2026-03-01T00:00:00.000Z")
    expect(
      getCurrentSubscription(
        [
          subscription({
            expireAt: "2026-02-01T00:00:00.000Z"
          })
        ],
        now
      )
    ).toBeUndefined()
  })
})
