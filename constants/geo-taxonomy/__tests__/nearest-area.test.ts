import { describe, expect, it } from "vitest"
import { distanceKm, nearestArea } from "../nearest-area"

/** A query point inside Magnoliya Park, matching `home-listing.test.ts`. */
const PARK = { latitude: 32.102_014, longitude: 74.208_89 }

/** A second point ~0.6km north of {@link PARK}. */
const PARK_NORTH = { latitude: 32.107_558, longitude: 74.207_746 }

/** Lahore city centre — ~80km from {@link PARK}, outside any seeded radius. */
const LAHORE = { latitude: 31.5204, longitude: 74.3587 }

describe("distanceKm", () => {
  it("answers 0 for identical points", () => {
    expect(distanceKm(PARK, PARK)).toBe(0)
  })

  it("is symmetric", () => {
    expect(distanceKm(PARK, LAHORE)).toBeCloseTo(distanceKm(LAHORE, PARK), 10)
  })

  it("matches the known length of one degree of longitude at the equator", () => {
    // 2π * 6371 / 360 = 111.1949...km. Pins the haversine against an external
    // figure rather than against its own output.
    const distance = distanceKm(
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 }
    )

    expect(distance).toBeCloseTo(111.195, 2)
  })

  it("measures the two park points as neighbours, not strangers", () => {
    const distance = distanceKm(PARK, PARK_NORTH)

    expect(distance).toBeGreaterThan(0.3)
    expect(distance).toBeLessThan(1)
  })
})

describe("nearestArea", () => {
  const park = { coordinates: [PARK, PARK_NORTH], radiusKm: 5, slug: "park" }
  const farAway = { coordinates: [LAHORE], radiusKm: 5, slug: "lahore" }

  it("answers null for an empty candidate list", () => {
    expect(nearestArea(PARK, [])).toBeNull()
  })

  it("matches the area a point sits inside", () => {
    expect(nearestArea(PARK, [farAway, park])).toBe(park)
  })

  it("answers null when every area is out of range", () => {
    expect(nearestArea(LAHORE, [park])).toBeNull()
  })

  it("includes the boundary: a distance exactly at radiusKm still matches", () => {
    // Same predicate the discovery listing applies (`distance <= radiusKm`,
    // home-queries.ts) — the frontier of an area belongs to it on both sides.
    const zeroRadius = { coordinates: [PARK], radiusKm: 0, slug: "edge" }

    expect(nearestArea(PARK, [zeroRadius])).toBe(zeroRadius)
  })

  it("prefers the nearer of two qualifying areas regardless of order", () => {
    const near = { coordinates: [PARK], radiusKm: 50, slug: "near" }
    const far = { coordinates: [PARK_NORTH], radiusKm: 50, slug: "far" }
    // A point much closer to PARK than to PARK_NORTH.
    const point = { latitude: 32.1022, longitude: 74.2089 }

    expect(nearestArea(point, [far, near])?.slug).toBe("near")
    expect(nearestArea(point, [near, far])?.slug).toBe("near")
  })

  it("keeps the earlier candidate on an exact tie", () => {
    const first = { coordinates: [PARK], radiusKm: 5, slug: "first" }
    const second = { coordinates: [PARK], radiusKm: 5, slug: "second" }

    expect(nearestArea(PARK, [first, second])?.slug).toBe("first")
  })

  it("measures an area by its nearest query point, not its first", () => {
    // First point is out of range on its own; the second is a direct hit. The
    // area must match, because its listing pages union every point's results.
    const twoEnds = { coordinates: [LAHORE, PARK], radiusKm: 2, slug: "ends" }

    expect(nearestArea(PARK, [twoEnds])).toBe(twoEnds)
  })

  it("never matches an area with no query points", () => {
    const empty = { coordinates: [], radiusKm: 5, slug: "empty" }

    expect(nearestArea(PARK, [empty])).toBeNull()
  })
})
