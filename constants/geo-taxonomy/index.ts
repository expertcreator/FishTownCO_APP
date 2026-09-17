import z from "zod"
import { isReservedSlug, NUMBER_LIMITS } from ".."
import { distanceKm, nearestArea } from "./nearest-area"
import {
  type Area,
  areaSchema,
  type City,
  citySchema,
  type Coordinates,
  SLUG_REGEX
} from "./schemas"
import { GEO_TAXONOMY_SEED, type GeoTaxonomySeed } from "./seed"

export {
  GEO_AREA_SLUGS,
  GEO_CITY_SLUGS,
  GEO_LOCATION_OTHER,
  GEO_TAXONOMY_SEED,
  USER_AREA_SLUGS,
  USER_CITY_SLUGS,
  type GeoAreaSlug,
  type GeoCitySlug,
  type GeoLocationOther,
  type GeoTaxonomySeed,
  type UserAreaSlug,
  type UserCitySlug
} from "./seed"

type CitySeed = GeoTaxonomySeed[string]
type AreaSeed = CitySeed["areas"][string]

/**
 * Coarse bounding box for the region this site serves, used only to catch an
 * authoring slip. `coordinatesSchema` bounds latitude to ±90 and longitude to
 * ±180 — the whole planet — so a transposed lat/lng pair parses cleanly and
 * silently queries the wrong hemisphere, returning an empty area page. This is a
 * sanity guard, NOT a containment check: a point can sit inside this box and
 * still be outside its own area.
 */
const SERVED_REGION = {
  maxLatitude: 37.1,
  maxLongitude: 77.9,
  minLatitude: 23.5,
  minLongitude: 60.8
}

/**
 * How far a branch may sit from one of an area's query points and still be
 * listed on that area's page.
 *
 * The cap is `NUMBER_LIMITS.RADIUS_MAX` itself rather than a copy of its value:
 * the discovery backend rejects anything above it (`homeValidation.ts`,
 * `homeListingQuerySchema`), and a local literal would let the seed admit a
 * radius the request then 400s on.
 *
 * Rejects `0` even though the backend accepts it: the filter is
 * `distance <= radiusKm` (`home-queries.ts`, `buildLocationConditions`), so `0`
 * parses cleanly and then matches nothing, rendering an empty area page rather
 * than an error.
 */
const areaRadiusKmSchema = z.number().positive().max(NUMBER_LIMITS.RADIUS_MAX)

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * A parsed area plus the radius its query points are searched at.
 *
 * `radiusKm` is editorial data about a place, so it is added here rather than to
 * `areaSchema` — that schema is the shape a backend response would carry, and no
 * backend knows or returns this number.
 */
export type TaxonomyArea = Area & { readonly radiusKm: number }

/** The parsed taxonomy: cities in slug order, plus their areas by slug. */
export interface GeoTaxonomy {
  readonly cities: readonly City[]
  readonly areasByCity: ReadonlyMap<string, ReadonlyMap<string, TaxonomyArea>>
}

/**
 * Orders by slug explicitly rather than trusting object key order: `SLUG_REGEX`
 * permits an all-digit slug, and JavaScript hoists integer-like keys to the
 * front of an object, which would silently reorder the sitemap. Compared with
 * `<` rather than `localeCompare` so the order cannot shift with the runtime
 * locale between a local build and CI.
 *
 * Has no equality case because it cannot have one: slugs are object keys within
 * a single parent, so two entries being compared can never share a slug.
 */
function bySlug(a: { readonly slug: string }, b: { readonly slug: string }) {
  return a.slug < b.slug ? -1 : 1
}

/**
 * Rejects a slug the router would shadow or the URL rules forbid.
 * Reserved is checked **before** format, because `_next` is reserved even
 * though it is not a legal slug.
 * @param slug - Raw seed key
 * @param label - Already-quoted description of what the key names
 * @throws When the key is reserved or is not a legal slug
 */
function assertPublishableSlug(slug: string, label: string): void {
  if (isReservedSlug(slug)) {
    throw new Error(
      `geo-taxonomy: ${label} is a reserved slug — a static route or locale already owns that URL`
    )
  }

  if (!SLUG_REGEX.test(slug)) {
    throw new Error(`geo-taxonomy: ${label} must match ${SLUG_REGEX.source}`)
  }
}

/**
 * Rejects a pin that falls outside the served region.
 * @param points - Parsed coordinates
 * @param label - Already-quoted description of the owning entry
 * @throws When any point is outside `SERVED_REGION`
 */
function assertPointsInRegion(
  points: readonly Coordinates[],
  label: string
): void {
  for (const { latitude, longitude } of points) {
    const outside =
      latitude < SERVED_REGION.minLatitude ||
      latitude > SERVED_REGION.maxLatitude ||
      longitude < SERVED_REGION.minLongitude ||
      longitude > SERVED_REGION.maxLongitude

    if (outside) {
      throw new Error(
        `geo-taxonomy: ${label} has a point outside the served region: ${latitude}, ${longitude} — check for a transposed latitude/longitude`
      )
    }
  }
}

/**
 * Parses one seeded area.
 * @param citySlug - Parent city key
 * @param areaSlug - Area key
 * @param seed - Authored area
 * @returns The validated area with its authored `radiusKm` attached, `restaurantCount` defaulted to 0
 * @throws When the key, the entry, a coordinate, or `radiusKm` is invalid or missing; the message names both keys
 */
function buildArea(
  citySlug: string,
  areaSlug: string,
  seed: AreaSeed
): TaxonomyArea {
  const label = `area "${citySlug}/${areaSlug}"`
  assertPublishableSlug(areaSlug, label)

  let area: Area
  try {
    area = areaSchema.parse({
      id: `${citySlug}/${areaSlug}`,
      slug: areaSlug,
      citySlug,
      name: seed.name,
      description: seed.description ?? null,
      coordinates: [seed.coordinates],
      isLive: seed.isLive
    })
  } catch (cause) {
    throw new Error(`geo-taxonomy: ${label} is invalid`, { cause })
  }

  // Carries the zod error as `cause` like the areaSchema failure above, rather
  // than restating the constraint in prose that drifts when the schema changes.
  const radius = areaRadiusKmSchema.safeParse(seed.radiusKm)
  if (!radius.success) {
    throw new Error(
      `geo-taxonomy: ${label} has an invalid radiusKm: ${String(seed.radiusKm)}`,
      { cause: radius.error }
    )
  }

  assertPointsInRegion(area.coordinates, label)
  return { ...area, radiusKm: radius.data }
}

/**
 * Parses one seeded city and its areas.
 * @param citySlug - City key
 * @param seed - Authored city
 * @returns The validated city and its areas in slug order
 * @throws When the key, the entry, or the live/draft combination is invalid
 */
function buildCity(citySlug: string, seed: CitySeed) {
  const label = `city "${citySlug}"`
  assertPublishableSlug(citySlug, label)

  const areas = Object.entries(seed.areas)
    .map(([areaSlug, area]) => buildArea(citySlug, areaSlug, area))
    .sort(bySlug)

  const liveAreas = areas.filter((area) => area.isLive)

  // A live area under a draft city would let `generateStaticParams` publish
  // `/{city}/{area}` while `/{city}` itself is unpublished.
  if (!seed.isLive && liveAreas.length > 0) {
    throw new Error(
      `geo-taxonomy: ${label} is not live but has live areas: ${liveAreas.map((area) => area.slug).join(", ")}`
    )
  }

  let city: City
  try {
    city = citySchema.parse({
      id: citySlug,
      slug: citySlug,
      name: seed.name,
      description: seed.description ?? null,
      coordinates: null,
      isLive: seed.isLive,
      // Derived, so a city can never advertise more published areas than it has.
      areaCount: liveAreas.length
    })
  } catch (cause) {
    throw new Error(`geo-taxonomy: ${label} is invalid`, { cause })
  }

  return { areas, city }
}

/**
 * Freezes one parsed entry and everything reachable from it.
 *
 * The resolvers hand out references to module state, and a Next server holds
 * that state across every request it serves. Without this, one caller doing
 * `resolveCity(...).isLive = false` would unpublish a city for every later
 * request in that process — a fault that would not reproduce locally.
 * `Object.freeze` is shallow, so each nested object is frozen explicitly.
 * @param entry - A parsed city or area
 * @returns The same object, frozen
 */
function freezeEntry<T extends City | Area>(entry: T): T {
  const { coordinates } = entry

  if (Array.isArray(coordinates)) {
    for (const point of coordinates) {
      Object.freeze(point)
    }
    Object.freeze(coordinates)
  } else if (coordinates !== null) {
    Object.freeze(coordinates)
  }

  Object.freeze(entry.name)

  if (entry.description !== null) {
    Object.freeze(entry.description)
  }

  return Object.freeze(entry)
}

/**
 * Validates a whole seed, throwing on the first bad entry.
 *
 * Called at module load over the shipped seed, so a malformed entry fails
 * whatever imports it — the test suite today, and `next build` once a route
 * consumes the catalog barrel — rather than a live page Google may already have
 * indexed. Exported so a candidate seed can be checked directly.
 * @param seed - Authored taxonomy
 * @returns Cities in slug order and their areas, keyed for O(1) lookup
 * @throws When any key or entry is invalid; the message names the offending keys
 * @example parseGeoTaxonomy({ lahore: { name: "Lahore", isLive: false, areas: {} } })
 */
export function parseGeoTaxonomy(seed: GeoTaxonomySeed): GeoTaxonomy {
  const built = Object.entries(seed)
    .map(([citySlug, city]) => buildCity(citySlug, city))
    .sort((a, b) => bySlug(a.city, b.city))

  // Maps are held as `ReadonlyMap` for the type-level guarantee only —
  // `Object.freeze` does not stop `Map.set`, so freezing them would imply a
  // protection that does not exist. The entries themselves are frozen, and they
  // are what the resolvers hand out.
  const areasByCity = new Map<string, ReadonlyMap<string, TaxonomyArea>>()
  for (const { areas, city } of built) {
    areasByCity.set(
      city.slug,
      new Map<string, TaxonomyArea>(
        areas.map((area) => [area.slug, freezeEntry(area)])
      )
    )
  }

  return Object.freeze({
    areasByCity,
    cities: Object.freeze(built.map(({ city }) => freezeEntry(city)))
  })
}

const TAXONOMY = parseGeoTaxonomy(GEO_TAXONOMY_SEED)

// Keyed by plain `string`, not the branded `Slug`: the callers are route
// segments, which are unvalidated strings by definition.
const CITIES_BY_SLUG = new Map<string, City>(
  TAXONOMY.cities.map((city) => [city.slug, city])
)

/**
 * Every seeded city, drafts included, in slug order.
 *
 * For enumeration — tests, fixtures, editorial tooling. Anything that publishes
 * a URL wants {@link listLiveCities}: a sitemap or `generateStaticParams` built
 * from this would expose unpublished cities. Deliberately a function rather than
 * an exported constant, so the draft-inclusive path is never the one a caller
 * reaches for by accident.
 * @returns All cities in slug order, a fresh array each call
 */
export function listAllCities(): City[] {
  return [...TAXONOMY.cities]
}

// ============================================================================
// RESOLVERS
// ============================================================================

/**
 * Looks up a city by its exact slug.
 *
 * Match is exact — `"Gujranwala"` does not resolve. Normalising case would let
 * two URLs render one page, which is duplicate content; the caller (`mw-0-5`)
 * decides whether that is a 404 or a redirect.
 *
 * Returns non-live cities too, so a caller can tell "not published yet" from
 * "does not exist".
 * @param citySlug - Raw route segment
 * @returns The city, or `undefined` when nothing is seeded under that slug
 * @example resolveCity("gujranwala")?.name.en // -> "Gujranwala"
 */
export function resolveCity(citySlug: string): City | undefined {
  return CITIES_BY_SLUG.get(citySlug)
}

/**
 * Looks up an area within a city. Exact match, and non-live areas resolve — see
 * {@link resolveCity} for why.
 * @param citySlug - Raw city route segment
 * @param areaSlug - Raw area route segment
 * @returns The area, or `undefined` when the city or the area is unknown
 * @example resolveArea("gujranwala", "magnoliya-park")?.coordinates.length // -> 1
 */
export function resolveArea(
  citySlug: string,
  areaSlug: string
): TaxonomyArea | undefined {
  return TAXONOMY.areasByCity.get(citySlug)?.get(areaSlug)
}

/**
 * The cities that may be published — sitemap entries and `generateStaticParams`.
 * @returns Live cities in slug order, a fresh array each call
 */
export function listLiveCities(): City[] {
  return TAXONOMY.cities.filter((city) => city.isLive)
}

/**
 * Every area of one city, drafts included. Mirrors {@link listAllCities}.
 *
 * For enumeration — tests, fixtures, editorial tooling. Anything that publishes
 * a URL wants {@link listLiveAreas} instead.
 * @param citySlug - Raw city route segment
 * @returns All areas in slug order, a fresh array each call; `[]` for an unknown city
 */
export function listAllAreas(citySlug: string): TaxonomyArea[] {
  const areas = TAXONOMY.areasByCity.get(citySlug)

  return areas === undefined ? [] : [...areas.values()]
}

/**
 * The areas of one city that may be published. A city that is itself not live
 * cannot have live areas, so this is empty for a draft city by construction.
 * @param citySlug - Raw city route segment
 * @returns Live areas in slug order, a fresh array each call; `[]` for an unknown city
 * @example listLiveAreas("gujranwala").map((area) => area.slug) // -> ["magnoliya-park"]
 */
export function listLiveAreas(citySlug: string): TaxonomyArea[] {
  return listAllAreas(citySlug).filter((area) => area.isLive)
}

function liveAreaCandidates(): TaxonomyArea[] {
  const candidates: TaxonomyArea[] = []
  for (const city of listLiveCities()) {
    for (const area of listLiveAreas(city.slug)) {
      candidates.push(area)
    }
  }
  return candidates
}

function distanceToAreaPins(point: Coordinates, area: TaxonomyArea): number {
  let nearest = Number.POSITIVE_INFINITY
  for (const pin of area.coordinates) {
    nearest = Math.min(nearest, distanceKm(point, pin))
  }
  return nearest
}

/**
 * Picks the live catalog area whose `radiusKm` circle covers a GPS point.
 *
 * Draft cities and draft areas are ignored. When two live areas overlap, the
 * nearer pin wins — the same predicate as {@link nearestArea} and the discovery
 * listing (`distance <= radiusKm`). Pass `fallbackMaxKm` to also accept the
 * nearest live area out to that distance when the point sits just outside
 * every authored radius. Returns `undefined` when nothing is in range, or
 * when the coordinates are not finite. Never reverse geocodes.
 * @param point - Visitor GPS (`latitude` / `longitude`)
 * @param options - Optional matching slack
 * @param options.fallbackMaxKm - Match the nearest live pin out to this many
 *   km when the point is outside every `radiusKm`
 * @returns The matching live area, or `undefined`
 * @example
 * resolveLiveAreaAtPoint({ latitude: 32.102014, longitude: 74.20889 })?.id
 * // -> "gujranwala/magnoliya-park"
 */
export function resolveLiveAreaAtPoint(
  point: Coordinates,
  options?: { readonly fallbackMaxKm?: number }
): TaxonomyArea | undefined {
  if (!(Number.isFinite(point.latitude) && Number.isFinite(point.longitude))) {
    return
  }

  const candidates = liveAreaCandidates()
  const fallbackMaxKm = options?.fallbackMaxKm
  if (fallbackMaxKm === undefined) {
    return nearestArea(point, candidates) ?? undefined
  }

  if (!(fallbackMaxKm > 0)) {
    return nearestArea(point, candidates) ?? undefined
  }

  let best: TaxonomyArea | undefined
  let bestDistance = Number.POSITIVE_INFINITY
  for (const area of candidates) {
    const distance = distanceToAreaPins(point, area)
    const reach = Math.max(area.radiusKm, fallbackMaxKm)
    if (distance <= reach && distance < bestDistance) {
      best = area
      bestDistance = distance
    }
  }
  return best
}

export * from "./schemas"
export * from "./nearest-area"
export * from "./item-pricing"
