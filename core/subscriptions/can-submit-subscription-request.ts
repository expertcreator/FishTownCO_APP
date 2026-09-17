/**
 * Flags that decide whether a tenant may open a subscription request.
 */
export type CanSubmitSubscriptionRequestInput = {
  isOwner: boolean
  branchId: string | null
  claimStatus?: "pending" | "approved" | "rejected" | null
  hasActiveUnexpiredSubscription: boolean
}

/**
 * Whether the tenant owner may open a new subscription request.
 * Active unexpired plans cannot request again; pending/approved claims also block.
 * @param input - Owner, branch, claim, and current-plan flags
 * @param input.isOwner - Current user can manage subscriptions
 * @param input.branchId - Branch-scoped staff have no tenant billing access
 * @param input.claimStatus - Latest payment-claim review state
 * @param input.hasActiveUnexpiredSubscription - Current plan is active and not expired
 * @returns `true` when the request button should show
 * @example
 * canSubmitSubscriptionRequest({
 *   isOwner: true,
 *   branchId: null,
 *   claimStatus: null,
 *   hasActiveUnexpiredSubscription: true
 * })
 * // false — live plan already covers the tenant
 */
export function canSubmitSubscriptionRequest(
  input: CanSubmitSubscriptionRequestInput
) {
  return (
    input.isOwner &&
    !input.branchId &&
    !input.hasActiveUnexpiredSubscription &&
    input.claimStatus !== "pending" &&
    input.claimStatus !== "approved"
  )
}
