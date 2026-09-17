import { describe, expect, test } from "bun:test"
import { DAYPART_MENU_SLUGS } from "@/constants"
import { isDaypartMenuSlug, normalizeMenuSlugs } from "../slugs"

describe("DAYPART_MENU_SLUGS", () => {
  test("locks the four restaurant-wide slugs", () => {
    expect(DAYPART_MENU_SLUGS).toEqual(["morning", "noon", "evening", "dinner"])
  })
})

describe("isDaypartMenuSlug", () => {
  test("accepts the four locked slugs", () => {
    expect(isDaypartMenuSlug("morning")).toBe(true)
    expect(isDaypartMenuSlug("breakfast")).toBe(false)
  })
})

describe("normalizeMenuSlugs", () => {
  test("keeps locked slugs in order and drops junk", () => {
    expect(normalizeMenuSlugs(["dinner", "morning", "breakfast"])).toEqual([
      "morning",
      "dinner"
    ])
    expect(normalizeMenuSlugs(undefined)).toEqual([])
  })
})
