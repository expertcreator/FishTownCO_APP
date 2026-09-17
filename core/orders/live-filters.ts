import { SELL_LIVE_DEFAULT_FETCH_STATUSES } from "@/core/pos-orders"

/**
 * Column filter pair accepted by GET `/orders/admin`.
 */
export interface AdminOrderColumnFilter {
  id: string
  value: unknown
}

/**
 * Search and facet values for the live order board.
 */
export interface SellLiveFilterState {
  search: string
  orderStatus: string[]
  orderType: string[]
  paymentStatus: string[]
  orderFrom: string[]
}

export const EMPTY_SELL_LIVE_FILTERS: SellLiveFilterState = {
  search: "",
  orderStatus: [],
  orderType: [],
  paymentStatus: [],
  orderFrom: []
}

/**
 * Whether any live-board search or facet is active.
 * @param filters - Current live-board filters
 * @returns `true` when search or any facet has a value
 */
export function sellLiveHasActiveFilters(
  filters: SellLiveFilterState
): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.orderStatus.length > 0 ||
    filters.orderType.length > 0 ||
    filters.paymentStatus.length > 0 ||
    filters.orderFrom.length > 0
  )
}

/**
 * Adds or removes a facet value from a live-board filter list.
 * @param values - Currently selected values
 * @param value - Value to toggle
 * @returns Next selected values
 */
export function toggleSellLiveFilterValue(
  values: string[],
  value: string
): string[] {
  const index = values.indexOf(value)
  if (index === -1) {
    return [...values, value]
  }

  return values.filter((entry) => entry !== value)
}

/**
 * Builds admin-list column filters for the live board query.
 * When no status chip is selected, fetches kitchen-active statuses only.
 * @param branchId - Selected branch, if any
 * @param filters - Live-board facets
 * @returns Column filters for `listAdminOrders`
 */
export function buildSellLiveColumnFilters(
  branchId: string,
  filters: SellLiveFilterState
): AdminOrderColumnFilter[] {
  const columnFilters: AdminOrderColumnFilter[] = []

  if (branchId) {
    columnFilters.push({ id: "branchId", value: branchId })
  }
  if (filters.orderStatus.length > 0) {
    columnFilters.push({ id: "orderStatus", value: filters.orderStatus })
  } else {
    columnFilters.push({
      id: "orderStatus",
      value: [...SELL_LIVE_DEFAULT_FETCH_STATUSES]
    })
  }
  if (filters.orderType.length > 0) {
    columnFilters.push({ id: "orderType", value: filters.orderType })
  }
  if (filters.paymentStatus.length > 0) {
    columnFilters.push({ id: "paymentStatus", value: filters.paymentStatus })
  }
  if (filters.orderFrom.length > 0) {
    columnFilters.push({ id: "orderFrom", value: filters.orderFrom })
  }

  return columnFilters
}

/**
 * Whether the live query should also load completed unpaid tickets.
 * Skips that request when facets already exclude completed or pending.
 * @param filters - Live-board facets
 * @returns `true` when unpaid completed tickets belong on the board
 */
export function shouldIncludeUnpaidCompletedOnSellLive(
  filters: SellLiveFilterState
): boolean {
  if (
    filters.orderStatus.length > 0 &&
    !filters.orderStatus.includes("completed")
  ) {
    return false
  }
  if (
    filters.paymentStatus.length > 0 &&
    !filters.paymentStatus.includes("pending")
  ) {
    return false
  }
  return true
}

/**
 * Builds admin-list column filters for completed tickets that are still unpaid.
 * @param branchId - Selected branch, if any
 * @param filters - Live-board facets to keep type/origin in sync
 * @returns Column filters for `listAdminOrders`
 */
export function buildSellLiveUnpaidCompletedColumnFilters(
  branchId: string,
  filters: SellLiveFilterState = EMPTY_SELL_LIVE_FILTERS
): AdminOrderColumnFilter[] {
  const columnFilters: AdminOrderColumnFilter[] = [
    { id: "orderStatus", value: ["completed"] },
    { id: "paymentStatus", value: ["pending"] }
  ]

  if (branchId) {
    columnFilters.push({ id: "branchId", value: branchId })
  }
  if (filters.orderType.length > 0) {
    columnFilters.push({ id: "orderType", value: filters.orderType })
  }
  if (filters.orderFrom.length > 0) {
    columnFilters.push({ id: "orderFrom", value: filters.orderFrom })
  }

  return columnFilters
}

/**
 * Puts unpaid completed tickets onto the first live page without duplicating ids.
 * @param input - Kitchen page plus unpaid completed rows
 * @param input.kitchenPage - Paginated kitchen-active rows
 * @param input.unpaidCompleted - Completed tickets with payment pending
 * @param input.pageIndex - Current infinite-query page
 * @returns Merged page for the live board
 */
export function mergeUnpaidCompletedIntoLivePage<
  TOrder extends { id: string; createdAt?: string | null }
>(input: {
  kitchenPage: { data: TOrder[]; total: number }
  unpaidCompleted: TOrder[]
  pageIndex: number
}): { data: TOrder[]; total: number } {
  const kitchenIds = new Set(input.kitchenPage.data.map((order) => order.id))
  const extraUnpaid = input.unpaidCompleted.filter(
    (order) => !kitchenIds.has(order.id)
  )
  const total = input.kitchenPage.total + extraUnpaid.length

  if (input.pageIndex !== 0 || extraUnpaid.length === 0) {
    return {
      data: input.kitchenPage.data,
      total
    }
  }

  const data = [...extraUnpaid, ...input.kitchenPage.data].sort((left, right) =>
    String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? ""))
  )

  return {
    data,
    total
  }
}
