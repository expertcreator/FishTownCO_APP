import { CASH_DRAWERS_API } from "./constants"
import type { CashDrawersHttp } from "./http"
import type {
  CashDrawerDetail,
  CashDrawerDetailParams,
  CashDrawersListParams,
  CashDrawersResponse,
  CashEntriesListParams,
  CashEntriesResponse,
  CashSummary,
  CashSummaryParams,
  CreateCashEntryBody,
  CreateCashEntryResponse
} from "./types"

/**
 * Builds query-string fields for GET /cash-entries.
 * @param args - List filters plus page/limit
 * @returns String search params
 */
export function buildCashEntriesSearchParams(
  args: CashEntriesListParams
): Record<string, string> {
  return {
    branchId: args.branchId,
    ...(args.from ? { from: args.from } : {}),
    ...(args.to ? { to: args.to } : {}),
    ...(args.businessFrom ? { businessFrom: args.businessFrom } : {}),
    ...(args.businessTo ? { businessTo: args.businessTo } : {}),
    ...(args.direction ? { direction: args.direction } : {}),
    ...(args.category ? { category: args.category } : {}),
    ...(args.recordedBy ? { recordedBy: args.recordedBy } : {}),
    ...(args.cashDrawerId ? { cashDrawerId: args.cashDrawerId } : {}),
    ...(args.includeDeleted ? { includeDeleted: "true" } : {}),
    page: String(args.page),
    limit: String(args.limit)
  }
}

/**
 * Lists cash entries for a branch and date range.
 * @param http - Injected HTTP client
 * @param args - List filters plus page/limit
 * @returns GET /cash-entries 200 body
 */
export function listCashEntries(
  http: CashDrawersHttp,
  args: CashEntriesListParams
): Promise<CashEntriesResponse> {
  return http.get<CashEntriesResponse>(
    CASH_DRAWERS_API.entries,
    buildCashEntriesSearchParams(args)
  )
}

/**
 * Builds query-string fields for GET /cash-summary.
 * @param args - Drawer id, or branch plus `businessDate` or `from`/`to`
 * @returns String search params
 */
export function buildCashSummarySearchParams(
  args: CashSummaryParams
): Record<string, string> {
  if ("cashDrawerId" in args) {
    return { cashDrawerId: args.cashDrawerId }
  }
  if ("businessDate" in args) {
    return { branchId: args.branchId, date: args.businessDate }
  }
  return { branchId: args.branchId, from: args.from, to: args.to }
}

/**
 * Loads the cash summary for a business day, window, or drawer.
 * @param http - Injected HTTP client
 * @param args - Drawer id, or branch plus `businessDate` or `from`/`to`
 * @returns GET /cash-summary 200 body
 */
export function getCashSummary(
  http: CashDrawersHttp,
  args: CashSummaryParams
): Promise<CashSummary> {
  return http.get<CashSummary>(
    CASH_DRAWERS_API.summary,
    buildCashSummarySearchParams(args)
  )
}

/**
 * Lists frozen cash-drawer days for a branch range.
 * @param http - Injected HTTP client
 * @param args - Branch, range, and pagination
 * @returns GET /cash-drawers 200 body
 */
export function listCashDrawers(
  http: CashDrawersHttp,
  args: CashDrawersListParams
): Promise<CashDrawersResponse> {
  return http.get<CashDrawersResponse>(CASH_DRAWERS_API.drawers, {
    branchId: args.branchId,
    from: args.from,
    to: args.to,
    page: String(args.page),
    limit: String(args.limit)
  })
}

/**
 * Loads one cash drawer day plus a page of its entries.
 * @param http - Injected HTTP client
 * @param args - Drawer id and entry pagination
 * @returns GET /cash-drawers/:id 200 body
 */
export function getCashDrawerDetail(
  http: CashDrawersHttp,
  args: CashDrawerDetailParams
): Promise<CashDrawerDetail> {
  return http.get<CashDrawerDetail>(CASH_DRAWERS_API.drawer(args.drawerId), {
    page: String(args.page),
    limit: String(args.pageSize)
  })
}

/**
 * Creates a cash in/out entry. Does not send `cashDrawerId` or `affectsPnl`.
 * @param http - Injected HTTP client
 * @param payload - Create body
 * @returns POST /cash-entries 201 body
 */
export function createCashEntry(
  http: CashDrawersHttp,
  payload: CreateCashEntryBody
): Promise<CreateCashEntryResponse> {
  return http.post<CreateCashEntryResponse, CreateCashEntryBody>(
    CASH_DRAWERS_API.entries,
    payload
  )
}

/**
 * Soft-deletes a cash entry.
 * @param http - Injected HTTP client
 * @param entryId - Entry identifier
 * @returns Resolves after DELETE /cash-entries/:id 204
 */
export function deleteCashEntry(
  http: CashDrawersHttp,
  entryId: string
): Promise<void> {
  return http.delete(CASH_DRAWERS_API.entry(entryId))
}
