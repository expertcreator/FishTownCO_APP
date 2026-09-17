import {
  CASH_ENTRY_LINKED_USER_CATEGORIES,
  type CashEntryCategory
} from "@/constants"

/**
 * Restaurant-admin cash-drawer API paths (no leading slash).
 * @example
 * CASH_DRAWERS_API.drawer("abc")
 * // "cash-drawers/abc"
 */
export const CASH_DRAWERS_API = {
  entries: "cash-entries",
  summary: "cash-summary",
  drawers: "cash-drawers",
  /**
   * Builds GET/DELETE path for one cash drawer.
   * @param drawerId - Drawer identifier
   * @returns Encoded `cash-drawers/:id` path
   */
  drawer: (drawerId: string) => `cash-drawers/${encodeURIComponent(drawerId)}`,
  /**
   * Builds DELETE path for one cash entry.
   * @param entryId - Entry identifier
   * @returns Encoded `cash-entries/:id` path
   */
  entry: (entryId: string) => `cash-entries/${encodeURIComponent(entryId)}`
} as const

/** Sole currency the cash-entry create schema accepts. */
export const CASH_CURRENCY = "PKR" as const

/**
 * `salesByMethod` key for Fishtownco / platform-rider tickets.
 * Those orders stay stored as COD `cash`, but the restaurant does not
 * receive the money in the drawer — Fishtownco settles it later.
 */
export const PLATFORM_RIDER_SALE_CHANNEL = "platform_rider" as const

/**
 * Whether a cash-summary sale key is the Fishtownco rider settlement channel.
 * @param key - `salesByMethod` key from GET /cash-summary
 * @returns True when the key is `platform_rider`
 */
export function isPlatformRiderSaleChannel(
  key: string
): key is typeof PLATFORM_RIDER_SALE_CHANNEL {
  return key === PLATFORM_RIDER_SALE_CHANNEL
}

export const cashCategoryLabelKeys = {
  owner_cash_in: "cash-category-owner-cash-in",
  float_added: "cash-category-float-added",
  cash_in_misc: "cash-category-cash-in-misc",
  supplier_payment: "cash-category-supplier-payment",
  debt_returned: "cash-category-debt-returned",
  expense_misc: "cash-category-expense-misc",
  owner_cash_out: "cash-category-owner-cash-out",
  bank_deposit: "cash-category-bank-deposit",
  staff_advance: "cash-category-staff-advance",
  correction: "cash-category-correction"
} as const satisfies Record<CashEntryCategory, string>

export const CASH_DRAWER_IN_CATEGORY = "float_added" as const

export const CASH_DRAWER_KEYPAD_MAX_DIGITS = 7

export const CASH_DRAWER_KEYPAD_KEYS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "00",
  "0",
  "back"
] as const

export const CASH_DRAWER_OCCURRENCE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000

export const NON_DRAWER_PAYMENT_METHOD = "other"

/** Approved D12 chip order: spending before transfers. */
export const CASH_DRAWER_OUT_OPTIONS = [
  {
    labelKey: "category.paid-a-supplier",
    category: "supplier_payment",
    showWagesDisclosure: false
  },
  {
    labelKey: "category.shop-expense",
    category: "expense_misc",
    showWagesDisclosure: false
  },
  {
    labelKey: "category.debt-returned",
    category: "debt_returned",
    showWagesDisclosure: false
  },
  {
    labelKey: "category.staff-advance",
    category: "staff_advance",
    showWagesDisclosure: true
  },
  {
    labelKey: "category.money-to-the-bank",
    category: "bank_deposit",
    showWagesDisclosure: false
  },
  {
    labelKey: "category.owner-took-cash",
    category: "owner_cash_out",
    showWagesDisclosure: false
  },
  {
    labelKey: "category.something-else-out",
    category: "correction",
    showWagesDisclosure: false
  }
] as const satisfies ReadonlyArray<{
  labelKey: string
  category: CashEntryCategory
  showWagesDisclosure: boolean
}>

/** Categories that persist `relatedUserId` on create. */
export const CASH_LINKED_USER_CATEGORIES = CASH_ENTRY_LINKED_USER_CATEGORIES

/**
 * Whether a cash-out category must include a related staff user.
 * @param category - Canonical category
 * @returns True when the create payload must send `relatedUserId`
 */
export function cashCategoryRequiresRelatedUser(category: CashEntryCategory) {
  return (
    CASH_ENTRY_LINKED_USER_CATEGORIES as readonly CashEntryCategory[]
  ).includes(category)
}

/**
 * Resolves a cash-entry category to a translation key, then to a label.
 * @param category - Canonical category
 * @param translate - App translator
 * @returns Localized category label
 * @throws {Error} If the category is unknown
 * @example
 * getCashCategoryLabel("float_added", (key) => key)
 * // "cash-category-float-added"
 */
export function getCashCategoryLabel(
  category: CashEntryCategory,
  translate: (key: string) => string
) {
  const key = cashCategoryLabelKeys[category]
  if (!key) {
    throw new Error(`Unknown cash entry category: ${String(category)}`)
  }
  return translate(key)
}
