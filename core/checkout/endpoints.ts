import {
  addressListResponseSchema,
  addressMutationResponseSchema,
  profileMutationResponseSchema,
  profileReadResponseSchema,
  serviceabilityResponseSchema
} from "./schemas"

/**
 * Auth-service paths for the checkout domain, relative to the service root
 * and with **no leading slash** — `SESSION_ENDPOINTS`' shape and its ruling:
 * the gateway segment (`auth/api/v1`) is config, not contract, and lives in
 * the app's transport (`mint.ts` `authServiceUrl`).
 *
 * Definitions only. Nothing here fetches. The list read is authenticated by
 * the caller's session token — no service token, like every user-auth route.
 */
export const CHECKOUT_ENDPOINTS = {
  /**
   * Lists the caller's saved addresses (mobile `ADDRESS.GET_ALL`,
   * `endpoints.ts:64`). The trailing slash is the backend's own spelling —
   * dropping it is a different route to the gateway.
   */
  listAddresses: {
    method: "GET",
    /**
     * Builds the address-list path.
     * @returns The `users/addresses/` path
     */
    path: () => "users/addresses/",
    response: addressListResponseSchema
  },
  /**
   * Saves a new address (mobile `ADDRESS.CREATE`). Same path as the list read,
   * different verb — and the same load-bearing trailing slash.
   */
  createAddress: {
    method: "POST",
    /**
     * Builds the address-create path.
     * @returns The `users/addresses/` path
     */
    path: () => "users/addresses/",
    response: addressMutationResponseSchema
  },
  /**
   * Updates one address (mobile `ADDRESS.UPDATE`). **No trailing slash here** —
   * the id terminates the path, which is the backend's own spelling.
   *
   * `PATCH`, not `PUT`: the auth service registers the edit as
   * `fastify.patch("/:id")` (`address.routes.ts:90`) and has no PUT handler, so
   * a PUT is a 404 the web proxy could only report as an outage.
   */
  updateAddress: {
    method: "PATCH",
    /**
     * Builds the address-update path.
     * @param id - The address id
     * @returns The `users/addresses/{id}` path
     * @example CHECKOUT_ENDPOINTS.updateAddress.path("a1") // -> "users/addresses/a1"
     */
    path: (id: string) => `users/addresses/${encodeURIComponent(id)}`,
    response: addressMutationResponseSchema
  },
  /** Removes one address (mobile `ADDRESS.DELETE`). */
  deleteAddress: {
    method: "DELETE",
    /**
     * Builds the address-delete path.
     * @param id - The address id
     * @returns The `users/addresses/{id}` path
     * @example CHECKOUT_ENDPOINTS.deleteAddress.path("a1") // -> "users/addresses/a1"
     */
    path: (id: string) => `users/addresses/${encodeURIComponent(id)}`
  },
  /** Promotes one address to the account default (mobile `ADDRESS.SET_DEFAULT`). */
  setDefaultAddress: {
    method: "PATCH",
    /**
     * Builds the set-default path.
     * @param id - The address id
     * @returns The `users/addresses/{id}/set-default` path
     * @example CHECKOUT_ENDPOINTS.setDefaultAddress.path("a1") // -> "users/addresses/a1/set-default"
     */
    path: (id: string) =>
      `users/addresses/${encodeURIComponent(id)}/set-default`,
    response: addressMutationResponseSchema
  },
  /**
   * Reads the caller's own account row — what `/account` fills its profile
   * section from (`mw-3-5`).
   *
   * Same path as {@link CHECKOUT_ENDPOINTS.updateMe}, different verb: the auth
   * service registers `fastify.get("/me")` and `fastify.patch("/me")` on one
   * route file (`user-profile.routes.ts:30,82`). `authenticate` is its
   * preHandler and there is NO user-type gate on the read, unlike the write.
   */
  getMe: {
    method: "GET",
    /**
     * Builds the own-profile path.
     * @returns The `users/me` path
     * @example CHECKOUT_ENDPOINTS.getMe.path() // -> "users/me"
     */
    path: () => "users/me",
    response: profileReadResponseSchema
  },
  /**
   * Saves the caller's own account fields — the contact name and phone
   * checkout collects (`mw-3-2`, mobile `USER.UPDATE_PROFILE`).
   *
   * `PATCH`, and no trailing slash: the auth service registers it as
   * `fastify.patch("/me")` under `/api/v1/users` (`server.ts:129` mounts
   * `userProfileRoutes`; the `/api/v1/admin` sibling is a different
   * controller). The route's own OpenAPI description omits `phone` and is
   * stale — `UpdateProfileSchema` is the contract.
   */
  updateMe: {
    method: "PATCH",
    /**
     * Builds the own-profile path.
     * @returns The `users/me` path
     * @example CHECKOUT_ENDPOINTS.updateMe.path() // -> "users/me"
     */
    path: () => "users/me",
    response: profileMutationResponseSchema
  },
  /**
   * Asks whether a branch delivers to a point.
   *
   * **This one is on the discovery service, not auth** — the only endpoint in
   * this domain that is, so its caller builds the URL from the discovery root
   * rather than `authServiceUrl`.
   */
  validateServiceability: {
    method: "POST",
    /**
     * Builds the serviceability path.
     * @returns The `serviceability/validate` path
     */
    path: () => "serviceability/validate",
    response: serviceabilityResponseSchema
  }
} as const
