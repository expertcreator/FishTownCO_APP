import assert from "node:assert/strict"
import { describe, it } from "vitest"
import {
  humanizeBackendCode,
  orderStatusHistoryActorLabel,
  orderStatusHistoryNote,
  sortOrderStatusHistory
} from "../order-status-history"
import type { OrderStatusHistoryEntry } from "../types"

function entry(partial: Partial<OrderStatusHistoryEntry>) {
  return {
    id: "h1",
    orderId: "o1",
    oldStatus: "pending",
    newStatus: "confirmed",
    changedAt: "2026-01-01T10:00:00Z",
    ...partial
  } as OrderStatusHistoryEntry
}

describe("humanizeBackendCode", () => {
  it("turns a screaming-snake code into a sentence", () => {
    assert.equal(
      humanizeBackendCode("TENANT_NOT_AVAILABLE"),
      "Tenant not available"
    )
  })

  it("passes an ordinary sentence through untouched", () => {
    assert.equal(
      humanizeBackendCode("Ran out of chicken tikka"),
      "Ran out of chicken tikka"
    )
  })
})

describe("sortOrderStatusHistory", () => {
  it("answers an empty list for missing history", () => {
    assert.deepEqual(sortOrderStatusHistory(null), [])
    assert.deepEqual(sortOrderStatusHistory(undefined), [])
    assert.deepEqual(sortOrderStatusHistory([]), [])
  })

  it("orders entries oldest first without mutating the input", () => {
    const input = [
      entry({ id: "b", changedAt: "2026-01-01T12:00:00Z" }),
      entry({ id: "a", changedAt: "2026-01-01T09:00:00Z" })
    ]
    assert.deepEqual(
      sortOrderStatusHistory(input).map((e) => e.id),
      ["a", "b"]
    )
    assert.deepEqual(
      input.map((e) => e.id),
      ["b", "a"]
    )
  })

  it("falls back to createdAt when changedAt is absent", () => {
    const sorted = sortOrderStatusHistory([
      entry({ id: "late", changedAt: "", createdAt: "2026-01-01T15:00:00Z" }),
      entry({ id: "early", changedAt: "", createdAt: "2026-01-01T08:00:00Z" })
    ])
    assert.deepEqual(
      sorted.map((e) => e.id),
      ["early", "late"]
    )
  })
})

describe("orderStatusHistoryActorLabel", () => {
  it("prefers the acting user's name", () => {
    assert.equal(
      orderStatusHistoryActorLabel(
        entry({ updatedBy: "u1", updatedByUser: { name: " Ayesha " } }),
        "System",
        "Restaurant"
      ),
      "Ayesha"
    )
  })

  it("calls a transition with no updatedBy the system's", () => {
    assert.equal(
      orderStatusHistoryActorLabel(
        entry({ updatedBy: null }),
        "System",
        "Restaurant"
      ),
      "System"
    )
  })

  it("calls a named-less staff transition the restaurant's", () => {
    assert.equal(
      orderStatusHistoryActorLabel(
        entry({ updatedBy: "u1", updatedByUser: null }),
        "System",
        "Restaurant"
      ),
      "Restaurant"
    )
  })
})

describe("orderStatusHistoryNote", () => {
  it("drops empty notes and the lifecycle markers", () => {
    assert.equal(orderStatusHistoryNote(null), null)
    assert.equal(orderStatusHistoryNote(undefined), null)
    assert.equal(orderStatusHistoryNote("   "), null)
    assert.equal(orderStatusHistoryNote("ORDER_CREATED"), null)
    assert.equal(orderStatusHistoryNote(" ORDER_MODIFIED "), null)
  })

  it("humanizes a backend code and keeps free text as written", () => {
    assert.equal(
      orderStatusHistoryNote(" TENANT_NOT_AVAILABLE "),
      "Tenant not available"
    )
    assert.equal(orderStatusHistoryNote(" Rider assigned "), "Rider assigned")
  })
})
