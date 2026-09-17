/**
 * Restaurant-admin / product-API order paths (no leading slash).
 * @example
 * POS_ORDERS_API.byId("abc")
 * // "orders/abc"
 */
export const POS_ORDERS_API = {
  create: "orders",
  admin: "orders/admin",
  /**
   * Builds GET/PUT path for one order.
   * @param orderId - Order identifier
   * @returns Encoded `orders/:id` path
   */
  byId: (orderId: string) => `orders/${encodeURIComponent(orderId)}`,
  /**
   * Builds PATCH status path.
   * @param orderId - Order identifier
   * @returns Encoded `orders/:id/status` path
   */
  status: (orderId: string) => `orders/${encodeURIComponent(orderId)}/status`,
  /**
   * Builds PATCH table path.
   * @param orderId - Order identifier
   * @returns Encoded `orders/:id/table` path
   */
  table: (orderId: string) => `orders/${encodeURIComponent(orderId)}/table`,
  /**
   * Marketplace-only add-item path. POS dine-in must not call this.
   * @param orderId - Order identifier
   * @returns Encoded `orders/:id/items` path
   */
  marketplaceItems: (orderId: string) =>
    `orders/${encodeURIComponent(orderId)}/items`,
  /**
   * Builds PATCH fulfillment path (Fishtownco delivery → pickup).
   * @param orderId - Order identifier
   * @returns Encoded `orders/:id/order-type` path
   */
  orderType: (orderId: string) =>
    `orders/${encodeURIComponent(orderId)}/order-type`
} as const

/**
 * POS bill item writes always PUT the full list. Marketplace may POST items.
 */
export const POS_BILL_ITEM_WRITE = "PUT" as const
