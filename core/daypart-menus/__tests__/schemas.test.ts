import { describe, expect, test } from "bun:test"
import { ERROR_MESSAGES } from "@/constants"
import {
  daypartMenuFormSchema,
  daypartMenusUpdateSchema,
  menuAvailabilitySchema,
  outsideMenuHoursErrorSchema
} from "../schemas"

describe("daypartMenusUpdateSchema", () => {
  test("accepts the four slugs and rejects a name field", () => {
    const parsed = daypartMenusUpdateSchema.parse({
      menus: [
        { slug: "morning", startTime: "08:00", endTime: "10:00" },
        { slug: "noon", startTime: "10:00", endTime: "16:00" },
        { slug: "evening", startTime: "16:00", endTime: "19:00" },
        { slug: "dinner", startTime: "19:00", endTime: "00:00" }
      ]
    })
    expect(parsed.menus).toHaveLength(4)
    expect(
      daypartMenusUpdateSchema.safeParse({
        menus: [
          {
            slug: "morning",
            name: "Breakfast",
            startTime: "08:00",
            endTime: "10:00"
          }
        ]
      }).success
    ).toBe(false)
  })
})

describe("daypartMenuFormSchema", () => {
  test("accepts clock times and rejects extra fields", () => {
    expect(
      daypartMenuFormSchema.parse({ startTime: "08:00", endTime: "10:00" })
    ).toEqual({ startTime: "08:00", endTime: "10:00" })
    expect(
      daypartMenuFormSchema.safeParse({
        startTime: "08:00",
        endTime: "10:00",
        name: "Breakfast"
      }).success
    ).toBe(false)
  })
})

describe("menuAvailabilitySchema", () => {
  test("accepts the three shared keys and strips extras", () => {
    expect(
      menuAvailabilitySchema.parse({
        available: false,
        extra: true,
        liveMenuSlug: "noon",
        menuSlugs: ["morning"]
      })
    ).toEqual({
      available: false,
      liveMenuSlug: "noon",
      menuSlugs: ["morning"]
    })
    expect(
      menuAvailabilitySchema.safeParse({
        available: false,
        liveMenuSlug: "brunch",
        menuSlugs: []
      }).success
    ).toBe(false)
  })
})

describe("outsideMenuHoursErrorSchema", () => {
  test("accepts the 400 body and rejects PRODUCT_NOT_FOUND", () => {
    expect(
      outsideMenuHoursErrorSchema.parse({
        code: ERROR_MESSAGES.OUTSIDE_MENU_HOURS,
        message: "This item is not available on the current menu",
        params: {
          liveMenuSlug: "noon",
          menuSlugs: ["morning"],
          productName: "Omelette"
        },
        statusCode: 400
      }).code
    ).toBe(ERROR_MESSAGES.OUTSIDE_MENU_HOURS)
    expect(
      outsideMenuHoursErrorSchema.safeParse({
        code: "PRODUCT_NOT_FOUND"
      }).success
    ).toBe(false)
  })
})
