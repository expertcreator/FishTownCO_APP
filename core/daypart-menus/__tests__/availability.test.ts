import { describe, expect, test } from "bun:test"
import {
  cartHasOffMenuLines,
  isOffMenu,
  isReorderBlockedByMenuHours,
  pickLiveMenuAvailability,
  readMenuAvailability,
  readMenuAvailabilityDeep,
  readReorderFlag,
  resolveReorderBlockReason,
  shouldDisableAddToCart,
  shouldDisableCheckout,
  shouldDisableReorder
} from "../availability"

const offMenu = {
  available: false,
  liveMenuSlug: "noon" as const,
  menuSlugs: ["morning" as const]
}

const onMenu = {
  available: true,
  liveMenuSlug: "noon" as const,
  menuSlugs: [] as const
}

describe("readMenuAvailability", () => {
  test("reads the three keys and drops unknown slugs", () => {
    expect(
      readMenuAvailability({
        available: false,
        extra: true,
        liveMenuSlug: "noon",
        menuSlugs: ["dinner", "breakfast", "morning"]
      })
    ).toEqual({
      available: false,
      liveMenuSlug: "noon",
      menuSlugs: ["morning", "dinner"]
    })
  })

  test("returns null when available is missing so old payloads do not block", () => {
    expect(readMenuAvailability({ menuSlugs: ["morning"] })).toBeNull()
    expect(readMenuAvailability(null)).toBeNull()
  })

  test("treats an invalid live slug as a gap", () => {
    expect(
      readMenuAvailability({
        available: false,
        liveMenuSlug: "brunch",
        menuSlugs: ["morning"]
      })?.liveMenuSlug
    ).toBeNull()
  })

  test("ignores catalog in-stock available without menu-hours keys", () => {
    expect(readMenuAvailability({ available: true })).toBeNull()
    expect(readMenuAvailability({ available: false })).toBeNull()
  })

  test("coerces string and numeric available", () => {
    expect(
      readMenuAvailability({
        available: "false",
        liveMenuSlug: "noon",
        menuSlugs: ["morning"]
      })
    ).toEqual(offMenu)
  })
})

describe("readMenuAvailabilityDeep", () => {
  test("prefers root flags then nested product", () => {
    expect(
      readMenuAvailabilityDeep({
        product: offMenu
      })
    ).toEqual(offMenu)
    expect(
      readMenuAvailabilityDeep({
        data: offMenu
      })
    ).toEqual(offMenu)
    expect(
      readMenuAvailabilityDeep({
        available: true,
        liveMenuSlug: "noon",
        menuSlugs: [],
        product: offMenu
      })?.available
    ).toBe(true)
  })

  test("reads flags on data and nested product, not the success wrapper", () => {
    expect(
      readMenuAvailabilityDeep({
        data: {
          available: false,
          liveMenuSlug: "noon",
          menuSlugs: ["morning"],
          product: { available: true }
        },
        success: true
      })
    ).toEqual(offMenu)
  })
})

describe("pickLiveMenuAvailability", () => {
  test("prefers the live payload over a cart snapshot", () => {
    expect(pickLiveMenuAvailability(offMenu, onMenu)).toEqual(offMenu)
    expect(pickLiveMenuAvailability(undefined, offMenu)).toEqual(offMenu)
  })
})

describe("checkout and add gates", () => {
  test("disables checkout only when a line is explicitly off-menu", () => {
    expect(shouldDisableCheckout([onMenu, { id: "legacy" }])).toBe(false)
    expect(shouldDisableCheckout([onMenu, offMenu])).toBe(true)
    expect(cartHasOffMenuLines([])).toBe(false)
    expect(isOffMenu(offMenu)).toBe(true)
    expect(shouldDisableAddToCart({ product: offMenu })).toBe(true)
    expect(shouldDisableAddToCart(onMenu)).toBe(false)
  })
})

describe("reorder gates", () => {
  test("reads reOrder from the root or data envelope", () => {
    expect(readReorderFlag({ reOrder: false })).toBe(false)
    expect(readReorderFlag({ data: { reOrder: true } })).toBe(true)
    expect(readReorderFlag({})).toBeNull()
    expect(shouldDisableReorder({ reOrder: false })).toBe(true)
    expect(shouldDisableReorder({ reOrder: true })).toBe(false)
    expect(shouldDisableReorder({})).toBe(false)
  })

  test("menu-hours vs other reorder refusals", () => {
    expect(resolveReorderBlockReason({ reOrder: false, ...offMenu })).toBe(
      "menu-hours"
    )
    expect(resolveReorderBlockReason({ reOrder: false, ...onMenu })).toBe(
      "other"
    )
    expect(resolveReorderBlockReason({ reOrder: true, ...onMenu })).toBe("none")
    expect(isReorderBlockedByMenuHours({ reOrder: false, ...offMenu })).toBe(
      true
    )
    expect(isReorderBlockedByMenuHours({ reOrder: false, ...onMenu })).toBe(
      false
    )
  })
})
