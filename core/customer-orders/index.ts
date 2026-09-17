/**
 * Customer-facing order logic: what a diner sees on order confirmation, order
 * detail and order tracking.
 *
 * **Not `@/core/orders`.** That domain is the merchant/POS side — accept and
 * reject, live column filters, restaurant-facing totals — and answers different
 * questions for a different audience. The two overlap by subject and by nothing
 * else; keep them apart (`mw-4-3`).
 *
 * Every module here was copied verbatim from `mobile-tenant-app`'s
 * `features/orders/`, so mobile remains the second implementation until the
 * `mw-4-13` retrofit points it at this domain. Bodies are unchanged on purpose:
 * the fallback chains absorb years of payload-shape drift and none of them is
 * as arbitrary as it looks.
 */

export { buildOrderPayload } from "./build-order-payload"
export { cartFingerprint, generateIdempotencyKey } from "./idempotency"
export {
  getOrderCancellationEligibilityErrorCode,
  isOrderCancellable,
  ORDER_CANNOT_BE_CANCELLED_CODE
} from "./order-cancellation"
export {
  parseMoneyValue,
  readPlatformFeeFromOrderDetail
} from "./order-detail-pricing"
export type { OrdersByActivity } from "./order-list-buckets"
export {
  hasMoreOrderPages,
  isActiveOrderStatus,
  normalizeOrderStatus,
  splitOrdersByActivity
} from "./order-list-buckets"
export {
  getOrdersListFirstItemName,
  isOrdersListItemDeal
} from "./order-list-item-display"
export type { OrderModalLineItem } from "./order-modal-line-items"
export {
  buildMainLineItemsForModal,
  formatOrderItemsLabelFromDetail,
  getFirstMainLineImageFromDetail,
  getMainProductNamesFromOrderDetail
} from "./order-modal-line-items"
export { isOrderModified, isOrderModifiedFlag } from "./order-modified"
export type {
  OrderMyReviewDeal,
  OrderMyReviewProduct,
  OrderMyReviewRider
} from "./order-my-review"
// `types.ts` already exports an `OrderMyReview` describing the RAW wire field;
// this is the PARSED shape the readers answer with. Aliased rather than
// renamed in the module, which is a verbatim mobile copy.
export type { OrderMyReview as ParsedOrderMyReview } from "./order-my-review"
export {
  myReviewSummaryStars,
  orderPayloadHasMyReview,
  pickMyReviewFromOrderPayload
} from "./order-my-review"
export type {
  LineRating,
  LineRatingsByKey,
  RateableLine
} from "./order-rateable-lines"
export {
  buildRateableLines,
  buildRateOrderPayload,
  hydrateRatingsFromMyReview,
  isRatingComplete
} from "./order-rateable-lines"
export {
  orderPayloadCustomerRatingStars,
  orderPayloadIndicatesCustomerRated
} from "./order-rating-status"
export { createOrderSocketInvalidator } from "./order-socket-invalidation"
export type {
  RevisionDiffLine,
  RevisionDiffResult,
  RevisionLineKind
} from "./revision-diff-model"
export {
  buildRevisionDiff,
  extractOrderDetailPayload,
  includeSoftDeletedPriorLines
} from "./revision-diff-model"
export {
  formatUnavailableProductActionLabel,
  formatUnavailableProductPreferenceLine,
  isUnavailableProductAction,
  shouldShowUnavailableProductPreference
} from "./unavailable-product-action"
export {
  collectOrderItemCustomizationParts,
  linesFromOrderVariantDetails,
  orderItemCustomizationSummary
} from "./variant-details-display"

// Payload types. `types.ts` is the order-DETAIL contract; `list-types.ts` is the
// orders-LIST row, which is a different payload from the same backend.
export type { OrderItem, OrderStatus } from "./list-types"
export type {
  CancelOrderRequest,
  CancelOrderResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  CreateOrderResponseDataUnavailable,
  GetOrderDetailResponse,
  GetOrdersParams,
  GetOrdersResponse,
  OrderDetailItem,
  OrderItemDealSelection,
  OrderMyReview,
  OrderStatusChangeSocketData,
  OrderStatusHistoryEntry,
  OrderStatusHistoryUser,
  OrderSuggestionsResponse,
  RateBranchRequest,
  RateBranchResponse,
  RateOrderRequest,
  RateOrderResponse,
  UpdateOrderFulfillmentRequest,
  UpdateOrderFulfillmentResponse
} from "./types"
