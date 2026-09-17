/**
 * Live-only geo taxonomy paths on `business-discovery-backend` (no leading slash).
 * The gateway prefix (`discovery/api/v1`) is app config, not part of this contract.
 * @example
 * GEO_API.cityAreas("11111111-1111-4111-8111-111111111111")
 * // "geo-cities/11111111-1111-4111-8111-111111111111/areas"
 */
export const GEO_API = {
  cities: "geo-cities",
  areas: "geo-areas",
  areaAtPoint: "geo-areas/at-point",
  /**
   * Builds GET /geo-cities/:id/areas.
   * @param cityId - Live city UUID
   * @returns Encoded city-areas path
   * @example
   * GEO_API.cityAreas("city 1")
   * // "geo-cities/city%201/areas"
   */
  cityAreas: (cityId: string) =>
    `geo-cities/${encodeURIComponent(cityId)}/areas`,
  /**
   * Builds GET /geo-areas/:id/services.
   * @param areaId - Live area UUID
   * @returns Encoded area-services path
   * @example
   * GEO_API.areaServices("area 1")
   * // "geo-areas/area%201/services"
   */
  areaServices: (areaId: string) =>
    `geo-areas/${encodeURIComponent(areaId)}/services`
} as const

/** Default page index for geo list reads (zero-based, matches discovery). */
export const GEO_DEFAULT_PAGE = 0

/**
 * Default page size for city/area dropdowns. Discovery caps `limit` at 100.
 */
export const GEO_LIST_PAGE_SIZE = 100
