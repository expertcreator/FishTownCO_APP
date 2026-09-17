// biome-ignore-all lint/style/useConsistentTypeDefinitions: verbatim copy from mobile-tenant-app (mw-4-3) — rewriting these to `interface` is an UNSAFE fix that breaks the token-equivalence AC, and interfaces get no implicit index signature. Suppressed in-file so it travels to every app that mounts core.
/**
 * Order-detail line extraction for cancel/reject modals (`mw-4-3`, copied
 * verbatim from `mobile-tenant-app`'s `features/orders/utils/orderModalLineItems.ts`).
 *
 * Every reader here tolerates both `orderDetail.data.items` and a flat
 * `orderDetail.items`, because the endpoint's wrapper depth is not stable.
 * Price formatting is injected — core owns no currency formatter.
 */

import { getLocalizedValue } from "@/core/i18n"
import type { GetOrderDetailResponse, OrderDetailItem } from "./types"

function lineDisplayName(line: OrderDetailItem, language: string): string {
  const n = line.productName
  if (!n) {
    return ""
  }
  if (typeof n === "string") {
    return n
  }
  return getLocalizedValue(n, language)
}

/**
 * Main product names from order detail (same lines as Order details UI; skips addons).
 *
 * Add-on rows and soft-deleted rows are both dropped, so the list matches what
 * the customer sees on the detail screen rather than what the payload contains.
 * @param orderDetail - Order-detail response, wrapped or flat
 * @param language - Active locale for localized product names
 * @returns Trimmed, non-empty product names in payload order
 */
export function getMainProductNamesFromOrderDetail(
  orderDetail: GetOrderDetailResponse | undefined,
  language: string
): string[] {
  if (!orderDetail) {
    return []
  }
  const raw = orderDetail.data?.items ?? orderDetail.items ?? []
  return raw
    .filter((line) => !(line.isAddon || line.deletedAt))
    .map((line) => lineDisplayName(line, language).trim())
    .filter(Boolean)
}

/**
 * Comma-separated product names for cancel/reject modals (excludes addon-only rows).
 * @param orderDetail - Order-detail response, wrapped or flat
 * @param language - Active locale for localized product names
 * @returns One label for the modal, or `""` when there are no main lines
 */
export function formatOrderItemsLabelFromDetail(
  orderDetail: GetOrderDetailResponse | undefined,
  language: string
): string {
  const names = getMainProductNamesFromOrderDetail(orderDetail, language)
  if (names.length === 0) {
    return ""
  }
  if (names.length === 1) {
    return names[0] ?? ""
  }
  return names.join(", ")
}

/**
 * First main line image for the modal thumbnail.
 *
 * Soft-deleted lines are NOT skipped here, unlike the name readers above — the
 * thumbnail follows the first non-addon row whatever its state.
 * @param orderDetail - Order-detail response, wrapped or flat
 * @returns The image URL, or `undefined` when no main line carries one
 */
export function getFirstMainLineImageFromDetail(
  orderDetail: GetOrderDetailResponse | undefined
): string | undefined {
  if (!orderDetail) {
    return
  }
  const raw = orderDetail.data?.items ?? orderDetail.items ?? []
  const main = raw.find((line) => !line.isAddon)
  return main?.product?.images?.[0]
}

/** One rendered row of a cancel/reject modal's item list. */
export type OrderModalLineItem = {
  id: string
  name: string
  quantity: number
  /** Pre-formatted line subtotal (same currency as order list). */
  priceLabel: string
  imageUri?: string
}

/**
 * One row per main product line for cancel/reject modals (excludes addon-only rows).
 *
 * A line whose name resolves to nothing falls back to an em dash rather than an
 * empty cell, and an unparseable subtotal falls back to `0` rather than `NaN`.
 * Currency formatting is injected because core owns no currency table.
 * @param orderDetail - Order-detail response, wrapped or flat
 * @param language - Active locale for localized product names
 * @param formatPrice - Formats an amount into the order's display currency
 * @returns One row per main line, or `[]` when there is no order
 */
export function buildMainLineItemsForModal(
  orderDetail: GetOrderDetailResponse | undefined,
  language: string,
  formatPrice: (amount: number) => string
): OrderModalLineItem[] {
  if (!orderDetail) {
    return []
  }
  const raw = orderDetail.data?.items ?? orderDetail.items ?? []
  const mainLines = raw.filter((line) => !line.isAddon)
  return mainLines.map((line) => {
    const name = lineDisplayName(line, language).trim() || "—"
    const subtotal = Number.parseFloat(String(line.subtotal)) || 0
    return {
      id: line.id,
      name,
      quantity: line.quantity,
      priceLabel: formatPrice(subtotal),
      imageUri: line.product?.images?.[0]
    }
  })
}
