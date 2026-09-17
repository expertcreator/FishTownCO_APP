/**
 * Localized copy on a live geo city or area.
 */
export type GeoLocalizedName = Record<string, string>

/**
 * One live marketplace city from GET /geo-cities.
 */
export interface GeoCityItem {
  id: string
  slug: string
  name: GeoLocalizedName
  description: GeoLocalizedName | null
  isLive: boolean
  liveAreaCount?: number
  createdAt: string
  updatedAt: string
}

/**
 * One live marketplace service from GET /geo-areas/:id/services, or
 * embedded on an area when GET /geo-cities/:id/areas is called with
 * `services=true`.
 */
export interface GeoServiceItem {
  id: string
  slug: string
  name: GeoLocalizedName
  description: GeoLocalizedName | null
  isLive: boolean
  allAreas: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/**
 * One live marketplace area from GET /geo-areas or GET /geo-cities/:id/areas.
 * `services` is present only when the city-areas read requested `services=true`.
 */
export interface GeoAreaItem {
  id: string
  cityId: string
  citySlug?: string
  cityName?: GeoLocalizedName
  slug: string
  name: GeoLocalizedName
  description: GeoLocalizedName | null
  isLive: boolean
  latitude: number
  longitude: number
  radiusKm: number
  createdAt: string
  updatedAt: string
  services?: GeoServiceItem[]
}

/**
 * Live area that covers a latitude/longitude from GET /geo-areas/at-point.
 */
export interface GeoAreaAtPointItem extends GeoAreaItem {
  distanceKm: number
}

/**
 * Page of geo list items.
 */
export interface GeoPage<TItem> {
  items: TItem[]
  total: number
  page: number
  limit: number
}

/**
 * Discovery envelope for a paginated geo list.
 */
export interface GeoListResponse<TItem> {
  success: boolean
  data: GeoPage<TItem>
}

/**
 * Discovery envelope for GET /geo-areas/at-point.
 */
export interface GeoAreaAtPointResponse {
  success: boolean
  data: GeoAreaAtPointItem | null
}

export type GeoCityListResponse = GeoListResponse<GeoCityItem>
export type GeoAreaListResponse = GeoListResponse<GeoAreaItem>
export type GeoAreaServicesResponse = GeoListResponse<GeoServiceItem>

/**
 * Shared list filters for geo city and area reads.
 */
export interface GeoListParams {
  page?: number
  limit?: number
  search?: string
  sort?: string
}

/**
 * GET /geo-cities query.
 */
export type GeoCityListParams = GeoListParams

/**
 * GET /geo-areas query. `cityId` limits the page to one live city.
 */
export interface GeoAreaListParams extends GeoListParams {
  cityId?: string
}

/**
 * GET /geo-cities/:id/areas query.
 * `services` defaults to false on the server; pass `true` to embed each
 * area's live marketplace services.
 */
export interface GeoCityAreasParams extends GeoListParams {
  cityId: string
  services?: boolean
}

/**
 * GET /geo-areas/:id/services query.
 */
export interface GeoAreaServicesParams extends GeoListParams {
  areaId: string
}

/**
 * GET /geo-areas/at-point query.
 */
export interface GeoAreaAtPointParams {
  latitude: number
  longitude: number
  fallbackMaxKm?: number
}
