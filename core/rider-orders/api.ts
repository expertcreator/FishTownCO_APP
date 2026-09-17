import { RIDER_ORDERS_API } from "./constants"
import type { RiderOrdersHttp, RiderOrdersSearchParams } from "./http"
import {
  buildFailRiderOrderDeliveryBody,
  buildRiderOrderActionBody,
  buildUpdateEstimatedDeliveryTimeBody,
  unwrapEstimatedDeliveryTimeResponse,
  unwrapRiderOrderMutationResponse
} from "./payloads"
import type {
  FailRiderOrderDeliveryRequest,
  RiderActiveOrder,
  RiderOrderActionRequest,
  RiderOrderActionResponse,
  RiderOrderDetailsResponse,
  RiderOrdersListParams,
  RiderOrdersListResponse,
  UpdateEstimatedDeliveryTimeRequest,
  UpdateEstimatedDeliveryTimeResponse
} from "./types"

/**
 * Builds query-string fields for GET `/riders/orders`.
 * @param args - Page, limit, status, and optional date range
 * @returns String search params
 */
export function buildRiderOrdersListSearchParams(
  args: RiderOrdersListParams = {}
): RiderOrdersSearchParams {
  return {
    page: String(args.page ?? 0),
    limit: String(args.limit ?? 20),
    status: args.status || "all",
    ...(args.startDate ? { startDate: args.startDate } : {}),
    ...(args.endDate ? { endDate: args.endDate } : {})
  }
}

/**
 * Lists rider orders.
 * @param http - Injected HTTP client
 * @param args - List filters plus page/limit
 * @returns GET `/riders/orders` body
 */
export function listRiderOrders(
  http: RiderOrdersHttp,
  args: RiderOrdersListParams = {}
): Promise<RiderOrdersListResponse> {
  return http.get<RiderOrdersListResponse>(
    RIDER_ORDERS_API.list,
    buildRiderOrdersListSearchParams(args)
  )
}

/**
 * Loads one order by id.
 * @param http - Injected HTTP client
 * @param orderId - Order UUID
 * @returns GET `/orders/:id` body
 */
export function getRiderOrderDetails(
  http: RiderOrdersHttp,
  orderId: string
): Promise<RiderOrderDetailsResponse> {
  return http.get<RiderOrderDetailsResponse>(RIDER_ORDERS_API.details(orderId))
}

/**
 * Loads the rider's in-progress assignment, if any.
 * @param http - Injected HTTP client
 * @returns GET `/riders/orders/active` body
 */
export function getRiderActiveOrder(
  http: RiderOrdersHttp
): Promise<RiderActiveOrder> {
  return http.get<RiderActiveOrder>(RIDER_ORDERS_API.active)
}

/**
 * Posts a rider order action (accept / reject / pickup / dropoff / failed).
 * @param http - Injected HTTP client
 * @param request - Action plus optional proof / fail fields
 * @returns Normalized mutation response
 * @throws {ZodError} If the body fails schema validation
 */
export async function submitRiderOrderAction(
  http: RiderOrdersHttp,
  request: RiderOrderActionRequest
): Promise<RiderOrderActionResponse> {
  const body = buildRiderOrderActionBody(request)
  const raw = await http.post<unknown, typeof body>(
    RIDER_ORDERS_API.action(request.orderId),
    body
  )
  return unwrapRiderOrderMutationResponse(raw)
}

/**
 * Posts a failed-delivery outcome.
 * @param http - Injected HTTP client
 * @param request - Order id plus failure reason
 * @returns Normalized mutation response
 * @throws {ZodError} If the body fails schema validation
 */
export async function failRiderOrderDelivery(
  http: RiderOrdersHttp,
  request: FailRiderOrderDeliveryRequest
): Promise<RiderOrderActionResponse> {
  const body = buildFailRiderOrderDeliveryBody(request)
  const raw = await http.post<unknown, typeof body>(
    RIDER_ORDERS_API.fail(request.orderId),
    body
  )
  return unwrapRiderOrderMutationResponse(raw)
}

/**
 * Patches estimated delivery time in minutes.
 * @param http - Injected HTTP client
 * @param request - Order id plus minutes
 * @returns Normalized mutation response
 * @throws {ZodError} If minutes is not a positive integer
 */
export async function updateRiderEstimatedDeliveryTime(
  http: RiderOrdersHttp,
  request: UpdateEstimatedDeliveryTimeRequest
): Promise<UpdateEstimatedDeliveryTimeResponse> {
  const body = buildUpdateEstimatedDeliveryTimeBody(request)
  const raw = await http.patch<unknown, typeof body>(
    RIDER_ORDERS_API.estimatedDeliveryTime(request.orderId),
    body
  )
  return unwrapEstimatedDeliveryTimeResponse(raw)
}
