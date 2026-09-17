/**
 * Query string accepted by GET helpers (ky `searchParams`).
 */
export type RiderOrdersSearchParams = Record<string, string>

/**
 * Minimal HTTP surface used by rider-order API helpers.
 * Apps wrap their own client (ky, axios, fetch) to match this shape.
 */
export type RiderOrdersHttp = {
  get: <TResponse>(
    path: string,
    searchParams?: RiderOrdersSearchParams
  ) => Promise<TResponse>
  post: <TResponse, TBody extends object>(
    path: string,
    json: TBody
  ) => Promise<TResponse>
  patch: <TResponse, TBody extends object>(
    path: string,
    json: TBody
  ) => Promise<TResponse>
}

/**
 * Ky-shaped JSON response. `json()` parses the body as `TResponse`.
 */
export type RiderOrdersJsonResponse = {
  json: <TResponse>() => Promise<TResponse>
}

/**
 * App HTTP client that already knows base URL and auth.
 * Compatible with ky instances used in Fishtownco web apps.
 */
export type RiderOrdersRequestClient = {
  get: (
    path: string,
    options?: { searchParams?: RiderOrdersSearchParams }
  ) => RiderOrdersJsonResponse
  post: (path: string, options: { json: object }) => RiderOrdersJsonResponse
  patch: (path: string, options: { json: object }) => RiderOrdersJsonResponse
}

/**
 * Adapts an app HTTP client into the rider-order transport.
 * @param client - Authenticated ky-shaped client
 * @returns Typed get/post/patch used by `api.ts`
 * @example
 * const http = createRiderOrdersHttp(discoveryApi)
 * await getRiderOrderDetails(http, orderId)
 */
export function createRiderOrdersHttp(
  client: RiderOrdersRequestClient
): RiderOrdersHttp {
  return {
    get: async <TResponse>(
      path: string,
      searchParams?: RiderOrdersSearchParams
    ) => client.get(path, { searchParams }).json<TResponse>(),
    post: async <TResponse, TBody extends object>(path: string, json: TBody) =>
      client.post(path, { json }).json<TResponse>(),
    patch: async <TResponse, TBody extends object>(path: string, json: TBody) =>
      client.patch(path, { json }).json<TResponse>()
  }
}
