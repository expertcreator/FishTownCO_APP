import type { Subscription } from "./types"

/**
 * Picks the active subscription that covers `now` and expires last.
 * @param subscriptions - Tenant subscription rows
 * @param now - Comparison instant in milliseconds since epoch
 * @returns Current subscription, or undefined when none cover `now`
 * @example
 * getCurrentSubscription(rows)
 * // active row whose expireAt is furthest in the future
 */
export function getCurrentSubscription(
  subscriptions: readonly Subscription[],
  now = Date.now()
): Subscription | undefined {
  return [...subscriptions]
    .filter(
      (item) =>
        item.isActive &&
        new Date(item.startDate).getTime() <= now &&
        new Date(item.expireAt).getTime() > now
    )
    .sort(
      (left, right) =>
        new Date(right.expireAt).getTime() - new Date(left.expireAt).getTime()
    )[0]
}
