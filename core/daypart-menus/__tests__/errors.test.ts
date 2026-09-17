import { describe, expect, test } from "bun:test"
import { parseDaypartSaveError } from "../errors"

describe("parseDaypartSaveError", () => {
  test("reads overlap pair from slugA/slugB or slugs", () => {
    expect(
      parseDaypartSaveError({
        code: "DAYPART_MENUS_OVERLAP",
        params: { slugs: ["evening", "dinner"] }
      })
    ).toEqual({ kind: "overlap", slugA: "evening", slugB: "dinner" })
  })

  test("reads invalid set", () => {
    expect(
      parseDaypartSaveError({
        code: "DAYPART_MENUS_INVALID"
      })
    ).toEqual({ kind: "invalid" })
  })

  test("ignores the old outside-hours code", () => {
    expect(
      parseDaypartSaveError({
        code: "DAYPART_MENU_OUTSIDE_HOURS",
        params: { slug: "morning" }
      })
    ).toBeNull()
  })
})
