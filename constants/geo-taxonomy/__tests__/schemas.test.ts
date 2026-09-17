import { describe, expect, it } from "vitest"
import {
  areaSchema,
  citySchema,
  coordinatesSchema,
  localizedTextSchema,
  optionalLocalizedTextSchema,
  SLUG_REGEX,
  slugSchema
} from "../schemas"

describe("slugSchema", () => {
  it.each([
    ["magnoliya-park", "kebab case"],
    ["ur2", "digits are allowed"],
    ["a", "single character"]
  ])("accepts %s (%s)", (value) => {
    expect(slugSchema.parse(value)).toBe(value)
  })

  it("never coerces or slugifies a display name", () => {
    expect(slugSchema.safeParse("Al Rehman").success).toBe(false)
    expect(SLUG_REGEX.test("Al Rehman")).toBe(false)
  })
})

describe("localizedTextSchema", () => {
  it("normalizes a full record and drops ar", () => {
    expect(
      localizedTextSchema.parse({
        ar: "الرحمن",
        en: "Al Rehman",
        ur: "Al Rehman"
      })
    ).toEqual({ en: "Al Rehman", ur: "Al Rehman" })
  })

  it("rejects a record with no usable en/ur value", () => {
    expect(() => localizedTextSchema.parse({ ar: "الرحمن" })).toThrow()
  })
})

describe("optionalLocalizedTextSchema", () => {
  it("maps empty input to null", () => {
    expect(optionalLocalizedTextSchema.parse({})).toBeNull()
  })
})

describe("coordinatesSchema", () => {
  it("accepts decimal strings from a postgres numeric column", () => {
    expect(
      coordinatesSchema.parse({ latitude: "32.1877", longitude: "74.1945" })
    ).toEqual({ latitude: 32.1877, longitude: 74.1945 })
  })
})

describe("citySchema and areaSchema", () => {
  it("parses a city with no coordinates", () => {
    const city = citySchema.parse({
      id: "city-1",
      isLive: true,
      name: "Gujranwala",
      slug: "gujranwala"
    })

    expect(city.coordinates).toBeNull()
    expect(city.areaCount).toBe(0)
  })

  it("parses an area and keeps its query points", () => {
    const area = areaSchema.parse({
      citySlug: "gujranwala",
      coordinates: [{ latitude: 32.1877, longitude: 74.1945 }],
      id: "area-1",
      isLive: true,
      name: "Magnoliya Park",
      slug: "magnoliya-park"
    })

    expect(area.coordinates).toHaveLength(1)
    expect(area.restaurantCount).toBe(0)
  })
})
