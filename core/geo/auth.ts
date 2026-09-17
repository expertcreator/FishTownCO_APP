/** A token that already carries the scheme is passed through untouched. */
const BEARER_PREFIX = /^Bearer\s+/i

/**
 * How a geo request authenticates against discovery.
 *
 * Pass exactly one:
 * - `{ type: "authorization", token }` — session or Bearer token
 * - `{ type: "publicApiKey", key }` — `PUBLIC_API_KEY` as `x-public-api-key`
 */
export type GeoAuth =
  | { type: "authorization"; token: string }
  | { type: "publicApiKey"; key: string }

/**
 * Builds the authorization-token auth option.
 * @param token - Session token or a full `Bearer …` header value
 * @returns Auth option for {@link createGeoHttp}
 * @example
 * createGeoHttp(client, { auth: authorizationGeoAuth(sessionToken) })
 */
export function authorizationGeoAuth(token: string): GeoAuth {
  return { type: "authorization", token }
}

/**
 * Builds the public-API-key auth option.
 * @param key - Discovery `PUBLIC_API_KEY`
 * @returns Auth option for {@link createGeoHttp}
 * @example
 * createGeoHttp(client, { auth: publicGeoAuth(process.env.PUBLIC_API_KEY) })
 */
export function publicGeoAuth(key: string): GeoAuth {
  return { type: "publicApiKey", key }
}

/**
 * Turns a {@link GeoAuth} value into request headers.
 * @param auth - Authorization token or public API key
 * @returns Headers discovery accepts for geo reads
 * @throws {Error} If the token or key is empty
 * @example
 * geoAuthHeaders(authorizationGeoAuth("abc"))
 * // { Authorization: "Bearer abc" }
 * geoAuthHeaders(publicGeoAuth("pk_live"))
 * // { "x-public-api-key": "pk_live" }
 */
export function geoAuthHeaders(auth: GeoAuth): Record<string, string> {
  if (auth.type === "authorization") {
    const token = auth.token.trim()
    if (!token) {
      throw new Error("Geo authorization token is required")
    }
    return {
      Authorization: BEARER_PREFIX.test(token) ? token : `Bearer ${token}`
    }
  }

  const key = auth.key.trim()
  if (!key) {
    throw new Error("Geo public API key is required")
  }
  return { "x-public-api-key": key }
}
