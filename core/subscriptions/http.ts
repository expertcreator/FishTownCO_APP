/**
 * Query string accepted by GET helpers (ky `searchParams`).
 * @example
 * { page: "0", limit: "20" }
 */
export type SubscriptionsSearchParams = Record<string, string>

/**
 * Minimal HTTP surface used by subscription API helpers.
 */
export interface SubscriptionsHttp {
  get: <TResponse>(
    path: string,
    searchParams?: SubscriptionsSearchParams
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
  delete: <TResponse>(path: string) => Promise<TResponse>
}

/**
 * Ky-shaped JSON response. `json()` parses the body as `TResponse`.
 */
export interface SubscriptionsJsonResponse {
  json: <TResponse>() => Promise<TResponse>
}

/**
 * App HTTP client that already knows base URL and auth.
 * Compatible with ky instances used in Fishtownco web apps.
 */
export interface SubscriptionsRequestClient {
  get: (
    path: string,
    options?: { searchParams?: SubscriptionsSearchParams }
  ) => SubscriptionsJsonResponse
  post: (path: string, options: { json: object }) => SubscriptionsJsonResponse
  put: (path: string, options: { json: object }) => SubscriptionsJsonResponse
  patch: (path: string, options: { json: object }) => SubscriptionsJsonResponse
  delete: (path: string) => SubscriptionsJsonResponse
}

/**
 * Adapts an app HTTP client into the subscription transport.
 * @param client - Authenticated ky-shaped client
 * @returns Typed get/post/put/patch/delete used by `api.ts`
 * @example
 * const http = createSubscriptionsHttp(superAdminApi)
 * await listSubscriptions(http, { page: 0, limit: 20 })
 */
export function createSubscriptionsHttp(
  client: SubscriptionsRequestClient
): SubscriptionsHttp {
  return {
    get: async <TResponse>(
      path: string,
      searchParams?: SubscriptionsSearchParams
    ) => client.get(path, { searchParams }).json<TResponse>(),
    post: async <TResponse, TBody extends object>(path: string, json: TBody) =>
      client.post(path, { json }).json<TResponse>(),
    put: async <TResponse, TBody extends object>(path: string, json: TBody) =>
      client.put(path, { json }).json<TResponse>(),
    patch: async <TResponse, TBody extends object>(path: string, json: TBody) =>
      client.patch(path, { json }).json<TResponse>(),
    delete: async <TResponse>(path: string) =>
      client.delete(path).json<TResponse>()
  }
}
