import type { OrderStatus } from "@/constants"
import { getValidNextStatuses } from "@/constants/state-machine"
import { needsMarketplaceAcceptReject } from "./process"

/**
 * Primary kitchen status after the current one (never cancel).
 * Pending marketplace tickets stay on Accept / Reject instead.
 * @param currentStatus - Current order status
 * @param isOnlineOrder - Online marketplace flag
 * @param deliveryProvider - Rider provider
 * @returns Next kitchen status, or `null` for pending marketplace tickets
 */
export function getPrimaryNextPosStatus(
  currentStatus: OrderStatus | string,
  isOnlineOrder?: boolean | null,
  deliveryProvider?: string | null
): OrderStatus | null {
  const current = String(currentStatus).toLowerCase() as OrderStatus
  if (
    needsMarketplaceAcceptReject({
      isOnlineOrder,
      orderStatus: current
    })
  ) {
    return null
  }

  const statusDeliveryProvider =
    isOnlineOrder === false ? null : deliveryProvider
  const valid = getValidNextStatuses(current, statusDeliveryProvider)
  return valid.find((status) => status !== "cancelled") ?? null
}
