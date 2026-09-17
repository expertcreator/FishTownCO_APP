import type { Coordinates } from "./index"

// Type-only imports ONLY in this module, deliberately. It is consumed by a
// `"use client"` leaf (the header's location picker), and a single runtime
// import of `schemas.ts` would pull zod plus the whole `@/constants` package
// into every catalog page's first-load JS (ledger M-012). `item-selection.ts`
// and `item-pricing.ts` follow the same rule for the same reason.

/** Mean Earth radius, km — the constant haversine distances are scaled by. */
const EARTH_RADIUS_KM = 6371

/** Degrees to radians. */
const DEGREE = Math.PI / 180

/**
 * The half of an area this matcher reads: its query points and its radius.
 *
 * Structural on purpose, exactly like `AreaListingSource` and
 * `HomeListingSource`: the server passes the header leaf a serialized subset of
 * `TaxonomyArea` (a client boundary cannot carry the parsed taxonomy), and a
 * `Pick` of a named type would force that subset to exist. Any record with
 * these two fields can be matched, and the match returns that same record.
 */
export interface NearestAreaCandidate {
  /** The area's query points — the same list its listing pages fan out over. */
  readonly coordinates: readonly Coordinates[]
  /** How far from a query point the area still claims to serve, in km. */
  readonly radiusKm: number
}

/**
 * Great-circle distance between two points, in km.
 *
 * Haversine over a spherical Earth. The error against the real ellipsoid is
 * under 0.5%, and the radii being compared against are editorial single-digit
 * kilometres — this is a "which area is closest" tiebreak, never surveying.
 * @param a - One point
 * @param b - The other point
 * @returns The distance in km, `0` for identical points
 * @example distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 }) // -> 0
 */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const deltaLatitude = (b.latitude - a.latitude) * DEGREE
  const deltaLongitude = (b.longitude - a.longitude) * DEGREE
  const half =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(a.latitude * DEGREE) *
      Math.cos(b.latitude * DEGREE) *
      Math.sin(deltaLongitude / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(half))
}

/**
 * Distance from a point to the nearest of an area's query points, in km.
 * @param point - The visitor's position
 * @param candidate - The area's points
 * @returns The smallest per-point distance; `Infinity` for an empty list
 */
function distanceToArea(
  point: Coordinates,
  candidate: NearestAreaCandidate
): number {
  let nearest = Number.POSITIVE_INFINITY

  for (const areaPoint of candidate.coordinates) {
    nearest = Math.min(nearest, distanceKm(point, areaPoint))
  }

  return nearest
}

/**
 * Picks the area a visitor's position falls inside, or `null`.
 *
 * An area qualifies when the distance to its **nearest** query point is within
 * its own `radiusKm` — the identical predicate the discovery listing applies
 * server-side (`distance <= radiusKm`, `home-queries.ts`), which is the whole
 * point: "the area this matched" and "the restaurants that area's page shows"
 * agree by construction, because both are derived from the same points at the
 * same radius. A polygon containment test would be more precise about the
 * area's *name* while disagreeing with its page about its *contents*.
 *
 * Of the qualifying areas the nearest wins; a tie keeps the earlier candidate,
 * so callers passing taxonomy order get taxonomy order as the tiebreak. `null`
 * means "no seeded area serves this point" — the caller's copy problem, never
 * an error.
 * @param point - The visitor's position
 * @param candidates - The areas to match against, in preference order
 * @returns The winning candidate itself, or `null` when none is in range
 * @example nearestArea({ latitude: 0, longitude: 0 }, []) // -> null
 */
export function nearestArea<T extends NearestAreaCandidate>(
  point: Coordinates,
  candidates: readonly T[]
): T | null {
  let best: T | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const candidate of candidates) {
    const distance = distanceToArea(point, candidate)

    if (distance <= candidate.radiusKm && distance < bestDistance) {
      best = candidate
      bestDistance = distance
    }
  }

  return best
}
