/**
 * Customer-side cancel eligibility (`mw-4-3`, copied verbatim from
 * `mobile-tenant-app`'s `features/orders/utils/orderCancellation.ts`).
 *
 * This is the CUSTOMER rule — a self-service cancel is allowed only before the
 * kitchen starts. It is not the merchant cancel/reject rule, which lives in
 * `@/core/orders` and answers a different question for a different audience.
 */

import type { OrderStatus } from "./list-types"

/** Backend error code for a cancel attempted past the cancellable window. */
export const ORDER_CANNOT_BE_CANCELLED_CODE = "ORDER_CANNOT_BE_CANCELLED"

/**
 * Whether the customer may still cancel this order themselves.
 *
 * Only `pending` and `confirmed` qualify — once a kitchen is `preparing`, food
 * has been committed and cancelling becomes a merchant conversation rather than
 * a button. Both spellings of cancelled, every delivery-lifecycle status and a
 * missing status all answer `false`, so an unknown value can never open the
 * window by accident.
 * @param status - The order's status, in any of the shapes an API sends it
 * @returns `true` only for `pending` and `confirmed`
 * @example isOrderCancellable("preparing") // -> false
 */
export function isOrderCancellable(
  status: OrderStatus | string | null | undefined
): boolean {
  return status === "pending" || status === "confirmed"
}

/**
 * The error code a cancel request would fail with, decided client-side so the
 * UI can disable the action instead of round-tripping to be refused.
 * @param status - The order's status, in any of the shapes an API sends it
 * @returns `null` when cancelling is allowed, otherwise the backend's code
 * @example getOrderCancellationEligibilityErrorCode("completed") // -> "ORDER_CANNOT_BE_CANCELLED"
 */
export function getOrderCancellationEligibilityErrorCode(
  status: OrderStatus | string | null | undefined
): typeof ORDER_CANNOT_BE_CANCELLED_CODE | null {
  return isOrderCancellable(status) ? null : ORDER_CANNOT_BE_CANCELLED_CODE
}
