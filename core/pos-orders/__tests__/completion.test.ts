import { describe, expect, test } from "bun:test"
import {
  canEditLiveBillItems,
  needsLiveOperatorAttention,
  sellLiveDockCountsFromOrders,
  shouldShowSellLiveRow
} from "../completion"

describe("canEditLiveBillItems", () => {
  test("allows add and remove on open POS tickets", () => {
    expect(canEditLiveBillItems("confirmed")).toBe(true)
    expect(canEditLiveBillItems("preparing")).toBe(true)
    expect(canEditLiveBillItems("ready")).toBe(true)
    expect(canEditLiveBillItems("pending")).toBe(true)
    expect(canEditLiveBillItems("preparing", "Delivery")).toBe(true)
    expect(canEditLiveBillItems("ready", "DineIn")).toBe(true)
  })

  test("allows marketplace edits only before accept", () => {
    expect(canEditLiveBillItems("pending", "Delivery", true)).toBe(true)
    expect(canEditLiveBillItems("confirmed", "Delivery", true)).toBe(false)
    expect(canEditLiveBillItems("preparing", "Delivery", true)).toBe(false)
    expect(canEditLiveBillItems("ready", "Delivery", true)).toBe(false)
    expect(canEditLiveBillItems("completed", "Delivery", true)).toBe(false)
  })

  test("blocks add and remove on terminal tickets", () => {
    expect(canEditLiveBillItems("completed")).toBe(false)
    expect(canEditLiveBillItems("cancelled")).toBe(false)
    expect(canEditLiveBillItems("rejected")).toBe(false)
    expect(canEditLiveBillItems("Completed")).toBe(false)
  })

  test("blocks add and remove on ready delivery tickets", () => {
    expect(canEditLiveBillItems("ready", "Delivery")).toBe(false)
    expect(canEditLiveBillItems("Ready", "delivery")).toBe(false)
  })
})

describe("shouldShowSellLiveRow", () => {
  test("hides paid or cancelled tickets until a filter is active", () => {
    expect(
      shouldShowSellLiveRow({
        hasActiveFilters: false,
        orderStatus: "completed",
        paymentStatus: "paid"
      })
    ).toBe(false)
    expect(
      shouldShowSellLiveRow({
        hasActiveFilters: false,
        orderStatus: "completed",
        paymentStatus: "pending"
      })
    ).toBe(true)
    expect(
      shouldShowSellLiveRow({
        hasActiveFilters: false,
        orderStatus: "rejected",
        paymentStatus: "pending"
      })
    ).toBe(false)
    expect(
      shouldShowSellLiveRow({
        hasActiveFilters: true,
        orderStatus: "completed",
        paymentStatus: "paid"
      })
    ).toBe(true)
    expect(
      shouldShowSellLiveRow({
        hasActiveFilters: false,
        orderStatus: "preparing",
        paymentStatus: "pending"
      })
    ).toBe(true)
  })
})

describe("needsLiveOperatorAttention", () => {
  test("treats pending and on-hold as needing an operator", () => {
    expect(needsLiveOperatorAttention("pending")).toBe(true)
    expect(needsLiveOperatorAttention("on_hold")).toBe(true)
    expect(needsLiveOperatorAttention("on-hold")).toBe(true)
    expect(needsLiveOperatorAttention("ON HOLD")).toBe(true)
  })

  test("ignores kitchen-in-progress statuses", () => {
    expect(needsLiveOperatorAttention("confirmed")).toBe(false)
    expect(needsLiveOperatorAttention("preparing")).toBe(false)
    expect(needsLiveOperatorAttention(null)).toBe(false)
  })
})

describe("sellLiveDockCountsFromOrders", () => {
  test("counts open tickets and those that need an operator", () => {
    expect(
      sellLiveDockCountsFromOrders([
        { orderStatus: "pending", paymentStatus: "pending" },
        { orderStatus: "preparing", paymentStatus: "pending" },
        { orderStatus: "completed", paymentStatus: "paid" },
        { orderStatus: "completed", paymentStatus: "pending" },
        { orderStatus: "cancelled", paymentStatus: "pending" }
      ])
    ).toEqual({ liveCount: 3, needCount: 1 })
  })
})
