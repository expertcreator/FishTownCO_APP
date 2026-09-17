import assert from "node:assert/strict"
import { describe, it } from "vitest"
import { isOrderModified, isOrderModifiedFlag } from "../order-modified"

describe("isOrderModifiedFlag", () => {
  it("accepts the three truthy spellings the APIs actually send", () => {
    assert.equal(isOrderModifiedFlag(true), true)
    assert.equal(isOrderModifiedFlag("true"), true)
    assert.equal(isOrderModifiedFlag(1), true)
  })

  it("rejects everything else, including near-misses", () => {
    for (const value of [
      false,
      "TRUE",
      "1",
      0,
      "false",
      null,
      undefined,
      {},
      []
    ]) {
      assert.equal(isOrderModifiedFlag(value), false)
    }
  })
})

describe("isOrderModified", () => {
  it("answers false for a missing order", () => {
    assert.equal(isOrderModified(null), false)
    assert.equal(isOrderModified(undefined), false)
  })

  it("reads either casing of the flag", () => {
    assert.equal(isOrderModified({ isModified: true }), true)
    assert.equal(isOrderModified({ is_modified: "true" }), true)
    assert.equal(isOrderModified({ isModified: false }), false)
  })

  it("reads an ORDER_MODIFIED history note, case and space insensitively", () => {
    assert.equal(
      isOrderModified({ orderStatusHistory: [{ notes: "  order_modified " }] }),
      true
    )
    assert.equal(
      isOrderModified({
        orderStatusHistory: [{ notes: "accepted" }, { notes: "ORDER_MODIFIED" }]
      }),
      true
    )
  })

  it("ignores history entries whose notes are not strings", () => {
    assert.equal(
      isOrderModified({
        orderStatusHistory: [{ notes: null }, { notes: 1 }, { notes: {} }]
      }),
      false
    )
  })

  it("falls back to a line added in a later POS round", () => {
    assert.equal(isOrderModified({ items: [{ roundNo: 2 }] }), true)
    assert.equal(
      isOrderModified({ items: [{ roundNo: 1 }, { roundNo: "3" }] }),
      true
    )
  })

  it("does not treat round 1, a missing round or a junk round as modified", () => {
    assert.equal(
      isOrderModified({ items: [{ roundNo: 1 }, {}, { roundNo: "abc" }] }),
      false
    )
    assert.equal(isOrderModified({ items: [] }), false)
    assert.equal(isOrderModified({}), false)
  })

  it("answers false when history and items are explicitly null", () => {
    assert.equal(
      isOrderModified({ orderStatusHistory: null, items: null }),
      false
    )
  })
})
