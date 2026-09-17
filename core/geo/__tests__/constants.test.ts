import { describe, expect, test } from "bun:test"
import { GEO_API, GEO_DEFAULT_PAGE, GEO_LIST_PAGE_SIZE } from "../constants"

describe("geo constants", () => {
  test("points at live discovery geo paths", () => {
    expect(GEO_API.cities).toBe("geo-cities")
    expect(GEO_API.areas).toBe("geo-areas")
    expect(GEO_API.areaAtPoint).toBe("geo-areas/at-point")
    expect(GEO_API.cityAreas("city 1")).toBe("geo-cities/city%201/areas")
    expect(GEO_API.areaServices("area 1")).toBe("geo-areas/area%201/services")
    expect(GEO_DEFAULT_PAGE).toBe(0)
    expect(GEO_LIST_PAGE_SIZE).toBe(100)
  })
})
