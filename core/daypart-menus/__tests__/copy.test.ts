import { describe, expect, test } from "bun:test"
import {
  formatMenuHoursNotice,
  formatMenuSlugLabels,
  formatOffMenuCustomerBanner,
  resolveMenuHoursCartNotice,
  resolveMenuHoursNotice
} from "../copy"

const t = (key: string, options?: Record<string, string>) =>
  options?.menus
    ? `${key}:${options.menus}`
    : options?.productName
      ? `${key}:${options.productName}`
      : key

describe("resolveMenuHoursNotice", () => {
  test("is silent when available or unread", () => {
    expect(resolveMenuHoursNotice(null)).toEqual({ kind: "none" })
    expect(
      resolveMenuHoursNotice({
        available: true,
        liveMenuSlug: "noon",
        menuSlugs: []
      })
    ).toEqual({ kind: "none" })
  })

  test("names the item menus when a live slug exists", () => {
    expect(
      resolveMenuHoursNotice({
        available: false,
        liveMenuSlug: "noon",
        menuSlugs: ["morning"]
      })
    ).toEqual({ kind: "available-on", slugs: ["morning"] })
  })

  test("uses the gap copy when liveMenuSlug is null", () => {
    expect(
      resolveMenuHoursNotice({
        available: false,
        liveMenuSlug: null,
        menuSlugs: ["morning"]
      })
    ).toEqual({ kind: "not-right-now" })
  })
})

describe("resolveMenuHoursCartNotice", () => {
  test("always uses current-menu copy for off-menu cart lines", () => {
    expect(
      resolveMenuHoursCartNotice({
        available: false,
        liveMenuSlug: "noon",
        menuSlugs: ["morning"]
      })
    ).toEqual({ kind: "not-on-current-menu" })
    expect(
      resolveMenuHoursCartNotice({
        available: true,
        liveMenuSlug: "noon",
        menuSlugs: []
      })
    ).toEqual({ kind: "none" })
  })
})

describe("formatMenuHoursNotice", () => {
  test("interpolates slug labels for the available-on sentence", () => {
    expect(formatMenuHoursNotice({ kind: "none" }, t)).toBeNull()
    expect(formatMenuHoursNotice({ kind: "not-on-current-menu" }, t)).toBe(
      "menu-hours-not-on-current-menu"
    )
    expect(formatMenuHoursNotice({ kind: "not-right-now" }, t)).toBe(
      "menu-hours-not-right-now"
    )
    expect(
      formatMenuHoursNotice(
        { kind: "available-on", slugs: ["morning", "dinner"] },
        t
      )
    ).toBe("menu-hours-available-on:daypart-menu-morning, daypart-menu-dinner")
  })
})

describe("formatMenuSlugLabels", () => {
  test("joins locked labels and skips junk", () => {
    expect(formatMenuSlugLabels(["morning", "brunch"], t)).toBe(
      "daypart-menu-morning"
    )
  })
})

describe("formatOffMenuCustomerBanner", () => {
  test("starts with the current-menu sentence and names the item menus", () => {
    expect(
      formatOffMenuCustomerBanner(
        {
          available: false,
          liveMenuSlug: "noon",
          menuSlugs: ["morning"]
        },
        t
      )
    ).toBe(
      "menu-hours-not-on-current-menu. menu-hours-available-on:daypart-menu-morning"
    )
  })

  test("is silent when unread or on-menu", () => {
    expect(formatOffMenuCustomerBanner(null, t)).toBeNull()
    expect(
      formatOffMenuCustomerBanner(
        { available: true, liveMenuSlug: "noon", menuSlugs: [] },
        t
      )
    ).toBeNull()
  })
})
