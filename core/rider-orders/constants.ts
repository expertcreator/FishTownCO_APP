/**
 * Rider (driver-app) order paths under discovery.
 * Restaurant-admin / discovery bases already include the service prefix.
 */
export const RIDER_ORDERS_API = {
  /** GET list / POST action folder — `riders/orders`. */
  list: "riders/orders",
  /** GET the rider's in-progress assignment. */
  active: "riders/orders/active",
  /**
   * Builds POST `riders/orders/:id/action`.
   * @param orderId - Order UUID
   * @returns Encoded action path
   */
  action: (orderId: string) =>
    `riders/orders/${encodeURIComponent(orderId)}/action`,
  /**
   * Builds POST `riders/orders/:id/fail`.
   * @param orderId - Order UUID
   * @returns Encoded fail path
   */
  fail: (orderId: string) =>
    `riders/orders/${encodeURIComponent(orderId)}/fail`,
  /**
   * Builds GET `orders/:id` (order details).
   * @param orderId - Order UUID
   * @returns Encoded details path
   */
  details: (orderId: string) => `orders/${encodeURIComponent(orderId)}`,
  /**
   * Builds PATCH `orders/:id/estimated-delivery-time`.
   * @param orderId - Order UUID
   * @returns Encoded estimated-delivery-time path
   */
  estimatedDeliveryTime: (orderId: string) =>
    `orders/${encodeURIComponent(orderId)}/estimated-delivery-time`
} as const

/** Rider mutation actions sent on POST `/riders/orders/:id/action`. */
export const RIDER_ORDER_ACTIONS = [
  "accept",
  "reject",
  "pickup",
  "dropoff",
  "failed"
] as const

export type RiderOrderAction = (typeof RIDER_ORDER_ACTIONS)[number]
