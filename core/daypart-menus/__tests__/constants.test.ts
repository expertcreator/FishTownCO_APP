import { describe, expect, test } from "bun:test"
import { DAYPART_MENU_SLUGS } from "@/constants"
import {
  DAYPART_MENUS_API,
  DEFAULT_DAYPART_WINDOWS,
  MENU_HOURS_NOTICE_KEYS,
  daypartSlugLabelKey
} from "../constants"

describe("DAYPART_MENUS_API", () => {
  test("encodes the branch id on the daypart path", () => {
    expect(DAYPART_MENUS_API.byBranch("abc")).toBe("daypart-menus/branch/abc")
    expect(DAYPART_MENUS_API.byBranch("a/b")).toBe("daypart-menus/branch/a%2Fb")
  })
})

describe("DEFAULT_DAYPART_WINDOWS", () => {
  test("covers the four locked slugs", () => {
    expect(DEFAULT_DAYPART_WINDOWS.map((row) => row.slug)).toEqual([
      ...DAYPART_MENU_SLUGS
    ])
  })
})

describe("daypartSlugLabelKey", () => {
  test("maps locked slugs and ignores unknown ones", () => {
    expect(daypartSlugLabelKey("morning")).toBe("daypart-menu-morning")
    expect(daypartSlugLabelKey("breakfast")).toBeNull()
  })
})

describe("MENU_HOURS_NOTICE_KEYS", () => {
  test("keeps customer copy keys slug-based, not clock-based", () => {
    expect(MENU_HOURS_NOTICE_KEYS.notOnCurrentMenu).toBe(
      "menu-hours-not-on-current-menu"
    )
    expect(MENU_HOURS_NOTICE_KEYS.availableOn).toBe("menu-hours-available-on")
  })
})
