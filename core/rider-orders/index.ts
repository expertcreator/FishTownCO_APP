/**
 * Rider (driver-app) order domain: assignment actions, details, line-item
 * mapping, and proof-image picking.
 *
 * **Not `@/core/orders`** (merchant/POS) and **not `@/core/customer-orders`**
 * (diner). This is the third audience — the rider delivering the ticket.
 */

export { RIDER_ORDER_ACTIONS, RIDER_ORDERS_API } from "./constants"
export type { RiderOrderAction } from "./constants"
export {
  failRiderOrderDelivery,
  getRiderActiveOrder,
  getRiderOrderDetails,
  listRiderOrders,
  submitRiderOrderAction,
  updateRiderEstimatedDeliveryTime,
  buildRiderOrdersListSearchParams
} from "./api"
export { createRiderOrdersHttp } from "./http"
export type {
  RiderOrdersHttp,
  RiderOrdersJsonResponse,
  RiderOrdersRequestClient,
  RiderOrdersSearchParams
} from "./http"
export {
  failRiderOrderDeliveryBodySchema,
  riderOrderActionBodySchema,
  riderOrderActionSchema,
  updateEstimatedDeliveryTimeBodySchema
} from "./schemas"
export type {
  FailRiderOrderDeliveryBody,
  RiderOrderActionBody,
  UpdateEstimatedDeliveryTimeBody
} from "./schemas"
export {
  buildFailRiderOrderDeliveryBody,
  buildRiderOrderActionBody,
  buildUpdateEstimatedDeliveryTimeBody,
  unwrapEstimatedDeliveryTimeResponse,
  unwrapRiderOrderMutationResponse
} from "./payloads"
export { pickOrderProofImageUrls } from "./proof-images"
export {
  isOrderLineItemDeleted,
  mapApiOrderItemsToUi,
  resolveOrderLineItemPrice
} from "./line-items"
export type { MappedOrderLineItem } from "./line-items"
export type {
  FailRiderOrderDeliveryRequest,
  LocalizedText,
  RiderActiveOrder,
  RiderOrderActionRequest,
  RiderOrderActionResponse,
  RiderOrderDetailsItem,
  RiderOrderDetailsResponse,
  RiderOrderListItem,
  RiderOrdersListParams,
  RiderOrdersListResponse,
  UpdateEstimatedDeliveryTimeRequest,
  UpdateEstimatedDeliveryTimeResponse
} from "./types"
