/**
 * Query string accepted by GET helpers (ky `searchParams`).
 */
export type CategoriesSearchParams = Record<string, string>

/**
 * Minimal HTTP surface used by category API helpers.
 * Apps wrap their own client (ky, fetch, etc.) to match this shape.
 */
export interface CategoriesHttp {
  get: <TResponse>(
    path: string,
    searchParams?: CategoriesSearchParams
  ) => Promise<TResponse>
  post: <TResponse, TBody extends object>(
    path: string,
    json: TBody
  ) => Promise<TResponse>
}

/**
 * Ky-shaped JSON response. `json()` parses the body as `TResponse`.
 */
export interface CategoriesJsonResponse {
  json: <TResponse>() => Promise<TResponse>
}

/**
 * App HTTP client that already knows base URL and auth.
 * Compatible with ky instances used in Fishtownco web apps.
 */
export interface CategoriesRequestClient {
  get: (
    path: string,
    options?: { searchParams?: CategoriesSearchParams }
  ) => CategoriesJsonResponse
  post: (path: string, options: { json: object }) => CategoriesJsonResponse
}

/**
 * Adapts an app HTTP client into the category transport.
 * @param client - Authenticated ky-shaped client
 * @returns Typed GET/POST used by `api.ts`
 * @example
 * const http = createCategoriesHttp(restaurantAdminApi)
 * await listTenantCategories(http, { branchId, page: 0, limit: 20 })
 */
export function createCategoriesHttp(
  client: CategoriesRequestClient
): CategoriesHttp {
  return {
    get: async <TResponse>(
      path: string,
      searchParams?: CategoriesSearchParams
    ) => client.get(path, { searchParams }).json<TResponse>(),
    post: async <TResponse, TBody extends object>(path: string, json: TBody) =>
      client.post(path, { json }).json<TResponse>()
  }
}
