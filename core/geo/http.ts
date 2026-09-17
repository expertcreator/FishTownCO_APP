import { geoAuthHeaders, type GeoAuth } from "./auth"

/**
 * Query string accepted by GET helpers (ky `searchParams`).
 */
export type GeoSearchParams = Record<string, string>

/**
 * Minimal HTTP surface used by geo API helpers.
 * Apps wrap their own client (ky, fetch, etc.) to match this shape.
 */
export interface GeoHttp {
  get: <TResponse>(
    path: string,
    searchParams?: GeoSearchParams
  ) => Promise<TResponse>
}

/**
 * Ky-shaped JSON response. `json()` parses the body as `TResponse`.
 */
export interface GeoJsonResponse {
  json: <TResponse>() => Promise<TResponse>
}

/**
 * App HTTP client that already knows the discovery base URL.
 * Auth is applied by {@link createGeoHttp}, not by this client.
 */
export interface GeoRequestClient {
  get: (
    path: string,
    options?: {
      searchParams?: GeoSearchParams
      headers?: Record<string, string>
    }
  ) => GeoJsonResponse
}

/**
 * Options for {@link createGeoHttp}. Pass authorization or a public API key.
 */
export interface CreateGeoHttpOptions {
  auth: GeoAuth
}

/**
 * Failed geo HTTP read. Apps map `status` onto their own error UI.
 */
export class GeoRequestError extends Error {
  readonly status: number

  /**
   * @param status - Upstream HTTP status
   * @param message - Error message
   */
  constructor(status: number, message: string) {
    super(message)
    this.name = "GeoRequestError"
    this.status = status
  }
}

/**
 * Adapts an app HTTP client into the geo transport and attaches one auth mode.
 * @param client - Ky-shaped client pointed at the discovery service root
 * @param options - Authorization token or public API key
 * @returns Typed GET used by `api.ts`
 * @throws {Error} If the token or public API key is empty
 * @example
 * const publicHttp = createGeoHttp(client, { auth: publicGeoAuth(apiKey) })
 * const sessionHttp = createGeoHttp(client, {
 *   auth: authorizationGeoAuth(sessionToken)
 * })
 */
export function createGeoHttp(
  client: GeoRequestClient,
  options: CreateGeoHttpOptions
): GeoHttp {
  const headers = geoAuthHeaders(options.auth)
  return {
    get: async <TResponse>(path: string, searchParams?: GeoSearchParams) =>
      client.get(path, { searchParams, headers }).json<TResponse>()
  }
}
