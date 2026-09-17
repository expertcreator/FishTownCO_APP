import { describe, expect, test } from "bun:test"
import {
  buildSellDockCartLabels,
  buildSellDockLiveLabels
} from "../dock-labels"

describe("buildSellDockCartLabels", () => {
  test("empty cart uses start copy", () => {
    expect(
      buildSellDockCartLabels({
        qty: 0,
        formattedTotal: "PKR 0",
        emptyBot: "Tap a product to start",
        cartLabel: "Cart",
        reviewOne: "1 item · review",
        reviewMany: "{count} items · review"
      })
    ).toEqual({
      top: "Cart",
      bot: "Tap a product to start",
      hasQty: false,
      qty: 0
    })
  })

  test("filled cart shows total and review copy", () => {
    expect(
      buildSellDockCartLabels({
        qty: 3,
        formattedTotal: "PKR 900",
        emptyBot: "Tap a product to start",
        cartLabel: "Cart",
        reviewOne: "1 item · review",
        reviewMany: "{count} items · review"
      })
    ).toEqual({
      top: "PKR 900",
      bot: "3 items · review",
      hasQty: true,
      qty: 3
    })
  })
})

describe("buildSellDockLiveLabels", () => {
  test("flags tickets that need attention", () => {
    expect(
      buildSellDockLiveLabels({
        liveCount: 13,
        needCount: 2,
        liveMain: "{count} live",
        needSub: "{count} need you",
        calmSub: "all under control"
      })
    ).toEqual({
      main: "13 live",
      sub: "2 need you",
      needsAttention: true
    })
  })

  test("calm copy when nothing needs the operator", () => {
    expect(
      buildSellDockLiveLabels({
        liveCount: 4,
        needCount: 0,
        liveMain: "{count} live",
        needSub: "{count} need you",
        calmSub: "all under control"
      })
    ).toEqual({
      main: "4 live",
      sub: "all under control",
      needsAttention: false
    })
  })
})
