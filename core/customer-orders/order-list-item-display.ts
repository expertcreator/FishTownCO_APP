/**
 * Orders-list row display decisions (`mw-4-3`, copied verbatim from
 * `mobile-tenant-app`'s `features/orders/utils/orderListItemDisplay.ts`).
 *
 * Deal detection is a long fallback chain rather than one field because the list
 * endpoint has flagged deals five different ways over time and old orders keep
 * their old shape forever. The last resort is a heuristic on name and missing
 * image; it is deliberate, not a leftover.
 */

import type { OrderItem } from "./list-types"
import { getLocalizedValue } from "@/core/i18n"

type UnknownRecord = Record<string, unknown>

type OrderListDealFields = Pick<
  OrderItem,
  | "firstItemIsDeal"
  | "firstItemDealId"
  | "dealId"
  | "items"
  | "firstItemImage"
  | "firstItemName"
> &
  UnknownRecord

function asRecord(value: unknown): UnknownRecord | undefined {
  if (!value || typeof value !== "object") {
    return
  }
  return value as UnknownRecord
}

function readTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function isDealVariantDetails(value: unknown): boolean {
  return asRecord(value)?.type === "deal"
}

function lineIsDeal(line: unknown): boolean {
  const row = asRecord(line)
  if (!row || row.isDeleted === true) {
    return false
  }
  if (readTrimmedString(row.dealId)) {
    return true
  }
  if (isDealVariantDetails(row.variantDetails)) {
    return true
  }
  return row.isDeal === true
}

function localizedFirstItemNames(
  firstItemName: OrderItem["firstItemName"]
): string[] {
  if (!firstItemName) {
    return []
  }
  if (typeof firstItemName === "string") {
    return [firstItemName.trim()].filter(Boolean)
  }
  return Object.values(firstItemName)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean)
}

function nameLooksLikeDeal(firstItemName: OrderItem["firstItemName"]): boolean {
  return localizedFirstItemNames(firstItemName).some((name) =>
    // Kept inline as a verbatim copy from mobile-tenant-app (mw-4-3); hoisting
    // the literal would break the token-equivalence acceptance criteria.
    /\bdeal\b/i.test(name)
  )
}

function isMissingFirstItemImage(
  firstItemImage: OrderItem["firstItemImage"]
): boolean {
  if (firstItemImage == null) {
    return true
  }
  if (typeof firstItemImage === "string") {
    return firstItemImage.trim().length === 0
  }
  return false
}

/** List API fallback: deal lines ship without `firstItemImage` and often include "deal" in the name. */
function isOrdersListItemDealFromListApi(
  order: Pick<OrderItem, "firstItemImage" | "firstItemName">
): boolean {
  if (!isMissingFirstItemImage(order.firstItemImage)) {
    return false
  }
  return nameLooksLikeDeal(order.firstItemName)
}

/**
 * Whether an orders-list row should render as a deal rather than a product.
 *
 * Nine checks in priority order: explicit flags, then deal ids at row, first-item
 * and line level, then `type` / `lineType` strings, then a `variantDetails.type`
 * of `"deal"`, then any non-deleted line that looks like a deal. Only if all of
 * those miss does it fall back to the list-API heuristic — a missing
 * `firstItemImage` together with "deal" in the name — because that endpoint omits
 * the image for deals and has never carried a flag for them.
 * @param order - An orders-list row; unknown extra fields are read defensively
 * @returns `true` when the row represents a deal
 */
export function isOrdersListItemDeal(order: OrderListDealFields): boolean {
  if (order.firstItemIsDeal === true) {
    return true
  }
  if (readTrimmedString(order.firstItemDealId)) {
    return true
  }
  if (readTrimmedString(order.dealId)) {
    return true
  }
  if (order.isDeal === true) {
    return true
  }
  if (readTrimmedString(order.firstItemType)?.toLowerCase() === "deal") {
    return true
  }
  if (readTrimmedString(order.firstItemLineType)?.toLowerCase() === "deal") {
    return true
  }
  if (isDealVariantDetails(order.firstItemVariantDetails)) {
    return true
  }

  const firstItem = asRecord(order.firstItem)
  if (readTrimmedString(firstItem?.dealId)) {
    return true
  }
  if (firstItem?.isDeal === true) {
    return true
  }
  if (isDealVariantDetails(firstItem?.variantDetails)) {
    return true
  }

  const lines = Array.isArray(order.items) ? order.items : []
  if (lines.some(lineIsDeal)) {
    return true
  }

  return isOrdersListItemDealFromListApi(order)
}

/**
 * The first line's product name for an orders-list row.
 *
 * The field arrives either already flattened to a string or as a localized
 * record, depending on endpoint version; a record goes through `@/core/i18n`'s
 * fallback chain, so a locale with no translation still reads something.
 * @param order - An orders-list row carrying `firstItemName`
 * @param locale - Active locale, with or without a region subtag
 * @returns The trimmed name, or `""` when the row carries none
 */
export function getOrdersListFirstItemName(
  order: Pick<OrderItem, "firstItemName">,
  locale: string
): string {
  if (!order.firstItemName) {
    return ""
  }
  if (typeof order.firstItemName === "string") {
    return order.firstItemName.trim()
  }
  return getLocalizedValue(order.firstItemName, locale).trim()
}
