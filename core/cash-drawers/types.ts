import type { CashEntryCategory, PaymentMethod } from "@/constants"
import type {
  CASH_CURRENCY,
  CASH_DRAWER_KEYPAD_KEYS,
  NON_DRAWER_PAYMENT_METHOD,
  PLATFORM_RIDER_SALE_CHANNEL
} from "./constants"

export type { CashEntryCategory } from "@/constants"

export type CashEntryDirection = "in" | "out"

export type CashDrawerKeypadKey = (typeof CASH_DRAWER_KEYPAD_KEYS)[number]

export type CashPaymentMethod = PaymentMethod

/** Payment method, or Fishtownco rider settlement (`platform_rider`). */
export type CashSaleChannel =
  | CashPaymentMethod
  | typeof PLATFORM_RIDER_SALE_CHANNEL

export type CashCurrency = typeof CASH_CURRENCY

/**
 * Create-body payment method. Includes the client-only `other` marker used when
 * a cash-out does not affect the drawer (`NON_DRAWER_PAYMENT_METHOD`).
 */
export type CashCreatePaymentMethod =
  | CashPaymentMethod
  | typeof NON_DRAWER_PAYMENT_METHOD

/**
 * Translator for cash-drawer copy. Apps bind this to their i18n layer.
 * @param key - Message key
 * @param values - Optional interpolation values
 * @returns Localized string
 */
export type CashDrawerTranslate = (
  key: string,
  values?: Record<string, string | number>
) => string

export interface CashAmountCount {
  amount: string
  count: number
}

export interface CashSalesByMethodAmount extends CashAmountCount {
  key: CashSaleChannel
}

export interface CashMovedAmount extends CashAmountCount {
  key: CashEntryCategory
}

export type CashItemisedAmount = CashSalesByMethodAmount | CashMovedAmount

export interface CashEntryTotals {
  cashSales: CashAmountCount
  cashIn: CashAmountCount
  cashOut: CashAmountCount
  refundsCash: CashAmountCount
  expectedCash: CashAmountCount
  salesByMethod: CashSalesByMethodAmount[]
  earned: CashAmountCount
  spent: CashAmountCount
  moved: CashMovedAmount[]
}

/** GET /cash-summary, GET /cash-drawers row, and drawer-detail headline figures. */
export interface CashSummary extends CashEntryTotals {
  cashDrawerId: string
  businessDate: string
  windowStart: string
  windowEnd: string
  timezone: string
  asOf: string
}

export type CashDrawer = CashSummary

/**
 * Row returned by POST /cash-entries (201) and nested under GET /cash-drawers/:id.
 * Dates are ISO-8601 strings on the wire.
 */
export interface CashEntry {
  id: string
  branchId: string
  cashDrawerId: string
  direction: CashEntryDirection
  category: CashEntryCategory
  amount: string
  currency: string
  paymentMethod: CashPaymentMethod
  affectsDrawer: boolean
  affectsPnl: boolean
  relatedUserId: string | null
  sourceDeviceId: string | null
  note: string | null
  occurredAt: string
  createdBy: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

/** GET /cash-entries row: DB entry plus list-only attribution fields. */
export interface CashEntryListItem extends CashEntry {
  recordedByName: string | null
  relatedUserName: string | null
  deletedBy: string | null
  deletedByName: string | null
}

export interface CashPage<TItem> {
  data: TItem[]
  page: number
  limit: number
  total: number
  totalPages: number
}

/** GET /cash-entries 200. */
export interface CashEntriesResponse extends CashPage<CashEntryListItem> {
  totals: CashEntryTotals
}

/** GET /cash-drawers 200. */
export type CashDrawersResponse = CashPage<CashDrawer>

/** GET /cash-drawers/:id 200. Nested entries have no `totals`. */
export interface CashDrawerDetail extends CashSummary {
  entries: CashPage<CashEntry>
}

/** POST /cash-entries 201. */
export type CreateCashEntryResponse = CashEntry

export interface CashEntriesListParams {
  branchId: string
  from?: string
  to?: string
  businessFrom?: string
  businessTo?: string
  direction?: CashEntryDirection
  category?: CashEntryCategory
  recordedBy?: string
  cashDrawerId?: string
  includeDeleted?: boolean
  page: number
  limit: number
}

export type CashSummaryParams =
  | { cashDrawerId: string }
  | { branchId: string; businessDate: string }
  | { branchId: string; from: string; to: string }

export interface CashDrawersListParams {
  branchId: string
  from: string
  to: string
  page: number
  limit: number
}

export interface CashDrawerDetailParams {
  drawerId: string
  page: number
  pageSize: number
}

export interface CashDrawerOutOption {
  labelKey: string
  category: CashEntryCategory
  showWagesDisclosure: boolean
}

/** POST /cash-entries body. `cashDrawerId` and `affectsPnl` are server-owned. */
export interface CreateCashEntryBody {
  branchId: string
  direction: CashEntryDirection
  category: CashEntryCategory
  amount: string
  currency?: CashCurrency
  paymentMethod?: CashCreatePaymentMethod
  affectsDrawer: boolean
  relatedUserId?: string | null
  sourceDeviceId?: string | null
  note?: string | null
  occurredAt?: string
}

export interface CashDrawerEntryValidationErrors {
  amount?: string
  category?: string
  occurredAt?: string
  paymentMethod?: string
  relatedUserId?: string
}
