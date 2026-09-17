/**
 * "Is this order still in flight?" for an orders-LIST row — the one question
 * an order-history screen asks of every row it renders (`mw-3-1`).
 *
 * **Deliberately two buckets, not mobile's seven.**
 * `mobile-tenant-app`'s `mapOrderStatusToFilterTab.ts` answers a different
 * question — which of seven segment tabs a row belongs to — and answers it
 * differently per brand, through `getBrand()`. `mw-4-3` left it unextracted
 * for exactly that reason. This module is the brand-independent half both
 * surfaces agree on: terminal or not.
 *
 * **The terminal set is closed; everything else is active.** Defining it the
 * other way round would mean a status this build has never heard of — the
 * backend's `status` enum is not a published contract (ledger M-045) — is
 * silently filed under Past, where a customer with an order in flight would
 * never see it. An unknown status showing up in Active is visible and wrong;
 * one hidden in Past is invisible and wrong.
 */

/**
 * The statuses an order never leaves. Both `cancelled` spellings are here:
 * `list-types.ts`'s union carries the British and American forms because the
 * backend has sent both, and a bucket that knew only one would leave half the
 * cancelled orders sitting in Active forever.
 */
const PAST_ORDER_STATUSES: ReadonlySet<string> = new Set([
  "canceled",
  "cancelled",
  "completed",
  "rejected"
])

/**
 * The one spelling every consumer compares against: trimmed, lower-cased, and
 * `""` for anything that is not a usable string.
 *
 * Exported because the SAME normalisation has to happen wherever a status is
 * keyed or labelled, not just where it is bucketed. A card that buckets
 * `"COMPLETED"` into Past through {@link isActiveOrderStatus} and then indexes
 * its badge tone and its copy label with the raw value renders an untoned
 * badge reading literal `COMPLETED` — correct placement, broken presentation.
 * One normalizer, used on every path.
 * @param status - The row's `status` field, exactly as received
 * @returns The comparable form, or `""` when there is no usable status
 * @example normalizeOrderStatus("  COMPLETED ") // -> "completed"
 * @example normalizeOrderStatus(undefined) // -> ""
 */
export function normalizeOrderStatus(
  status: string | null | undefined
): string {
  return typeof status === "string" ? status.trim().toLowerCase() : ""
}

/**
 * Whether an orders-list row is still in flight.
 *
 * Absent, blank and unrecognised statuses are all **active**, per the closed
 * -terminal-set rule above. Comparison is case- and whitespace-insensitive
 * because these wire fields are ported verbatim and unvalidated
 * (`list-types.ts`'s own docblock).
 * @param status - The row's `status` field, exactly as received
 * @returns `true` while the order can still change, `false` once it cannot
 * @example isActiveOrderStatus("preparing") // -> true
 * @example isActiveOrderStatus("canceled") // -> false
 */
export function isActiveOrderStatus(
  status: string | null | undefined
): boolean {
  return !PAST_ORDER_STATUSES.has(normalizeOrderStatus(status))
}

/** One page of orders, split into the two sections a history screen renders. */
export interface OrdersByActivity<TOrder> {
  /** Rows still in flight, in the order they arrived. */
  readonly active: readonly TOrder[]
  /** Rows that have reached a terminal status, in the order they arrived. */
  readonly past: readonly TOrder[]
}

/**
 * Splits orders-list rows into the Active and Past sections.
 *
 * Relative order is preserved inside each bucket, so the caller's sort — the
 * backend's newest-first ordering — survives the split untouched.
 * @param orders - The rows to split, in the order they should render
 * @returns The two buckets; either may be empty
 * @example splitOrdersByActivity([{ status: "ready" }, { status: "completed" }])
 * // -> { active: [{ status: "ready" }], past: [{ status: "completed" }] }
 */
export function splitOrdersByActivity<
  TOrder extends { readonly status?: string | null }
>(orders: readonly TOrder[]): OrdersByActivity<TOrder> {
  const active: TOrder[] = []
  const past: TOrder[] = []

  for (const order of orders) {
    if (isActiveOrderStatus(order.status)) {
      active.push(order)
    } else {
      past.push(order)
    }
  }

  return { active, past }
}

/**
 * Whether a paged orders list has another page after the one just received.
 *
 * `mobile-tenant-app`'s `hasMoreOrderPages`
 * (`features/orders/screens/OrdersTabContent.tsx`) copied verbatim in
 * behaviour, because getting this wrong strands a customer's orders behind a
 * button that has already disappeared, and two apps disagreeing about it is
 * the kind of bug nobody reproduces.
 *
 * **`page` is ZERO-indexed**, which is the upstream's own convention:
 * `business-discovery-backend`'s `PAGINATION.DEFAULT_PAGE`/`MIN_PAGE` are both
 * `0` and `listOrders` applies `.offset(page * limit)`, so page 0 is the first
 * page and asking for page 1 first silently skips `limit` rows.
 *
 * `total` is preferred over the row count whenever the answer stated one: the
 * count is what the CALLER ended up with, which is not the same number once
 * unusable rows have been dropped, and a single malformed row in a full page
 * would otherwise read as a short page and hide the button for good.
 * @param page - The zero-indexed page just received
 * @param limit - Rows per page, as requested or as the answer stated
 * @param pageItemCount - How many rows that page carried, before any filtering
 * @param total - The upstream's total row count, when it stated one
 * @returns Whether another page exists
 * @example hasMoreOrderPages(0, 10, 10, 25) // -> true
 * @example hasMoreOrderPages(2, 10, 5, 25) // -> false
 */
export function hasMoreOrderPages(
  page: number,
  limit: number,
  pageItemCount: number,
  total?: number | null
): boolean {
  if (total !== null && total !== undefined && total >= 0) {
    return (page + 1) * limit < total
  }

  return pageItemCount >= limit
}
