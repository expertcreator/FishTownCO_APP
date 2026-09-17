import type { CoreHttpClient } from "./http"
import { ORDER_FLAG_PATHS, RIDER_ORDER_FLAG_PATHS } from "./endpoints"
import {
  createOrderFlagBodySchema,
  orderFlagEligibilityResponseSchema,
  orderFlagTrackResponseSchema,
  type CreateOrderFlagBody,
  type OrderFlagEligibilityData,
  type OrderFlagTrack
} from "./schemas"

/**
 * GET `/orders/:id/flag-eligibility` (tenant / customer reporters).
 * @param client - Authenticated HTTP client
 * @param orderId - Order UUID
 * @returns Eligibility data for the current reporter
 * @throws {ZodError} If the response shape is invalid
 */
export async function fetchOrderFlagEligibility(
  client: CoreHttpClient,
  orderId: string
): Promise<OrderFlagEligibilityData> {
  const body = await client.get<unknown>(ORDER_FLAG_PATHS.eligibility(orderId))
  return orderFlagEligibilityResponseSchema.parse(body).data
}

/**
 * GET `/orders/:id/flags/me` (tenant / customer reporters).
 * @param client - Authenticated HTTP client
 * @param orderId - Order UUID
 * @returns Current reporter's flag track, or null
 * @throws {ZodError} If the response shape is invalid
 */
export async function fetchOrderFlagTrack(
  client: CoreHttpClient,
  orderId: string
): Promise<OrderFlagTrack | null> {
  const body = await client.get<unknown>(ORDER_FLAG_PATHS.flags.mine(orderId))
  return orderFlagTrackResponseSchema.parse(body).data
}

/**
 * POST `/orders/:id/flags` (tenant / customer reporters).
 * @param client - Authenticated HTTP client
 * @param orderId - Order UUID
 * @param rawBody - Report payload (validated before send)
 * @returns void on success
 * @throws {ZodError} If the body fails schema validation
 */
export async function submitOrderFlag(
  client: CoreHttpClient,
  orderId: string,
  rawBody: CreateOrderFlagBody
): Promise<void> {
  const body = createOrderFlagBodySchema.parse(rawBody)
  await client.post(ORDER_FLAG_PATHS.flags.create(orderId), body)
}

/**
 * GET `/riders/orders/:id/flag-eligibility` (rider reporter).
 * @param client - Authenticated HTTP client
 * @param orderId - Order UUID
 * @returns Eligibility data for the current rider
 * @throws {ZodError} If the response shape is invalid
 */
export async function fetchRiderOrderFlagEligibility(
  client: CoreHttpClient,
  orderId: string
): Promise<OrderFlagEligibilityData> {
  const body = await client.get<unknown>(
    RIDER_ORDER_FLAG_PATHS.eligibility(orderId)
  )
  return orderFlagEligibilityResponseSchema.parse(body).data
}

/**
 * GET `/riders/orders/:id/flags/me` (rider reporter).
 * @param client - Authenticated HTTP client
 * @param orderId - Order UUID
 * @returns Current rider's flag track, or null
 * @throws {ZodError} If the response shape is invalid
 */
export async function fetchRiderOrderFlagTrack(
  client: CoreHttpClient,
  orderId: string
): Promise<OrderFlagTrack | null> {
  const body = await client.get<unknown>(
    RIDER_ORDER_FLAG_PATHS.flags.mine(orderId)
  )
  return orderFlagTrackResponseSchema.parse(body).data
}

/**
 * POST `/riders/orders/:id/flags` (rider reporter).
 * @param client - Authenticated HTTP client
 * @param orderId - Order UUID
 * @param rawBody - Report payload (validated before send)
 * @returns void on success
 * @throws {ZodError} If the body fails schema validation
 */
export async function submitRiderOrderFlag(
  client: CoreHttpClient,
  orderId: string,
  rawBody: CreateOrderFlagBody
): Promise<void> {
  const body = createOrderFlagBodySchema.parse(rawBody)
  await client.post(RIDER_ORDER_FLAG_PATHS.flags.create(orderId), body)
}
