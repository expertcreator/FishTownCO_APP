import { SUPPORTED_LANGUAGES } from "@/constants"
import { describe, expect, it } from "vitest"
import { isReservedSlug, RESERVED_SLUGS, slugSchema } from "../index"

describe("RESERVED_SLUGS", () => {
  it("covers every static top-level route that shadows [city]", () => {
    expect(RESERVED_SLUGS).toEqual(
      expect.arrayContaining([
        "cart",
        "checkout",
        "order",
        "search",
        "about",
        "api",
        "_next"
      ])
    )
  })

  it("derives the locale codes from @/constants so a new locale cannot collide", () => {
    for (const locale of SUPPORTED_LANGUAGES) {
      expect(RESERVED_SLUGS).toContain(locale)
    }
  })
})

describe("isReservedSlug", () => {
  it.each([
    ["cart", "static route"],
    ["CHECKOUT", "uppercase static route"],
    ["_next", "framework path that is not a legal slug"],
    ["ur", "locale code"],
    ["ar", "locale this app does not serve but still reserves"],
    ["Api", "mixed case"]
  ])("reserves %s (%s)", (value) => {
    expect(isReservedSlug(value)).toBe(true)
  })

  it.each([
    ["gujranwala", "a real city"],
    ["magnoliya-park", "a real area"],
    ["carts", "a superstring of a reserved word"],
    ["", "empty string"],
    [" cart ", "padded — the router never produces this segment"]
  ])("does not reserve %s (%s)", (value) => {
    expect(isReservedSlug(value)).toBe(false)
  })

  it("is checked before format validation, not after", () => {
    expect(isReservedSlug("_next")).toBe(true)
    expect(slugSchema.safeParse("_next").success).toBe(false)
  })
})
