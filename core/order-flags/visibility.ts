/** Terminal order statuses that unlock submitting a new report. */
export const ORDER_FLAG_TERMINAL_STATUSES = [
  "completed",
  "cancelled",
  "rejected"
] as const

export type OrderFlagVisibilityInput = {
  /** `order_flagging` feature flag */
  flagEnabled: boolean
  /** Marketplace / online order */
  isOnlineOrder: boolean
  /** Current order status */
  orderStatus: string
  /** Existing flag on the order for this reporter, if any */
  myFlag?: { flagId: string; status: string } | null
}

export type OrderFlagVisibility = {
  /** Show banner and/or history */
  canShow: boolean
  /** May fetch eligibility and open the report form */
  canSubmit: boolean
}

/**
 * Mirrors tenant-admin visibility for the report-issue card.
 * @param input - Feature flag, online flag, status, optional existing flag
 * @returns Whether to show the card and whether submit is allowed
 * @example
 * resolveOrderFlagVisibility({
 *   flagEnabled: true,
 *   isOnlineOrder: true,
 *   orderStatus: "completed",
 * })
 * // → { canShow: true, canSubmit: true }
 */
export function resolveOrderFlagVisibility(
  input: OrderFlagVisibilityInput
): OrderFlagVisibility {
  const featureActive = input.flagEnabled && input.isOnlineOrder === true
  const status = String(input.orderStatus ?? "")
    .trim()
    .toLowerCase()
  const isTerminal = (
    ORDER_FLAG_TERMINAL_STATUSES as readonly string[]
  ).includes(status)
  const canSubmit = featureActive && isTerminal
  const canShow = featureActive && (isTerminal || Boolean(input.myFlag))
  return { canShow, canSubmit }
}
