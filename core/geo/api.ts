import { GEO_API, GEO_DEFAULT_PAGE, GEO_LIST_PAGE_SIZE } from "./constants"
import type { GeoHttp, GeoSearchParams } from "./http"
import type {
  GeoAreaAtPointParams,
  GeoAreaAtPointResponse,
  GeoAreaListParams,
  GeoAreaListResponse,
  GeoAreaServicesParams,
  GeoAreaServicesResponse,
  GeoCityAreasParams,
  GeoCityListParams,
  GeoCityListResponse,
  GeoListParams,
  GeoPage
} from "./types"

/**
 * Builds shared page/search/sort query fields.
 * @param args - Optional list filters
 * @returns String search params
 */
export function buildGeoListSearchParams(
  args: GeoListParams = {}
): GeoSearchParams {
  const search = args.search?.trim() ?? ""
  const sort = args.sort?.trim() ?? ""
  return {
    page: String(args.page ?? GEO_DEFAULT_PAGE),
    limit: String(args.limit ?? GEO_LIST_PAGE_SIZE),
    ...(search ? { search } : {}),
    ...(sort ? { sort } : {})
  }
}

/**
 * Builds query-string fields for GET /geo-cities.
 * @param args - Page, limit, search, and sort
 * @returns String search params
 */
export function buildGeoCityListSearchParams(
  args: GeoCityListParams = {}
): GeoSearchParams {
  return buildGeoListSearchParams(args)
}

/**
 * Builds query-string fields for GET /geo-areas.
 * @param args - Page, limit, search, sort, and optional city id
 * @returns String search params
 */
export function buildGeoAreaListSearchParams(
  args: GeoAreaListParams = {}
): GeoSearchParams {
  const cityId = args.cityId?.trim() ?? ""
  return {
    ...buildGeoListSearchParams(args),
    ...(cityId ? { cityId } : {})
  }
}

/**
 * Builds query-string fields for GET /geo-cities/:id/areas.
 * Omits `services` unless it is explicitly true (discovery default is false).
 * @param args - Page, limit, search, sort, and optional services embed
 * @returns String search params
 */
export function buildGeoCityAreasSearchParams(
  args: Omit<GeoCityAreasParams, "cityId"> = {}
): GeoSearchParams {
  return {
    ...buildGeoListSearchParams(args),
    ...(args.services ? { services: "true" } : {})
  }
}

/**
 * Builds query-string fields for GET /geo-areas/:id/services.
 * @param args - Page, limit, search, and sort
 * @returns String search params
 */
export function buildGeoAreaServicesSearchParams(
  args: Omit<GeoAreaServicesParams, "areaId"> = {}
): GeoSearchParams {
  return buildGeoListSearchParams(args)
}

/**
 * Builds query-string fields for GET /geo-areas/at-point.
 * @param args - Latitude, longitude, and optional fallback radius
 * @returns String search params
 * @throws {Error} If latitude or longitude is not finite
 */
export function buildGeoAreaAtPointSearchParams(
  args: GeoAreaAtPointParams
): GeoSearchParams {
  if (!(Number.isFinite(args.latitude) && Number.isFinite(args.longitude))) {
    throw new Error("Geo at-point latitude and longitude must be finite")
  }
  return {
    latitude: String(args.latitude),
    longitude: String(args.longitude),
    ...(args.fallbackMaxKm === undefined
      ? {}
      : { fallbackMaxKm: String(args.fallbackMaxKm) })
  }
}

/**
 * Next zero-based page for a geo list, or undefined when every item is loaded.
 * @param loadedCount - Items already received
 * @param total - Total matching items
 * @param limit - Page size used for the request
 * @returns Next page index, or undefined
 * @example
 * nextGeoListPage(100, 240, 100)
 * // 1
 */
export function nextGeoListPage(
  loadedCount: number,
  total: number,
  limit = GEO_LIST_PAGE_SIZE
): number | undefined {
  if (limit <= 0 || loadedCount >= total) {
    return
  }
  return Math.floor(loadedCount / limit)
}

/**
 * Page indexes after page 0 that still need fetching.
 * @param total - Total matching items
 * @param limit - Page size used for the first page
 * @returns Extra zero-based page indexes
 * @example
 * remainingGeoListPages(240, 100)
 * // [1, 2]
 */
export function remainingGeoListPages(
  total: number,
  limit = GEO_LIST_PAGE_SIZE
): number[] {
  if (limit <= 0 || total <= limit) {
    return []
  }
  const lastPage = Math.ceil(total / limit) - 1
  return Array.from({ length: lastPage }, (_, index) => index + 1)
}

/**
 * Loads page 0, then remaining pages in parallel, and concatenates items.
 * @param fetchPage - One-page reader
 * @returns Combined page whose `items` hold every loaded row
 * @example
 * await collectGeoListPages((page) => listGeoCities(http, { page }).then((r) => r.data))
 */
export async function collectGeoListPages<TItem>(
  fetchPage: (page: number) => Promise<GeoPage<TItem>>
): Promise<GeoPage<TItem>> {
  const first = await fetchPage(GEO_DEFAULT_PAGE)
  const extraPages = remainingGeoListPages(first.total, first.limit)
  if (extraPages.length === 0) {
    return first
  }
  const extra = await Promise.all(extraPages.map((page) => fetchPage(page)))
  const items = extra.flatMap((page) => page.items)
  return {
    items: [...first.items, ...items],
    total: first.total,
    page: first.page,
    limit: first.limit
  }
}

/**
 * Lists live marketplace cities.
 * @param http - Injected HTTP client with authorization or a public API key
 * @param args - Page, limit, search, and sort
 * @returns GET /geo-cities 200 body
 */
export function listGeoCities(
  http: GeoHttp,
  args: GeoCityListParams = {}
): Promise<GeoCityListResponse> {
  return http.get<GeoCityListResponse>(
    GEO_API.cities,
    buildGeoCityListSearchParams(args)
  )
}

/**
 * Lists live marketplace areas, optionally for one city.
 * @param http - Injected HTTP client with authorization or a public API key
 * @param args - Page, limit, search, sort, and optional city id
 * @returns GET /geo-areas 200 body
 */
export function listGeoAreas(
  http: GeoHttp,
  args: GeoAreaListParams = {}
): Promise<GeoAreaListResponse> {
  return http.get<GeoAreaListResponse>(
    GEO_API.areas,
    buildGeoAreaListSearchParams(args)
  )
}

/**
 * Lists live areas for one live city.
 * Pass `services: true` to embed each area's live marketplace services.
 * Discovery defaults that flag to false when omitted.
 * @param http - Injected HTTP client with authorization or a public API key
 * @param args - City id plus page, limit, search, sort, and optional services
 * @returns GET /geo-cities/:id/areas 200 body
 * @throws {Error} If `cityId` is empty
 */
export function listGeoAreasByCity(
  http: GeoHttp,
  args: GeoCityAreasParams
): Promise<GeoAreaListResponse> {
  const cityId = args.cityId.trim()
  if (!cityId) {
    throw new Error("Geo city id is required")
  }
  return http.get<GeoAreaListResponse>(
    GEO_API.cityAreas(cityId),
    buildGeoCityAreasSearchParams(args)
  )
}

/**
 * Lists live marketplace services for one live area.
 * Includes `allAreas` services plus services assigned to the area.
 * Same auth as the other geo reads: session token or public API key.
 * @param http - Injected HTTP client with authorization or a public API key
 * @param args - Area id plus page, limit, search, and sort
 * @returns GET /geo-areas/:id/services 200 body
 * @throws {Error} If `areaId` is empty
 */
export function listGeoAreaServices(
  http: GeoHttp,
  args: GeoAreaServicesParams
): Promise<GeoAreaServicesResponse> {
  const areaId = args.areaId.trim()
  if (!areaId) {
    throw new Error("Geo area id is required")
  }
  return http.get<GeoAreaServicesResponse>(
    GEO_API.areaServices(areaId),
    buildGeoAreaServicesSearchParams(args)
  )
}

/**
 * Resolves the live area that covers a latitude/longitude.
 * @param http - Injected HTTP client with authorization or a public API key
 * @param args - Point and optional fallback radius in km
 * @returns GET /geo-areas/at-point 200 body
 * @throws {Error} If latitude or longitude is not finite
 */
export function resolveGeoAreaAtPoint(
  http: GeoHttp,
  args: GeoAreaAtPointParams
): Promise<GeoAreaAtPointResponse> {
  return http.get<GeoAreaAtPointResponse>(
    GEO_API.areaAtPoint,
    buildGeoAreaAtPointSearchParams(args)
  )
}
