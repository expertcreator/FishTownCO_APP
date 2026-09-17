import {
  favouritesListResponseSchema,
  favouriteToggleResponseSchema
} from "./schemas"

/**
 * Business-discovery paths for the favourites domain, relative to the service
 * root and with **no leading slash** — `CHECKOUT_ENDPOINTS`' shape and its
 * ruling: the gateway segment (`discovery/api/v1`) is config, not contract, and
 * lives in the app's transport (`orders-endpoint.ts` `discoveryServiceUrl`).
 *
 * Definitions only. Nothing here fetches. Both reads are authenticated by the
 * caller's session token — a raw session id in `Authorization: Bearer`, not a
 * JWT — so neither is reachable from the anonymous catalog half.
 */
export const FAVOURITES_ENDPOINTS = {
  /**
   * Lists the caller's favourites, newest first, restaurants and dishes mixed
   * unless `type` narrows it.
   *
   * **`page` is 0-based** and `limit` caps at 100 (`favoriteValidation.ts:28-55`).
   * **`lat`/`lng` are never sent**: with them the service replaces `total` with
   * the post-filter length of the current page (`favoriteService.ts:749`), and
   * pagination stops being computable from the answer.
   */
  list: {
    method: "GET",
    /**
     * Builds the favourites-list path.
     * @returns The `favorites` path
     * @example FAVOURITES_ENDPOINTS.list.path() // -> "favorites"
     */
    path: () => "favorites",
    response: favouritesListResponseSchema
  },
  /**
   * Adds or removes one favourite — one endpoint for both directions, and the
   * answer's `isFavorite` says which way it landed.
   *
   * The body's refine requires **only** `productId` for `type: "product"`
   * (`favoriteValidation.ts:12-26`); mobile also sends `tenantId`, but it is
   * optional, which is what makes a heart on a dish card possible at all.
   */
  toggle: {
    method: "POST",
    /**
     * Builds the favourite-toggle path.
     * @returns The `favorites/toggle` path
     * @example FAVOURITES_ENDPOINTS.toggle.path() // -> "favorites/toggle"
     */
    path: () => "favorites/toggle",
    response: favouriteToggleResponseSchema
  }
} as const
