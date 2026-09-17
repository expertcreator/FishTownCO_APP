import assert from "node:assert/strict"
import { describe, it } from "vitest"
import type { OrderStatus } from "../list-types"
import {
  hasMoreOrderPages,
  isActiveOrderStatus,
  normalizeOrderStatus,
  splitOrdersByActivity
} from "../order-list-buckets"

/**
 * Every member of `list-types.ts`'s `OrderStatus` union, with the bucket it
 * belongs to.
 *
 * A `Record` keyed on the union, NOT an array of pairs: a `Record` is
 * exhaustiveness-checked, so adding a member to `OrderStatus` without deciding
 * its bucket fails the type check here rather than compiling and silently
 * defaulting to Active. The array literal this replaced could not do that —
 * it type-checked each entry and never noticed a missing one.
 */
const ACTIVE_BY_STATUS: Record<OrderStatus, boolean> = {
  cancelled: false,
  canceled: false,
  completed: false,
  confirmed: true,
  inprogress: true,
  picked_up: true,
  pickup: true,
  pending: true,
  preparing: true,
  ready: true,
  rejected: false
}

describe("isActiveOrderStatus", () => {
  for (const [status, expected] of Object.entries(ACTIVE_BY_STATUS)) {
    it(`classifies ${status} as ${expected ? "active" : "past"}`, () => {
      assert.equal(isActiveOrderStatus(status as OrderStatus), expected)
    })
  }

  it("treats BOTH cancelled spellings as past", () => {
    // The union carries the British and American forms because the backend has
    // sent both; knowing only one leaves half the cancelled orders in Active.
    assert.equal(isActiveOrderStatus("cancelled"), false)
    assert.equal(isActiveOrderStatus("canceled"), false)
  })

  it("ignores case and surrounding whitespace", () => {
    for (const raw of ["COMPLETED", " completed ", "Cancelled"]) {
      assert.equal(isActiveOrderStatus(raw), false)
    }
  })

  it("calls an absent, blank or unknown status ACTIVE, never past", () => {
    // The closed-terminal-set rule: a status this build has never heard of is
    // visible-and-wrong in Active rather than invisible-and-wrong in Past.
    for (const raw of [undefined, null, "", "   ", "on_hold", "teleporting"]) {
      assert.equal(isActiveOrderStatus(raw), true)
    }
  })
})

describe("splitOrdersByActivity", () => {
  it("returns two empty buckets for an empty page", () => {
    assert.deepEqual(splitOrdersByActivity([]), { active: [], past: [] })
  })

  it("splits a mixed page and preserves the incoming order inside each bucket", () => {
    const rows = [
      { id: "a", status: "preparing" as const },
      { id: "b", status: "completed" as const },
      { id: "c", status: "ready" as const },
      { id: "d", status: "rejected" as const },
      { id: "e", status: "pending" as const }
    ]

    const { active, past } = splitOrdersByActivity(rows)

    assert.deepEqual(
      active.map((order) => order.id),
      ["a", "c", "e"]
    )
    assert.deepEqual(
      past.map((order) => order.id),
      ["b", "d"]
    )
  })

  it("collapses to one bucket when every row shares a side", () => {
    const past = [
      { status: "completed" as const },
      { status: "canceled" as const }
    ]

    assert.deepEqual(splitOrdersByActivity(past), { active: [], past })

    const active = [{ status: "picked_up" as const }]

    assert.deepEqual(splitOrdersByActivity(active), { active, past: [] })
  })

  it("buckets a row carrying no status at all as active", () => {
    const rows: { id: string; status?: string }[] = [{ id: "degraded" }]

    assert.deepEqual(splitOrdersByActivity(rows), {
      active: rows,
      past: []
    })
  })
})

describe("normalizeOrderStatus", () => {
  it("trims and lower-cases a usable status", () => {
    assert.equal(normalizeOrderStatus("  COMPLETED "), "completed")
    assert.equal(normalizeOrderStatus("Picked_Up"), "picked_up")
  })

  it("answers the empty string for anything that is not one", () => {
    for (const raw of [undefined, null, "", "   "]) {
      assert.equal(normalizeOrderStatus(raw), "")
    }
  })

  it("is the SAME normalisation isActiveOrderStatus applies", () => {
    // The reason it is exported: a caller that keys a badge tone or a copy
    // label off the raw value diverges from the bucket it was just placed in.
    for (const raw of [" COMPLETED ", "Cancelled", "READY"]) {
      assert.equal(
        isActiveOrderStatus(raw),
        isActiveOrderStatus(normalizeOrderStatus(raw))
      )
    }
  })
})

describe("hasMoreOrderPages", () => {
  it("counts pages from ZERO, the upstream's own convention", () => {
    // `.offset(page * limit)` with `MIN_PAGE: 0` — page 0 is the first page.
    assert.equal(hasMoreOrderPages(0, 10, 10, 25), true)
    assert.equal(hasMoreOrderPages(1, 10, 10, 25), true)
    assert.equal(hasMoreOrderPages(2, 10, 5, 25), false)
  })

  it("prefers `total` over the row count, so one dropped row cannot hide the button", () => {
    // A full page of 10 that lost a malformed row still has more behind it.
    assert.equal(hasMoreOrderPages(0, 10, 9, 25), true)
  })

  it("says no when total is exactly consumed", () => {
    assert.equal(hasMoreOrderPages(0, 10, 10, 10), false)
    assert.equal(hasMoreOrderPages(0, 10, 0, 0), false)
  })

  it("falls back to the row count when the answer stated no total", () => {
    for (const total of [undefined, null, -1]) {
      assert.equal(hasMoreOrderPages(0, 10, 10, total), true)
      assert.equal(hasMoreOrderPages(0, 10, 9, total), false)
    }
  })
})
