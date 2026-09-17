/**
 * Subscription and payment-claim API paths (no leading slash).
 * @example
 * SUBSCRIPTIONS_API.byId("abc")
 * // "subscriptions/abc"
 */
export const SUBSCRIPTIONS_API = {
  list: "subscriptions",
  overviewStats: "subscriptions/overview-stats",
  paymentClaims: "subscription-payment-claims",
  tenantPaymentClaims: "subscriptions/payment-claims",
  bulkApprovePaymentClaims: "subscription-payment-claims/bulk-approve",
  /**
   * Builds GET/PATCH/DELETE path for one subscription.
   * @param subscriptionId - Subscription identifier
   * @returns Encoded `subscriptions/:id` path
   */
  byId: (subscriptionId: string) =>
    `subscriptions/${encodeURIComponent(subscriptionId)}`,
  /**
   * Builds PUT review path for one payment claim.
   * @param claimId - Payment-claim identifier
   * @returns Encoded `subscription-payment-claims/:id/review` path
   */
  reviewPaymentClaim: (claimId: string) =>
    `subscription-payment-claims/${encodeURIComponent(claimId)}/review`
} as const
