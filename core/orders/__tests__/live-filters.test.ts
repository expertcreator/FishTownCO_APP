import { describe, expect, test } from "bun:test"
import {
  buildSellLiveColumnFilters,
  buildSellLiveUnpaidCompletedColumnFilters,
  EMPTY_SELL_LIVE_FILTERS,
  mergeUnpaidCompletedIntoLivePage,
  sellLiveHasActiveFilters,
  shouldIncludeUnpaidCompletedOnSellLive,
  toggleSellLiveFilterValue
} from "../live-filters"

describe("sell live filters", () => {
  test("toggles facet values and reports active filters", () => {
    expect(toggleSellLiveFilterValue(["pending"], "ready")).toEqual([
      "pending",
      "ready"
    ])
    expect(toggleSellLiveFilterValue(["pending", "ready"], "pending")).toEqual([
      "ready"
    ])
    expect(sellLiveHasActiveFilters(EMPTY_SELL_LIVE_FILTERS)).toBe(false)
    expect(
      sellLiveHasActiveFilters({
        ...EMPTY_SELL_LIVE_FILTERS,
        search: "12",
        orderStatus: ["preparing"]
      })
    ).toBe(true)
  })

  test("builds admin column filters from the selected branch and facets", () => {
    expect(buildSellLiveColumnFilters("", EMPTY_SELL_LIVE_FILTERS)).toEqual([
      {
        id: "orderStatus",
        value: ["pending", "confirmed", "preparing", "ready", "on_hold"]
      }
    ])
    expect(
      buildSellLiveColumnFilters("branch-1", {
        search: "ignored-here",
        orderStatus: ["pending"],
        orderType: ["Delivery"],
        paymentStatus: [],
        orderFrom: ["marketplace"]
      })
    ).toEqual([
      { id: "branchId", value: "branch-1" },
      { id: "orderStatus", value: ["pending"] },
      { id: "orderType", value: ["Delivery"] },
      { id: "orderFrom", value: ["marketplace"] }
    ])
  })

  test("includes unpaid completed tickets unless facets exclude them", () => {
    expect(
      shouldIncludeUnpaidCompletedOnSellLive(EMPTY_SELL_LIVE_FILTERS)
    ).toBe(true)
    expect(
      shouldIncludeUnpaidCompletedOnSellLive({
        ...EMPTY_SELL_LIVE_FILTERS,
        orderStatus: ["completed"],
        paymentStatus: ["pending"]
      })
    ).toBe(true)
    expect(
      shouldIncludeUnpaidCompletedOnSellLive({
        ...EMPTY_SELL_LIVE_FILTERS,
        orderStatus: ["preparing"]
      })
    ).toBe(false)
    expect(
      shouldIncludeUnpaidCompletedOnSellLive({
        ...EMPTY_SELL_LIVE_FILTERS,
        paymentStatus: ["paid"]
      })
    ).toBe(false)
  })

  test("builds unpaid completed column filters with branch and facets", () => {
    expect(buildSellLiveUnpaidCompletedColumnFilters("")).toEqual([
      { id: "orderStatus", value: ["completed"] },
      { id: "paymentStatus", value: ["pending"] }
    ])
    expect(
      buildSellLiveUnpaidCompletedColumnFilters("branch-1", {
        ...EMPTY_SELL_LIVE_FILTERS,
        orderType: ["DineIn"],
        orderFrom: ["pos"]
      })
    ).toEqual([
      { id: "orderStatus", value: ["completed"] },
      { id: "paymentStatus", value: ["pending"] },
      { id: "branchId", value: "branch-1" },
      { id: "orderType", value: ["DineIn"] },
      { id: "orderFrom", value: ["pos"] }
    ])
  })

  test("merges unpaid completed tickets onto the first live page", () => {
    expect(
      mergeUnpaidCompletedIntoLivePage({
        kitchenPage: {
          data: [{ id: "k1", createdAt: "2026-08-28T10:00:00.000Z" }],
          total: 1
        },
        unpaidCompleted: [
          { id: "u1", createdAt: "2026-08-28T11:00:00.000Z" },
          { id: "k1", createdAt: "2026-08-28T10:00:00.000Z" }
        ],
        pageIndex: 0
      })
    ).toEqual({
      data: [
        { id: "u1", createdAt: "2026-08-28T11:00:00.000Z" },
        { id: "k1", createdAt: "2026-08-28T10:00:00.000Z" }
      ],
      total: 2
    })
    expect(
      mergeUnpaidCompletedIntoLivePage({
        kitchenPage: {
          data: [{ id: "k2", createdAt: "2026-08-27T10:00:00.000Z" }],
          total: 21
        },
        unpaidCompleted: [{ id: "u1", createdAt: "2026-08-28T11:00:00.000Z" }],
        pageIndex: 1
      })
    ).toEqual({
      data: [{ id: "k2", createdAt: "2026-08-27T10:00:00.000Z" }],
      total: 22
    })
  })
})
