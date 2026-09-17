import { describe, expect, test } from "bun:test"
import {
  clockInTimeZone,
  findOverlappingPair,
  isTimeInRange,
  productMatchesLiveMenu,
  resolveLiveSlug,
  windowToSegments,
  windowsOverlap
} from "../windows"

describe("daypart windows", () => {
  test("adjacent exclusive ends do not overlap", () => {
    expect(
      windowsOverlap(
        { startTime: "08:00", endTime: "10:00" },
        { startTime: "10:00", endTime: "16:00" }
      )
    ).toBe(false)
    expect(
      findOverlappingPair([
        { slug: "morning", startTime: "08:00", endTime: "10:00" },
        { slug: "noon", startTime: "10:00", endTime: "16:00" },
        { slug: "evening", startTime: "16:00", endTime: "19:00" },
        { slug: "dinner", startTime: "19:00", endTime: "00:00" }
      ])
    ).toBeNull()
  })

  test("names the overlapping pair", () => {
    expect(
      findOverlappingPair([
        { slug: "morning", startTime: "08:00", endTime: "10:00" },
        { slug: "noon", startTime: "10:00", endTime: "16:00" },
        { slug: "evening", startTime: "16:00", endTime: "19:00" },
        { slug: "dinner", startTime: "18:00", endTime: "04:00" }
      ])
    ).toEqual(["evening", "dinner"])
  })

  test("treats midnight end as close, not a wrap", () => {
    expect(windowToSegments("19:00", "00:00")).toEqual([[19 * 60, 1440]])
    expect(isTimeInRange("23:00", "19:00", "00:00")).toBe(true)
    expect(isTimeInRange("00:00", "19:00", "00:00")).toBe(false)
  })

  test("empty ticks are all-day; tagged items need the live slug", () => {
    expect(productMatchesLiveMenu([], "noon")).toBe(true)
    expect(productMatchesLiveMenu(["morning"], "noon")).toBe(false)
    expect(productMatchesLiveMenu(["morning"], null)).toBe(false)
    expect(productMatchesLiveMenu([], null)).toBe(true)
  })

  test("skips menus that do not contain now", () => {
    const menus = [
      { slug: "morning" as const, startTime: "08:00", endTime: "10:00" },
      { slug: "noon" as const, startTime: "10:00", endTime: "16:00" },
      { slug: "evening" as const, startTime: "18:00", endTime: "19:00" },
      { slug: "dinner" as const, startTime: "19:00", endTime: "04:00" }
    ]
    expect(resolveLiveSlug(menus, "09:00")).toBe("morning")
    expect(resolveLiveSlug(menus, "20:00")).toBe("dinner")
  })

  test("5:45pm in the client zone is Evening, not Noon", () => {
    const now = new Date("2026-08-28T12:45:00.000Z")
    expect(clockInTimeZone(now, "UTC")).toBe("12:45")
    expect(clockInTimeZone(now, "Asia/Karachi")).toBe("17:45")
    const menus = [
      { slug: "morning" as const, startTime: "08:00", endTime: "10:00" },
      { slug: "noon" as const, startTime: "10:00", endTime: "16:00" },
      { slug: "evening" as const, startTime: "16:00", endTime: "19:00" },
      { slug: "dinner" as const, startTime: "19:00", endTime: "00:00" }
    ]
    expect(resolveLiveSlug(menus, clockInTimeZone(now, "Asia/Karachi"))).toBe(
      "evening"
    )
  })
})
