import {
  LOCATION_API,
  LOCATION_COUNTRY_CODE,
  LOCATION_SEARCH_LIMIT
} from "./constants"
import { createLocationHttp, type LocationSearchParams } from "./http"
import type {
  GeocodedAddress,
  GeoCoordinates,
  PhotonFeature,
  PhotonResponse,
  ReverseGeocodeInput,
  SearchAddressesInput
} from "./types"

function locationHttp() {
  return createLocationHttp()
}

/**
 * Rejects non-finite latitude / longitude values.
 * @param input - Coordinates to check
 * @throws {Error} When lat or lng is not a finite number
 */
export function assertGeoCoordinates(input: GeoCoordinates) {
  if (!(Number.isFinite(input.lat) && Number.isFinite(input.lng))) {
    throw new Error("Invalid coordinates")
  }
}

/**
 * Builds query-string fields for `GET /reverse`.
 * @param input - Coordinates and optional language
 * @returns Photon reverse search params
 * @example
 * buildPhotonReverseSearchParams({ lat: 31.52, lng: 74.35 }).lon // -> "74.35"
 */
export function buildPhotonReverseSearchParams(
  input: ReverseGeocodeInput
): LocationSearchParams {
  return {
    lat: String(input.lat),
    lon: String(input.lng),
    lang: input.language ?? "en"
  }
}

/**
 * Builds query-string fields for `GET /api`.
 *
 * `countrycode` is always sent: it is both cheaper and more accurate than
 * filtering hits after the fact.
 *
 * No `lat`/`lon` bias is sent. Photon supports one, but the only search box in
 * the product lives inside the shared `SelectLocationModal`, which this story
 * may not edit to pass a bias through — so the parameter would be dead surface.
 * Add it together with the shared prop that would carry it.
 * @param input - Query text, language and result cap
 * @returns Photon search params
 * @example
 * buildPhotonSearchSearchParams({ query: "Model Town" }).countrycode // -> "pk"
 */
export function buildPhotonSearchSearchParams(
  input: SearchAddressesInput
): LocationSearchParams {
  return {
    q: input.query.trim(),
    lang: input.language ?? "en",
    limit: String(input.limit ?? LOCATION_SEARCH_LIMIT),
    countrycode: LOCATION_COUNTRY_CODE
  }
}

/**
 * Joins the address parts that are present, in reading order, without repeats.
 *
 * Photon has no `display_name` — unlike Nominatim it returns structured parts
 * and leaves the label to the caller. Duplicates are dropped because a shop
 * often carries its own street as `name`, which would otherwise render
 * "Dua Cafe, Dua Cafe, Street 3".
 * @param parts - Address fragments, most specific first; empties are ignored
 * @returns A single comma-joined label, or `""` when nothing was usable
 * @example composeLabel(["221", "Street 3", "Street 3"]) // -> "221, Street 3"
 */
export function composeLabel(parts: readonly (string | undefined)[]): string {
  const seen = new Set<string>()
  const kept: string[] = []

  for (const part of parts) {
    const trimmed = part?.trim()
    if (!trimmed || seen.has(trimmed.toLowerCase())) {
      continue
    }
    seen.add(trimmed.toLowerCase())
    kept.push(trimmed)
  }

  return kept.join(", ")
}

/**
 * Maps one Photon feature onto a geocoded address.
 *
 * `coordinatesOverride` exists for the reverse path: the caller already knows
 * the exact point it asked about, and Photon answers with the coordinates of
 * the nearest mapped feature, which can sit a street away. The pin the visitor
 * placed always wins.
 * @param feature - One Photon GeoJSON feature
 * @param coordinatesOverride - Coordinates to keep instead of the feature's own
 * @returns The mapped address, or `null` when the feature has no usable point
 */
export function parsePhotonFeature(
  feature: PhotonFeature,
  coordinatesOverride?: GeoCoordinates
): GeocodedAddress | null {
  const properties = feature.properties ?? {}
  // GeoJSON order: [longitude, latitude]. See PhotonFeature's docblock.
  const [longitude, latitude] = feature.geometry?.coordinates ?? []

  const coordinates =
    coordinatesOverride ??
    (Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { lat: latitude as number, lng: longitude as number }
      : null)

  if (coordinates === null) {
    return null
  }

  const houseNumberAndStreet = composeLabel([
    properties.housenumber,
    properties.street
  ])

  return {
    label: composeLabel([
      properties.name,
      houseNumberAndStreet || undefined,
      properties.district,
      properties.city,
      properties.state
    ]),
    coordinates,
    city: properties.city ?? properties.county,
    state: properties.state,
    country: properties.country,
    postcode: properties.postcode,
    street: properties.street,
    houseNumber: properties.housenumber
  }
}

/**
 * Maps a Photon response onto geocoded addresses, dropping unusable rows.
 * @param payload - Photon GeoJSON response
 * @returns Parsed hits with finite coordinates
 * @example parsePhotonFeatures({ features: [] }) // -> []
 */
export function parsePhotonFeatures(
  payload: PhotonResponse
): GeocodedAddress[] {
  const results: GeocodedAddress[] = []

  for (const feature of payload.features ?? []) {
    const parsed = parsePhotonFeature(feature)
    if (parsed !== null) {
      results.push(parsed)
    }
  }

  return results
}

/**
 * Resolves an address label from latitude and longitude via Photon.
 *
 * Answers an empty label rather than throwing when the point has nothing
 * mapped near it — "no name for this pin" is a normal outcome over much of
 * Pakistan, and the form lets the visitor type it.
 * @param input - Coordinates, optional language, optional abort
 * @returns Address for the point; the coordinates are always the ones asked for
 * @throws {Error} When coordinates are invalid or Photon fails
 * @example
 * await reverseGeocode({ lat: 31.5204, lng: 74.3587, language: "en" })
 * // { label: "…Lahore…", coordinates: { lat: 31.5204, lng: 74.3587 } }
 */
export async function reverseGeocode(
  input: ReverseGeocodeInput
): Promise<GeocodedAddress> {
  assertGeoCoordinates(input)

  const coordinates = { lat: input.lat, lng: input.lng }
  const payload = await locationHttp().get<PhotonResponse>(
    LOCATION_API.reverse,
    {
      searchParams: buildPhotonReverseSearchParams(input),
      signal: input.signal
    }
  )

  const [first] = payload.features ?? []

  return first
    ? (parsePhotonFeature(first, coordinates) ?? { label: "", coordinates })
    : { label: "", coordinates }
}

/**
 * Searches Photon for addresses matching a query.
 * @param input - Query text, optional language / limit / abort
 * @returns Matching addresses; empty when the query is blank
 * @throws {Error} When Photon fails
 * @example
 * await searchAddresses({ query: "Magnoliya Park" })
 * // [{ label: "Magnoliya Park, Gujranwala", coordinates: { … } }]
 */
export async function searchAddresses(
  input: SearchAddressesInput
): Promise<GeocodedAddress[]> {
  const query = input.query.trim()
  if (!query) {
    return []
  }

  const payload = await locationHttp().get<PhotonResponse>(
    LOCATION_API.search,
    {
      searchParams: buildPhotonSearchSearchParams({ ...input, query }),
      signal: input.signal
    }
  )

  return parsePhotonFeatures(payload)
}
