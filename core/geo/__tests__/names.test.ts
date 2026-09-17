import { describe, expect, test } from "bun:test"
import { geoAreaMapPin, geoDisplayName } from "../names"

describe("geoDisplayName", () => {
  test("prefers the active locale, then English, then the first non-empty value", () => {
    expect(geoDisplayName({ en: "Lahore", ur: "لاہور" }, "ur")).toBe("لاہور")
    expect(geoDisplayName({ en: "Lahore", ur: "لاہور" }, "ar")).toBe("Lahore")
    expect(geoDisplayName({ ar: "لاهور", ur: "لاہور" }, "en")).toBe("لاهور")
    expect(geoDisplayName({ en: "  ", ur: "لاہور" }, "en")).toBe("لاہور")
    expect(geoDisplayName({}, "en")).toBe("")
  })
})

describe("geoAreaMapPin", () => {
  test("reads latitude and longitude from the area", () => {
    expect(geoAreaMapPin({ latitude: 32.1, longitude: 74.2 })).toEqual({
      latitude: 32.1,
      longitude: 74.2
    })
  })
})
