/**
 * Minimal HTTP surface used by cash-drawer API helpers.
 * Apps wrap their own client (ky, fetch, etc.) to match this shape.
 */
export interface CashDrawersHttp {
  get: <TResponse>(
    path: string,
    searchParams?: Record<string, string>
  ) => Promise<TResponse>
  post: <TResponse, TBody extends object>(
    path: string,
    json: TBody
  ) => Promise<TResponse>
  delete: (path: string) => Promise<void>
}

/**
 * Ky-shaped JSON response. `json()` parses the body as `TResponse`.
 */
export interface CashDrawersJsonResponse {
  json: <TResponse>() => Promise<TResponse>
}

/**
 * App HTTP client that already knows base URL and auth.
 * Compatible with ky instances used in Fishtownco web apps.
 */
export interface CashDrawersRequestClient {
  get: (
    path: string,
    options?: { searchParams?: Record<string, string> }
  ) => CashDrawersJsonResponse
  post: (path: string, options: { json: object }) => CashDrawersJsonResponse
  delete: (path: string) => CashDrawersJsonResponse
}

/**
 * Adapts an app HTTP client into the cash-drawer transport.
 * @param client - Authenticated ky-shaped client
 * @returns Typed get/post/delete used by `api.ts`
 * @example
 * const http = createCashDrawersHttp(restaurantAdminApi)
 * await listCashEntries(http, { branchId, page: 0, limit: 20, businessFrom, businessTo })
 */
export function createCashDrawersHttp(
  client: CashDrawersRequestClient
): CashDrawersHttp {
  return {
    get: async <TResponse>(
      path: string,
      searchParams?: Record<string, string>
    ) => client.get(path, { searchParams }).json<TResponse>(),
    post: async <TResponse, TBody extends object>(path: string, json: TBody) =>
      client.post(path, { json }).json<TResponse>(),
    delete: async (path: string) => {
      await client.delete(path)
    }
  }
}
