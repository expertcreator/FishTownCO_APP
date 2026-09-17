import assert from "node:assert/strict"
import { describe, it } from "vitest"
import {
  parseMoneyValue,
  readOrderPricingBreakdown,
  readPlatformFeeFromOrderDetail
} from "../order-detail-pricing"
import type { GetOrderDetailResponse } from "../types"

const detail = (payload: unknown) => payload as GetOrderDetailResponse

describe("parseMoneyValue", () => {
  it("passes finite numbers through", () => {
    assert.equal(parseMoneyValue(12.5), 12.5)
    assert.equal(parseMoneyValue(0), 0)
    assert.equal(parseMoneyValue(-3), -3)
  })

  it("parses decimal strings, whitespace included", () => {
    assert.equal(parseMoneyValue("12.50"), 12.5)
    assert.equal(parseMoneyValue("  99  "), 99)
  })

  it("answers 0 rather than NaN for anything unparseable", () => {
    for (const raw of [
      "abc",
      "",
      "   ",
      Number.NaN,
      Number.POSITIVE_INFINITY,
      null,
      undefined,
      {},
      [],
      true
    ]) {
      const parsed = parseMoneyValue(raw)
      assert.equal(parsed, 0)
      assert.equal(Number.isNaN(parsed), false)
    }
  })

  it("takes the leading number off a suffixed amount", () => {
    // parseFloat, not Number — "120 PKR" is a real shape on older payloads.
    assert.equal(parseMoneyValue("120 PKR"), 120)
  })
})

describe("readPlatformFeeFromOrderDetail", () => {
  it("reads a fee nested under data.pricing with a snake_case key", () => {
    assert.equal(
      readPlatformFeeFromOrderDetail({
        data: { pricing: { platform_fee: "12.50" } }
      }),
      12.5
    )
  })

  it("reads every wrapper depth the endpoint sends", () => {
    assert.equal(readPlatformFeeFromOrderDetail({ platformFee: 5 }), 5)
    assert.equal(readPlatformFeeFromOrderDetail({ platform_fee: "6" }), 6)
    assert.equal(
      readPlatformFeeFromOrderDetail({ pricing: { platformFee: 7 } }),
      7
    )
    assert.equal(
      readPlatformFeeFromOrderDetail({ data: { platformFee: 8 } }),
      8
    )
    assert.equal(
      readPlatformFeeFromOrderDetail({
        data: { data: { pricing: { platformFee: 9 } } }
      }),
      9
    )
  })

  it("keeps searching past a zero instead of accepting it", () => {
    // Only a strictly positive candidate wins, so a 0 written at the top layer
    // must not shadow the real fee sitting under `data`.
    assert.equal(
      readPlatformFeeFromOrderDetail({
        platformFee: 0,
        data: { pricing: { platform_fee: "40" } }
      }),
      40
    )
  })

  it("answers 0 when every layer is zero, absent or unparseable", () => {
    assert.equal(readPlatformFeeFromOrderDetail({ data: { pricing: {} } }), 0)
    assert.equal(
      readPlatformFeeFromOrderDetail({
        platformFee: 0,
        data: { platform_fee: "0.00", data: { pricing: { platformFee: "" } } }
      }),
      0
    )
  })

  it("answers 0 for a non-object payload instead of throwing", () => {
    for (const raw of [null, undefined, "", "nope", 42, [], true]) {
      assert.equal(readPlatformFeeFromOrderDetail(raw), 0)
    }
  })

  it("survives a data or pricing member that is not an object", () => {
    assert.equal(readPlatformFeeFromOrderDetail({ data: null }), 0)
    assert.equal(readPlatformFeeFromOrderDetail({ data: "x" }), 0)
    assert.equal(readPlatformFeeFromOrderDetail({ pricing: 3 }), 0)
    assert.equal(
      readPlatformFeeFromOrderDetail({ data: { data: null, platformFee: 2 } }),
      2
    )
  })
})

describe("readOrderPricingBreakdown", () => {
  it("reads every line off a flat payload", () => {
    const breakdown = readOrderPricingBreakdown(
      detail({
        total: 900,
        deliveryFee: 100,
        discount: 50,
        tax: 20,
        platformFee: 30,
        items: [{ subtotal: "500" }, { subtotal: "300" }]
      })
    )
    assert.deepEqual(breakdown, {
      subtotal: 800,
      discount: 50,
      deliveryFee: 100,
      platformFee: 30,
      tax: 20,
      total: 900,
      isFreeDelivery: false
    })
  })

  it("reads the same lines out of a nested data wrapper", () => {
    const breakdown = readOrderPricingBreakdown(
      detail({
        data: {
          total: 640,
          delivery_fee: "120",
          tax_amount: "20",
          items: [{ subtotal: "500" }]
        }
      })
    )
    assert.equal(breakdown.subtotal, 500)
    assert.equal(breakdown.deliveryFee, 120)
    assert.equal(breakdown.tax, 20)
    assert.equal(breakdown.total, 640)
  })

  it("falls through to a pricing block when the direct keys are absent", () => {
    const breakdown = readOrderPricingBreakdown(
      detail({
        data: {
          total: 700,
          pricing: { deliveryFee: 150, discount: 60, tax: 10 }
        }
      })
    )
    assert.equal(breakdown.deliveryFee, 150)
    assert.equal(breakdown.discount, 60)
    assert.equal(breakdown.tax, 10)
  })

  it("calls a zero delivery fee free delivery", () => {
    const breakdown = readOrderPricingBreakdown(
      detail({ total: 500, deliveryFee: 0 })
    )
    assert.equal(breakdown.deliveryFee, 0)
    assert.equal(breakdown.isFreeDelivery, true)
  })

  it("honours a freeDelivery flag even beside a positive fee", () => {
    // A waived fee still arrives priced; only the flag says it was waived.
    const breakdown = readOrderPricingBreakdown(
      detail({ data: { total: 500, deliveryFee: 120, freeDelivery: true } })
    )
    assert.equal(breakdown.deliveryFee, 120)
    assert.equal(breakdown.isFreeDelivery, true)
  })

  it("leaves addon and deleted rows out of the subtotal", () => {
    const breakdown = readOrderPricingBreakdown(
      detail({
        items: [
          { subtotal: "500" },
          { subtotal: "80", isAddon: true },
          { subtotal: "300", deletedAt: "2026-01-01" }
        ]
      })
    )
    assert.equal(breakdown.subtotal, 500)
  })
})
