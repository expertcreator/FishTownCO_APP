/**
 * Public Photon origin used by all Fishtownco frontends.
 *
 * Photon replaced Nominatim here (`mw-2-6`) for one policy reason and one
 * quality reason. Nominatim's usage policy forbids per-keystroke autocomplete,
 * which is exactly what an address search box does; Photon is built for
 * typeahead. Both read the same OpenStreetMap data, so coverage is unchanged.
 *
 * **This is a best-effort public instance with no SLA** — its terms say
 * "extensive usage will be throttled" and availability is not guaranteed.
 * Callers must treat geocoding as a convenience: the map supplies the
 * coordinates, and a geocoder outage may never block address entry.
 */
export const PHOTON_BASE_URL = "https://photon.komoot.io"

/**
 * Photon paths relative to `PHOTON_BASE_URL`.
 * @example
 * LOCATION_API.reverse
 * // "reverse"
 */
export const LOCATION_API = {
  reverse: "reverse",
  search: "api"
} as const

/**
 * ISO 3166-1 alpha-2 country the search is restricted to.
 *
 * Restricting is both cheaper and more accurate: without it "Model Town"
 * matches in several countries and the intended Lahore result can fall off a
 * five-row list.
 */
export const LOCATION_COUNTRY_CODE = "pk"

/** Default number of search hits requested. */
export const LOCATION_SEARCH_LIMIT = 5
