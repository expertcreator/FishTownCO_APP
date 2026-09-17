/**
 * Relative paths for order flagging.
 * Restaurant-admin / discovery bases already include the service prefix.
 */

/**
 * Builds the `/orders/:id/flags` folder for an order (tenant / customer reporters).
 * @param orderId - Order UUID
 * @returns Path prefix `/orders/{orderId}/flags`
 */
function orderFlagsFolder(orderId: string): string {
  return `/orders/${encodeURIComponent(orderId)}/flags`
}

/**
 * Builds the `/riders/orders/:id/flags` folder for an order (rider reporter).
 * @param orderId - Order UUID
 * @returns Path prefix `/riders/orders/{orderId}/flags`
 */
function riderOrderFlagsFolder(orderId: string): string {
  return `/riders/orders/${encodeURIComponent(orderId)}/flags`
}

/** Tenant / customer reporter paths under `/orders/:id/...`. */
export const ORDER_FLAG_PATHS = {
  /**
   * Builds the flag-eligibility path for an order.
   * @param orderId - Order UUID
   * @returns Path string
   */
  eligibility: (orderId: string) =>
    `/orders/${encodeURIComponent(orderId)}/flag-eligibility`,
  /**
   * Paths nested under `/orders/:id/flags`.
   */
  flags: {
    /**
     * Builds the current-reporter flag track path for an order.
     * @param orderId - Order UUID
     * @returns Path string
     */
    mine: (orderId: string) => `${orderFlagsFolder(orderId)}/me`,
    /**
     * Builds the create-flag path for an order.
     * @param orderId - Order UUID
     * @returns Path string
     */
    create: (orderId: string) => orderFlagsFolder(orderId)
  }
} as const

/** Rider reporter paths under `/riders/orders/:id/...` (driver app). */
export const RIDER_ORDER_FLAG_PATHS = {
  /**
   * Builds the rider flag-eligibility path for an order.
   * @param orderId - Order UUID
   * @returns `GET /riders/orders/{id}/flag-eligibility`
   */
  eligibility: (orderId: string) =>
    `/riders/orders/${encodeURIComponent(orderId)}/flag-eligibility`,
  /**
   * Paths nested under `/riders/orders/:id/flags`.
   */
  flags: {
    /**
     * Builds the rider's flag track path for an order.
     * @param orderId - Order UUID
     * @returns `GET /riders/orders/{id}/flags/me`
     */
    mine: (orderId: string) => `${riderOrderFlagsFolder(orderId)}/me`,
    /**
     * Builds the rider create-flag path for an order.
     * @param orderId - Order UUID
     * @returns `POST /riders/orders/{id}/flags`
     */
    create: (orderId: string) => riderOrderFlagsFolder(orderId)
  },
  /**
   * Lists flags submitted by the current rider across orders.
   * @returns `GET /riders/flags/me`
   */
  flagsMe: () => "/riders/flags/me"
} as const

/** Upload folder for order-flag evidence (presigned upload). */
export const ORDER_FLAG_UPLOAD_FOLDER = "order_flags" as const
