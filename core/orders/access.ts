/**
 * Whether the tenant cannot place POS orders and must use live/edit only.
 * Marketplace tenants and hybrid tenants without an active subscription
 * keep the orders home for tickets, without cart or place-order.
 * @param input - Tenant sell channel and subscription
 * @param input.sellOn - Tenant `sellOn` value
 * @param input.subscription - Current tenant subscription, if any
 * @returns `true` when orders home is live/edit only
 */
export function isMarketplaceOrdersAccessOnly(input: {
  sellOn: string | null | undefined
  subscription?: {
    isActive?: boolean | null
    expireAt?: string | null
  } | null
}): boolean {
  if (input.sellOn === "marketplace") {
    return true
  }

  if (input.sellOn !== "hybrid") {
    return false
  }

  const expireAt = input.subscription?.expireAt
  const isActive =
    input.subscription?.isActive === true &&
    typeof expireAt === "string" &&
    new Date(expireAt).getTime() > Date.now()

  return !isActive
}
