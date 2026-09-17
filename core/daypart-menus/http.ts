/**
 * Minimal HTTP surface used by daypart-menu API helpers.
 * Apps wrap their own client (ky, fetch, etc.) to match this shape.
 */
export interface DaypartMenusHttp {
  get: <TResponse>(path: string) => Promise<TResponse>
  put: <TResponse, TBody extends object>(
    path: string,
    json: TBody
  ) => Promise<TResponse>
}

/**
 * Ky-shaped JSON response. `json()` parses the body as `TResponse`.
 */
export interface DaypartMenusJsonResponse {
  json: <TResponse>() => Promise<TResponse>
}

/**
 * App HTTP client that already knows base URL and auth.
 * Compatible with ky instances used in Fishtownco web apps.
 */
export interface DaypartMenusRequestClient {
  get: (path: string) => DaypartMenusJsonResponse
  put: (path: string, options: { json: object }) => DaypartMenusJsonResponse
}

/**
 * Adapts an app HTTP client into the daypart-menu transport.
 * @param client - Authenticated ky-shaped client
 * @returns Typed get/put used by `api.ts`
 * @example
 * const http = createDaypartMenusHttp(restaurantAdminApi)
 * await getDaypartMenusByBranch(http, branchId)
 */
export function createDaypartMenusHttp(
  client: DaypartMenusRequestClient
): DaypartMenusHttp {
  return {
    get: async <TResponse>(path: string) => client.get(path).json<TResponse>(),
    put: async <TResponse, TBody extends object>(path: string, json: TBody) =>
      client.put(path, { json }).json<TResponse>()
  }
}
