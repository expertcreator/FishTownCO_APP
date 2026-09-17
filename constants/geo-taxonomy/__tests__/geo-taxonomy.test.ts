import { describe, expect, test } from "vitest"
import {
  GEO_AREA_SLUGS,
  GEO_CITY_SLUGS,
  GEO_LOCATION_OTHER,
  GEO_TAXONOMY_SEED,
  USER_AREA_SLUGS,
  USER_CITY_SLUGS
} from "../seed"

describe("GEO_TAXONOMY_SEED", () => {
  test("authors at least one city with areas that each have a pin and radius", () => {
    const cities = Object.values(GEO_TAXONOMY_SEED)

    expect(cities.length).toBeGreaterThan(0)
    for (const city of cities) {
      expect(city).not.toHaveProperty("coordinates")
      const areas = Object.values(city.areas)
      expect(areas.length).toBeGreaterThan(0)
      for (const area of areas) {
        expect(area.radiusKm).toBeGreaterThan(0)
        expect(Number.isFinite(area.coordinates.latitude)).toBe(true)
        expect(Number.isFinite(area.coordinates.longitude)).toBe(true)
      }
    }
  })

  test("includes the live Gujranwala / Magnoliya Park entry", () => {
    expect(GEO_TAXONOMY_SEED.gujranwala.isLive).toBe(true)
    expect(GEO_TAXONOMY_SEED.gujranwala.areas["magnoliya-park"]?.isLive).toBe(
      true
    )
  })

  test("exposes city and area slugs for the user location enums", () => {
    expect(GEO_CITY_SLUGS).toContain("gujranwala")
    expect(GEO_AREA_SLUGS).toContain("magnoliya-park")
    expect(GEO_AREA_SLUGS).toContain("dc-colony")
    expect(GEO_AREA_SLUGS).toContain("khiyali")
    expect(GEO_AREA_SLUGS).toContain("master-city")
    expect(GEO_CITY_SLUGS).toContain("daska")
    expect(GEO_AREA_SLUGS).toContain("daska-city")
    expect(GEO_CITY_SLUGS).not.toContain(GEO_LOCATION_OTHER)
    expect(GEO_AREA_SLUGS).not.toContain(GEO_LOCATION_OTHER)
    expect(USER_CITY_SLUGS).toContain(GEO_LOCATION_OTHER)
    expect(USER_AREA_SLUGS).toContain(GEO_LOCATION_OTHER)
  })
})
