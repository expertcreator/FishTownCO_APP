/**
 * Query string accepted by GET helpers (ky `searchParams`).
 */
export type RiderShiftsSearchParams = Record<string, string>

/**
 * Minimal HTTP surface used by rider-shift API helpers.
 * Apps wrap their own client (ky, axios, fetch) to match this shape.
 */
export interface RiderShiftsHttp {
  get: <TResponse>(
    path: string,
    searchParams?: RiderShiftsSearchParams
  ) => Promise<TResponse>
  post: <TResponse, TBody extends object>(
    path: string,
    json: TBody
  ) => Promise<TResponse>
  delete: <TResponse>(path: string, json?: object) => Promise<TResponse>
}

/**
 * Ky-shaped JSON response. `json()` parses the body as `TResponse`.
 */
export interface RiderShiftsJsonResponse {
  json: <TResponse>() => Promise<TResponse>
}

/**
 * App HTTP client that already knows base URL and auth.
 * Compatible with ky instances used in Fishtownco web apps.
 */
export interface RiderShiftsRequestClient {
  get: (
    path: string,
    options?: { searchParams?: RiderShiftsSearchParams }
  ) => RiderShiftsJsonResponse
  post: (path: string, options: { json: object }) => RiderShiftsJsonResponse
  delete: (path: string, options?: { json?: object }) => RiderShiftsJsonResponse
}

/**
 * Adapts an app HTTP client into the rider-shift transport.
 * @param client - Authenticated ky-shaped client
 * @returns Typed get/post/delete used by `api.ts`
 * @example
 * const http = createRiderShiftsHttp(authApi)
 * await getRiderNextShift(http, { lang: "en" })
 */
export function createRiderShiftsHttp(
  client: RiderShiftsRequestClient
): RiderShiftsHttp {
  return {
    get: async <TResponse>(
      path: string,
      searchParams?: RiderShiftsSearchParams
    ) => client.get(path, { searchParams }).json<TResponse>(),
    post: async <TResponse, TBody extends object>(path: string, json: TBody) =>
      client.post(path, { json }).json<TResponse>(),
    delete: async <TResponse>(path: string, json?: object) =>
      client.delete(path, json ? { json } : undefined).json<TResponse>()
  }
}
