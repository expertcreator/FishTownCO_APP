/**
 * Latitude / longitude pair used by Photon helpers.
 */
export type GeoCoordinates = {
  lat: number
  lng: number
}

/**
 * The address fields Photon attaches to a feature.
 *
 * Every one is optional because Photon returns what OpenStreetMap holds for
 * that point and nothing more — a pin dropped between mapped buildings can
 * come back with a `city` and nothing else, or with no properties at all.
 */
export type PhotonProperties = {
  name?: string
  housenumber?: string
  street?: string
  district?: string
  city?: string
  county?: string
  state?: string
  postcode?: string
  country?: string
  countrycode?: string
}

/**
 * One Photon GeoJSON feature.
 *
 * **`geometry.coordinates` is `[longitude, latitude]`** — GeoJSON order, the
 * reverse of the `lat`/`lon` pair Photon takes as input and the reverse of
 * every other coordinate in this codebase. Transposing it parses cleanly and
 * silently points at the wrong hemisphere, so it is destructured in exactly
 * one place (`parsePhotonFeatures`) and nowhere else.
 */
export type PhotonFeature = {
  geometry?: { coordinates?: readonly number[] }
  properties?: PhotonProperties
}

/**
 * Photon's response envelope, for both `/api` and `/reverse`.
 */
export type PhotonResponse = {
  features?: readonly PhotonFeature[]
}

/**
 * Reverse-geocode request.
 */
export type ReverseGeocodeInput = {
  lat: number
  lng: number
  language?: string
  signal?: AbortSignal
}

/**
 * Forward-geocode (address search) request.
 */
export type SearchAddressesInput = {
  query: string
  language?: string
  limit?: number
  signal?: AbortSignal
}

/**
 * Display label plus the coordinates it belongs to.
 *
 * The structured fields are carried alongside the label because the address
 * form needs to know *which* part the geocoder failed to supply — an absent
 * `city` is what reveals the "we're missing your suburb" field rather than a
 * silently incomplete address.
 */
export type GeocodedAddress = {
  label: string
  coordinates: GeoCoordinates
  city?: string
  state?: string
  country?: string
  postcode?: string
  street?: string
  houseNumber?: string
}
