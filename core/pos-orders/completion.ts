import { remainingBillDue } from "./tender"

/** Kitchen statuses that still need the live board. */
export const SELL_LIVE_ACTIVE_KITCHEN_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "on_hold"
] as const

/**
 * Default GET `/orders/admin` kitchen filter when no status chip is selected.
 * Completed unpaid tickets are fetched separately and merged onto Live.
 */
export const SELL_LIVE_DEFAULT_FETCH_STATUSES = [
  ...SELL_LIVE_ACTIVE_KITCHEN_STATUSES
] as const

function normalizePaymentStatus(
  paymentStatus: string | null | undefined
): string {
  return String(paymentStatus ?? "")
    .trim()
    .toLowerCase()
}

function normalizeOrderTypeToken(orderType: string | null | undefined): string {
  return String(orderType ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "")
}

function normalizeDeliveryProvider(
  deliveryProvider: string | null | undefined
): string {
  return String(deliveryProvider ?? "")
    .trim()
    .toLowerCase()
}

/**
 * True when money is collected. `completed` is an order status, never paid.
 * @param paymentStatus - Raw payment status
 * @returns True only for `paid`
 */
export function isOrderPaymentSettled(
  paymentStatus: string | null | undefined
): boolean {
  return normalizePaymentStatus(paymentStatus) === "paid"
}

/**
 * POS-created bills (dine-in, takeaway, walk-in, POS delivery).
 * Marketplace tickets are not POS origin, even when they use own rider.
 * @param input - Order type/table/online flags
 * @returns True when the ticket was created on POS
 */
export function isPosOriginLiveBill(input: {
  isOnlineOrder?: boolean | null
  orderType?: string | null
  order_type?: string | null
  tableId?: string | null
  tableName?: string | null
  deliveryProvider?: string | null
}): boolean {
  const token = normalizeOrderTypeToken(input.orderType ?? input.order_type)
  const provider = normalizeDeliveryProvider(input.deliveryProvider)
  if (token === "delivery") {
    return input.isOnlineOrder === false
  }
  if (token === "walkin" || token.includes("walkin") || token === "walk") {
    return true
  }
  if (
    token === "dinein" ||
    Boolean(input.tableId) ||
    Boolean(input.tableName)
  ) {
    return true
  }
  if (input.isOnlineOrder === false) {
    return true
  }
  if (token === "takeaway" || token === "pickup" || token.includes("take")) {
    if (
      provider === "customer_pickup" ||
      provider === "own_rider" ||
      provider === "platform_rider"
    ) {
      return input.isOnlineOrder !== true
    }
    return true
  }
  return false
}

/**
 * Settle-gate: marketplace prepaid must not open cash tender.
 * @param input - Online flag, payment status/method
 * @returns True when the shop must not tender
 */
export function isMarketplaceOrderPrepaid(input: {
  isOnlineOrder?: boolean | null
  paymentStatus?: string | null
  paymentMethod?: string | null
}): boolean {
  if (input.isOnlineOrder !== true) {
    return false
  }
  if (isOrderPaymentSettled(input.paymentStatus)) {
    return true
  }
  return String(input.paymentMethod ?? "")
    .trim()
    .toLowerCase()
    .includes("online")
}

/**
 * Marketplace complete marks paid with the exact bill total.
 * Cash tender is never collected in tenant admin for marketplace tickets.
 * @param input - Online flag and next kitchen status
 * @param input.isOnlineOrder - `true` for marketplace-placed tickets
 * @param input.newStatus - Intended kitchen status
 * @returns True when the status patch must send paid plus received amount
 */
export function shouldMarkPaidExactOnComplete(input: {
  isOnlineOrder?: boolean | null
  newStatus?: string | null
}): boolean {
  if (input.isOnlineOrder !== true) {
    return false
  }
  return (
    String(input.newStatus ?? "")
      .trim()
      .toLowerCase() === "completed"
  )
}

/**
 * Cash/card settle is for POS-created tickets only.
 * Marketplace tickets never open tender, including own-rider and pickup.
 * Platform-rider delivery never opens tender, including POS-created tickets.
 * @param input - Origin and delivery flags
 * @returns True when Live may open tender
 */
export function isLiveBillSettleEligible(input: {
  isOnlineOrder?: boolean | null
  orderType?: string | null
  order_type?: string | null
  tableId?: string | null
  tableName?: string | null
  deliveryProvider?: string | null
  posOriginBill?: boolean
}): boolean {
  if (input.isOnlineOrder === true) {
    return false
  }
  if (normalizeDeliveryProvider(input.deliveryProvider) === "platform_rider") {
    return false
  }
  if (input.posOriginBill === true) {
    return true
  }
  if (input.isOnlineOrder === false) {
    return true
  }
  if (normalizeDeliveryProvider(input.deliveryProvider) === "own_rider") {
    return true
  }
  return isPosOriginLiveBill(input)
}

/**
 * Inline settle when an eligible bill still has money due, including after adds.
 * Hidden while the ticket is still pending. Also shows for completed unpaid
 * eligible bills even when received already covers total.
 * Marketplace and platform-rider tickets never open cash tender.
 * @param input - Bill flags and amounts
 * @returns True when the settle footer should show
 */
export function shouldShowLiveBillSettle(input: {
  isOnlineOrder?: boolean | null
  orderStatus?: string | null
  paymentStatus?: string | null
  paymentMethod?: string | null
  readyWithoutTransition?: boolean
  orderType?: string | null
  order_type?: string | null
  tableId?: string | null
  tableName?: string | null
  deliveryProvider?: string | null
  posOriginBill?: boolean
  receivedAmount?: number | null
  total?: number | null
}): boolean {
  if (input.isOnlineOrder === true) {
    return false
  }
  if (isMarketplaceOrderPrepaid(input)) {
    return false
  }
  if (!isLiveBillSettleEligible(input)) {
    return false
  }

  const status = String(input.orderStatus ?? "")
    .trim()
    .toLowerCase()
  if (status === "cancelled" || status === "rejected" || status === "pending") {
    return false
  }

  const remaining = remainingBillDue(
    Number(input.total) || 0,
    Number(input.receivedAmount) || 0
  )
  if (remaining > 0) {
    return true
  }

  if (isOrderPaymentSettled(input.paymentStatus)) {
    return false
  }
  if (status === "completed") {
    return true
  }
  if (input.readyWithoutTransition && status === "ready") {
    return true
  }
  return false
}

/**
 * Served + paid — lifecycle finished.
 * @param input - Status pair
 * @returns True when completed and paid
 */
export function isOrderFullyComplete(input: {
  orderStatus?: string | null
  paymentStatus?: string | null
}): boolean {
  const status = String(input.orderStatus ?? "")
    .trim()
    .toLowerCase()
  return status === "completed" && isOrderPaymentSettled(input.paymentStatus)
}

/**
 * Whether a ticket is still live: kitchen in progress, or payment still due.
 * Cancelled and rejected stay off the unfiltered live board.
 * Completed tickets stay visible while payment is pending.
 * @param input - Kitchen and payment statuses
 * @param input.orderStatus - Ticket kitchen status
 * @param input.paymentStatus - Ticket payment status
 * @returns `true` for an active live ticket
 */
export function isSellLiveActiveOrder(input: {
  orderStatus?: string | null
  paymentStatus?: string | null
}): boolean {
  const status = String(input.orderStatus ?? "")
    .trim()
    .toLowerCase()
  if (status === "cancelled" || status === "rejected") {
    return false
  }
  if (
    SELL_LIVE_ACTIVE_KITCHEN_STATUSES.some(
      (kitchenStatus) => kitchenStatus === status
    )
  ) {
    return true
  }
  return normalizePaymentStatus(input.paymentStatus) === "pending"
}

/**
 * Whether a ticket stays on the unfiltered live board.
 * Active search/facets keep the server result as-is.
 * @param input - Filter flag and ticket statuses
 * @param input.hasActiveFilters - Whether search or facets are set
 * @param input.orderStatus - Ticket kitchen status
 * @param input.paymentStatus - Ticket payment status
 * @returns `true` when the row should render
 */
export function shouldShowSellLiveRow(input: {
  hasActiveFilters: boolean
  orderStatus?: string | null
  paymentStatus?: string | null
}): boolean {
  if (input.hasActiveFilters) {
    return true
  }

  return isSellLiveActiveOrder(input)
}

/**
 * After Mark served, unpaid bills stay on the detail panel.
 * @param paymentStatus - Raw payment status
 * @returns True when settle is still required
 */
export function shouldKeepBillOpenAfterMarkServed(
  paymentStatus: string | null | undefined
): boolean {
  return !isOrderPaymentSettled(paymentStatus)
}

/**
 * Live tickets can add or remove lines until they are terminal.
 * Marketplace tickets can be edited only while pending (before accept).
 * Delivery tickets that are already ready cannot be modified.
 * @param orderStatus - Current kitchen status
 * @param orderType - Order channel (`Delivery`, `DineIn`, …)
 * @param isOnlineOrder - `true` for marketplace tickets
 * @returns True when add/remove item controls should show
 */
export function canEditLiveBillItems(
  orderStatus: string | null | undefined,
  orderType?: string | null,
  isOnlineOrder?: boolean | null
): boolean {
  const status = String(orderStatus ?? "")
    .trim()
    .toLowerCase()
  if (isOnlineOrder === true) {
    return status === "pending"
  }
  if (
    status === "completed" ||
    status === "cancelled" ||
    status === "rejected"
  ) {
    return false
  }
  if (status === "ready" && normalizeOrderTypeToken(orderType) === "delivery") {
    return false
  }
  return true
}

/**
 * True when a live ticket still needs an operator (pending or on hold).
 * @param orderStatus - Raw kitchen status
 * @returns True for pending / on_hold
 */
export function needsLiveOperatorAttention(
  orderStatus: string | null | undefined
): boolean {
  const status = String(orderStatus ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]/g, "_")
  return status === "pending" || status === "on_hold"
}

/**
 * Open vs needs-operator counts for the sell Live dock.
 * @param orders - Live board rows
 * @returns Live total and pending/hold count
 */
export function sellLiveDockCountsFromOrders(
  orders: Array<{
    orderStatus?: string | null
    paymentStatus?: string | null
  }>
) {
  const open = orders.filter((order) => isSellLiveActiveOrder(order))
  return {
    liveCount: open.length,
    needCount: open.filter((order) =>
      needsLiveOperatorAttention(order.orderStatus)
    ).length
  }
}
