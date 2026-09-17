/**
 * Query string accepted by GET helpers (ky `searchParams`).
 * @example
 * "page=0&limit=20"
 */
export type PosOrdersSearchParams = string | Record<string, string>

/**
 * Minimal HTTP surface used by POS order API helpers.
 */
export interface PosOrdersHttp {
  get: <TResponse>(
    path: string,
    searchParams?: PosOrdersSearchParams
  ) => Promise<TResponse>
  post: <TResponse, TBody extends object>(
    path: string,
    json: TBody
  ) => Promise<TResponse>
  put: <TResponse, TBody extends object>(
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
export interface PosOrdersJsonResponse {
  json: <TResponse>() => Promise<TResponse>
}

/**
 * App HTTP client that already knows base URL and auth.
 */
export interface PosOrdersRequestClient {
  get: (
    path: string,
    options?: { searchParams?: PosOrdersSearchParams }
  ) => PosOrdersJsonResponse
  post: (path: string, options: { json: object }) => PosOrdersJsonResponse
  put: (path: string, options: { json: object }) => PosOrdersJsonResponse
  patch: (path: string, options: { json: object }) => PosOrdersJsonResponse
}

/**
 * Adapts an app HTTP client into the POS-order transport.
 * @param client - Authenticated ky-shaped client
 * @returns Typed get/post/put/patch used by `api.ts`
 * @example
 * const http = createPosOrdersHttp(restaurantAdminApi)
 * await createPosOrder(http, body)
 */
export function createPosOrdersHttp(
  client: PosOrdersRequestClient
): PosOrdersHttp {
  return {
    get: async <TResponse>(
      path: string,
      searchParams?: PosOrdersSearchParams
    ) => client.get(path, { searchParams }).json<TResponse>(),
    post: async <TResponse, TBody extends object>(path: string, json: TBody) =>
      client.post(path, { json }).json<TResponse>(),
    put: async <TResponse, TBody extends object>(path: string, json: TBody) =>
      client.put(path, { json }).json<TResponse>(),
    patch: async <TResponse, TBody extends object>(path: string, json: TBody) =>
      client.patch(path, { json }).json<TResponse>()
  }
}
