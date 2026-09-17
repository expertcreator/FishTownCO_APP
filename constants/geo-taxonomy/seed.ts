/** One map pin as authored in the seed, before parsing. */
interface CoordinatesSeed {
  readonly latitude: number
  readonly longitude: number
}

/**
 * Display text as authored in the seed. A bare string is English-only; use the
 * object form to author Roman Urdu, which the `/ur` routes render.
 */
type LocalizedTextSeed = string | { readonly en: string; readonly ur?: string }

/** An area as authored in the seed. `restaurantCount` is deliberately absent. */
interface AreaSeed {
  readonly name: LocalizedTextSeed
  readonly description?: LocalizedTextSeed
  readonly isLive: boolean
  readonly coordinates: CoordinatesSeed
  readonly radiusKm: number
}

/** A city as authored in the seed. `areaCount` is derived, never authored. */
interface CitySeed {
  readonly name: LocalizedTextSeed
  readonly description?: LocalizedTextSeed
  readonly isLive: boolean
  readonly areas: Readonly<Record<string, AreaSeed>>
}

/**
 * The hand-authored taxonomy: city slug -> city, area slug -> area. Slugs are
 * the object keys, so a duplicate is impossible by construction.
 */
export type GeoTaxonomySeed = Readonly<Record<string, CitySeed>>

/**
 * Every city and area the website may publish.
 *
 * This is **content, not tenant data** — editorial, diffable, reviewed in a merge
 * request. Coverage is on areas: a city with no live area is not served. An
 * area page queries the existing lat/lng discovery listing at that area's
 * `coordinates` pin, so it answers "restaurants that actually deliver here"
 * rather than "restaurants tagged with this zone".
 *
 * Coordinates are a **single pin**, the area's query point. Cities have no pin.
 * The discovery listing searches `radiusKm` around the area pin.
 *
 * Editing rules:
 * - The pin must lie inside the area's real boundary. Keep the boundary in a
 *   comment beside the entry so the next editor can re-derive it. Only the
 *   coarse served-region box is machine-checked; containment is not.
 * - Publish by flipping `isLive` — only after that area has real restaurants
 *   with real photos (`mw-5-8`). An area cannot be live under a non-live city.
 * - Author `description` per area. Distinct prose is the defence against thin
 *   and near-duplicate pages across areas that share restaurants.
 * - Never hand-type a count. `restaurantCount` comes from the query.
 * - Set `radiusKm` per area. Omitting it is a build failure, because the backend
 *   would otherwise substitute a default the caller does not choose — on Fishtownco
 *   the configured `onboardingRadiusKm` — which makes every area page in a city
 *   return the same restaurants.
 */
export const GEO_TAXONOMY_SEED = {
  gujranwala: {
    name: "Gujranwala",
    isLive: true,
    areas: {
      "magnoliya-park": {
        name: "Magnoliya Park",
        isLive: true,
        // Derived 2026-08-18 from the surveyed boundary below — the interior
        // centroid, verified inside the polygon by even-odd point-in-polygon,
        // the same test the discovery backend applies to a tenant's delivery
        // boundary. The area spans ~1.7km E-W by ~2.1km N-S.
        //
        // Boundary (GeoJSON ring, lng/lat):
        //   [74.20681, 32.112095], [74.200029, 32.106715], [74.20166, 32.09341],
        //   [74.215393, 32.093482], [74.218483, 32.100608], [74.21402, 32.110787]
        coordinates: { latitude: 32.102_014, longitude: 74.208_89 },
        // Not the size of the area — how far a BRANCH may sit from the pin.
        // A restaurant 2km outside the boundary can still deliver into it, so
        // sizing this to the ~1.7x2.1km area would drop genuine results. 5km
        // matches the `tenants.deliveryRadiusKm` default, so it is slack for
        // own-rider tenants (their own boundary still binds) and bounds the
        // platform-rider and pickup tenants that the backend's delivery-area
        // filter skips entirely.
        radiusKm: 2
      },
      "dc-colony": {
        name: "DC Colony",
        isLive: true,
        // TODO(mw-0-12): placeholder — replace with a pin derived from the
        // surveyed DC Colony boundary before this area is ever set live.
        coordinates: { latitude: 32.231_525, longitude: 74.153_09 },
        // TODO(mw-0-12): revisit with the real boundary. At 5km this overlaps
        // magnoliya-park heavily — the two are only ~4.3km apart.
        radiusKm: 2
      },
      khiyali: {
        name: "Khiyali",
        isLive: true,
        coordinates: { latitude: 32.120_681_2, longitude: 74.172_663 },
        radiusKm: 2
      },
      "master-city": {
        name: "Master City",
        isLive: true,
        // Pin provided 2026-09-08 for Master City, Gujranwala.
        coordinates: { latitude: 32.125_929, longitude: 74.231_384 },
        radiusKm: 2
      }
    }
  },
  daska: {
    name: "Daska",
    isLive: true,
    areas: {
      "daska-city": {
        name: "Daska City",
        isLive: true,
        coordinates: { latitude: 32.3363, longitude: 74.367_982 },
        radiusKm: 5
      }
    }
  }
} as const satisfies GeoTaxonomySeed

function uniqueNonEmptySlugs(slugs: readonly string[]): [string, ...string[]] {
  const unique = [...new Set(slugs)]
  const first = unique[0]
  if (first === undefined) {
    throw new Error("geo-taxonomy: seed must contain at least one slug")
  }
  return [first, ...unique.slice(1)]
}

/** City slugs authored in {@link GEO_TAXONOMY_SEED}, for DB enums and validation. */
export const GEO_CITY_SLUGS = uniqueNonEmptySlugs(
  Object.keys(GEO_TAXONOMY_SEED)
)

/** Area slugs authored in {@link GEO_TAXONOMY_SEED}, for DB enums and validation. */
export const GEO_AREA_SLUGS = uniqueNonEmptySlugs(
  Object.values(GEO_TAXONOMY_SEED).flatMap((city) => Object.keys(city.areas))
)

export type GeoCitySlug = (typeof GEO_CITY_SLUGS)[number]
export type GeoAreaSlug = (typeof GEO_AREA_SLUGS)[number]

/**
 * Stored on `users.city` / `users.area` when GPS is outside every live
 * taxonomy pin. Not a seeded place — resolvers never return it.
 */
export const GEO_LOCATION_OTHER = "other" as const
export type GeoLocationOther = typeof GEO_LOCATION_OTHER

/** City enum values on the user row: seeded slugs plus {@link GEO_LOCATION_OTHER}. */
export const USER_CITY_SLUGS = uniqueNonEmptySlugs([
  ...GEO_CITY_SLUGS,
  GEO_LOCATION_OTHER
])

/** Area enum values on the user/address row: seeded slugs plus {@link GEO_LOCATION_OTHER}. */
export const USER_AREA_SLUGS = uniqueNonEmptySlugs([
  ...GEO_AREA_SLUGS,
  GEO_LOCATION_OTHER
])

export type UserCitySlug = (typeof USER_CITY_SLUGS)[number]
export type UserAreaSlug = (typeof USER_AREA_SLUGS)[number]
