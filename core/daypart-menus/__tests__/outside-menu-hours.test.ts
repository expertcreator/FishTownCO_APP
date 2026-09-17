import { describe, expect, test } from "bun:test"
import { ERROR_MESSAGES } from "@/constants"
import {
  formatOutsideMenuHoursMessage,
  parseOutsideMenuHoursError
} from "../errors"

const t = (key: string, options?: Record<string, string>) => {
  if (options?.productName && options.menus) {
    return `${options.productName}|${options.menus}`
  }
  return key
}

describe("parseOutsideMenuHoursError", () => {
  test("reads body params and axios-shaped envelopes", () => {
    const body = {
      code: ERROR_MESSAGES.OUTSIDE_MENU_HOURS,
      message: "This item is not available on the current menu",
      params: {
        liveMenuSlug: "noon",
        menuSlugs: ["morning"],
        productName: "Omelette"
      },
      statusCode: 400
    }
    expect(parseOutsideMenuHoursError(body)).toEqual({
      code: ERROR_MESSAGES.OUTSIDE_MENU_HOURS,
      liveMenuSlug: "noon",
      menuSlugs: ["morning"],
      message: "This item is not available on the current menu",
      productName: "Omelette"
    })
    expect(
      parseOutsideMenuHoursError({ response: { data: body, status: 400 } })
        ?.productName
    ).toBe("Omelette")
  })

  test("ignores PRODUCT_NOT_FOUND and other codes", () => {
    expect(
      parseOutsideMenuHoursError({
        code: "PRODUCT_NOT_FOUND",
        message: "Product doesn't exist"
      })
    ).toBeNull()
    expect(parseOutsideMenuHoursError(null)).toBeNull()
  })
})

describe("formatOutsideMenuHoursMessage", () => {
  test("prefers product + menus, then server message, then the generic key", () => {
    expect(
      formatOutsideMenuHoursMessage(
        {
          code: ERROR_MESSAGES.OUTSIDE_MENU_HOURS,
          liveMenuSlug: "noon",
          menuSlugs: ["morning"],
          message: "fallback",
          productName: "Omelette"
        },
        t
      )
    ).toBe("Omelette|daypart-menu-morning")
    expect(
      formatOutsideMenuHoursMessage(
        {
          code: ERROR_MESSAGES.OUTSIDE_MENU_HOURS,
          liveMenuSlug: null,
          menuSlugs: [],
          message: "This item is not available on the current menu",
          productName: null
        },
        t
      )
    ).toBe("This item is not available on the current menu")
    expect(
      formatOutsideMenuHoursMessage(
        {
          code: ERROR_MESSAGES.OUTSIDE_MENU_HOURS,
          liveMenuSlug: null,
          menuSlugs: [],
          message: null,
          productName: null
        },
        t
      )
    ).toBe("menu-hours-not-on-current-menu")
  })
})
