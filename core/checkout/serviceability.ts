import type { OrderFulfillment } from "@/constants"
import type { ServiceabilityReason, ServiceabilityResult } from "./schemas"

/**
 * What the checkout screen should do about delivery coverage right now.
 *
 * `skipped` is not `allowed`: it means the question does not apply (a pickup
 * branch, or a cart saved before the branch id was captured), and the caller
 * must not present it as a positive answer.
 */
export type ServiceabilityState =
  | { status: "skipped"; cause: "pickup" | "unknown-branch" }
  | { status: "idle" }
  | { status: "checking" }
  | { status: "allowed" }
  | { status: "blocked"; reason: ServiceabilityReason }
  | { status: "unavailable" }

/**
 * Whether a delivery-coverage check applies to this cart at all.
 *
 * Mirrors the service's own predicate (`serviceabilityService.ts:74`): rules
 * bind only for `fishtownco` and only when the branch actually delivers. A pickup
 * branch is unconditionally serviceable, so asking would be a pointless
 * round-trip that can only produce a spurious block when the service is down.
 * @param input - The cart's branch id and fulfilment mode
 * @param input.tenantId - The branch id captured on the cart, or `null` on a legacy cart
 * @param input.fulfillment - The branch's fulfilment mode, or `null` when unknown
 * @returns `null` when a check applies, or the reason it was skipped
 * @example serviceabilitySkipReason({ tenantId: "t1", fulfillment: "pickup" }) // -> "pickup"
 */
export function serviceabilitySkipReason(input: {
  tenantId: string | null
  fulfillment: OrderFulfillment | null
}): "pickup" | "unknown-branch" | null {
  if (input.tenantId === null || input.tenantId.trim() === "") {
    return "unknown-branch"
  }

  if (input.fulfillment === "pickup") {
    return "pickup"
  }

  return null
}

/**
 * Maps a verdict from the service onto the screen's state.
 * @param result - The parsed verdict, or `null` when the body was unreadable
 * @returns `allowed`, `blocked` with its reason, or `unavailable`
 * @example toServiceabilityState({ serviceable: true }).status // -> "allowed"
 */
export function toServiceabilityState(
  result: ServiceabilityResult | null
): ServiceabilityState {
  if (result === null) {
    return { status: "unavailable" }
  }

  return result.serviceable
    ? { status: "allowed" }
    : { status: "blocked", reason: result.reason }
}

/**
 * Whether this state must stop the visitor from placing the order.
 *
 * **Only a definite refusal blocks.** An outage (`unavailable`) does not: the
 * order is re-validated server-side at placement (`mw-2-7`), so letting a
 * visitor through a broken coverage check fails safe, while blocking on one
 * would take checkout down with a third-party service.
 * @param state - The current serviceability state
 * @returns `true` only when the branch definitively refused the address
 * @example blocksOrder({ status: "unavailable" }) // -> false
 */
export function blocksOrder(state: ServiceabilityState): boolean {
  return state.status === "blocked"
}

/**
 * Whether the coverage answer is still outstanding for a delivery order.
 *
 * Used to keep the order CTA disabled while the first check is in flight, so a
 * fast tapper cannot outrun the verdict.
 * @param state - The current serviceability state
 * @returns `true` while a check applies and has not answered yet
 * @example awaitingVerdict({ status: "checking" }) // -> true
 */
export function awaitingVerdict(state: ServiceabilityState): boolean {
  return state.status === "idle" || state.status === "checking"
}
