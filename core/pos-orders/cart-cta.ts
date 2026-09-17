import type { PosCartCtaOutcome, PosCartCtaPath } from "./types"

/**
 * Cart footer CTA contracts. Hold never writes server `pending`.
 * @param path - Operator CTA
 * @returns Whether to POST, open payment, or hold locally
 */
export function cartCtaOutcome(path: PosCartCtaPath): PosCartCtaOutcome {
  if (path === "send-kitchen") {
    return {
      callsPlaceOrder: true,
      opensPayment: false,
      localHoldOnly: false,
      paymentStatus: "pending",
      orderStatus: "confirmed"
    }
  }
  if (path === "take-payment") {
    return {
      callsPlaceOrder: false,
      opensPayment: true,
      localHoldOnly: false,
      paymentStatus: null,
      orderStatus: null
    }
  }
  return {
    callsPlaceOrder: false,
    opensPayment: false,
    localHoldOnly: true,
    paymentStatus: null,
    orderStatus: null
  }
}

/**
 * Primary cart CTA for an order type (POS sell copy).
 * @param orderType - DineIn | TakeAway | Delivery
 * @returns send-kitchen for dine-in, take-payment otherwise
 */
export function cartPrimaryPath(
  orderType: string
): Exclude<PosCartCtaPath, "hold"> {
  return orderType === "DineIn" ? "send-kitchen" : "take-payment"
}

/**
 * Secondary cart CTA for an order type.
 * @param orderType - DineIn | TakeAway | Delivery
 * @returns take-payment for dine-in, send-kitchen otherwise
 */
export function cartSecondaryPath(
  orderType: string
): Exclude<PosCartCtaPath, "hold"> {
  return orderType === "DineIn" ? "take-payment" : "send-kitchen"
}

/**
 * Settlement fields for pay-later send (payment pending, bill open).
 * @returns confirmed + pending + cash + received 0
 */
export function sendKitchenSettlement() {
  const outcome = cartCtaOutcome("send-kitchen")
  return {
    orderStatus: outcome.orderStatus as "confirmed",
    paymentStatus: outcome.paymentStatus as "pending",
    paymentMethod: "cash" as const,
    receivedAmount: 0
  }
}

/**
 * Delivery requires a non-empty address before send.
 * @param orderType - Order type token
 * @param deliveryAddress - Free-text address
 * @returns True when Delivery and address is blank
 */
export function isDeliveryAddressMissing(
  orderType: string,
  deliveryAddress: string | null | undefined
): boolean {
  if (orderType !== "Delivery") {
    return false
  }
  return !String(deliveryAddress ?? "").trim()
}

/**
 * POS dine-in / walk-in bills must never POST `/orders/:id/items`.
 * @param isPosOriginBill - True for POS-created dine-in/takeaway/walk-in
 * @returns Always false when POS-origin
 */
export function shouldPostMarketplaceOrderItems(
  isPosOriginBill: boolean
): boolean {
  return !isPosOriginBill
}
