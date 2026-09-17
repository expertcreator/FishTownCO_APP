/**
 * Money readers for customer order-detail payloads (`mw-4-3`, copied verbatim
 * from `mobile-tenant-app`'s `features/orders/utils/orderDetailPricing.ts`).
 *
 * This module parses money that has already been calculated elsewhere. It does
 * no arithmetic and must never grow any: `calculatePricing` in `@/constants` is
 * the one pricing engine, pinned by all five backends.
 */

import type { GetOrderDetailResponse } from "./types"

/** Normalize money fields from API (number | string | nested pricing). */

/**
 * Coerces a money field of unknown shape to a finite number.
 *
 * Every non-numeric outcome collapses to `0` rather than to `NaN`, including a
 * string that does not parse. That is the load-bearing part: a `NaN` reaching a
 * total renders as "NaN" on a receipt, while a `0` renders as a missing fee.
 * @param raw - A money field straight off a payload: number, string, or neither
 * @returns The parsed amount, or `0` for anything unparseable
 * @example parseMoneyValue("12.50") // -> 12.5
 * @example parseMoneyValue("abc") // -> 0
 */
export function parseMoneyValue(raw: unknown): number {
  if (raw == null) {
    return 0
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw
  }
  if (typeof raw === "string") {
    const n = Number.parseFloat(raw.trim())
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

/**
 * Reads platform fee from GET order detail responses regardless of wrapper shape:
 * `{ success, data: payload }`, flat payload, optional nested `data`, `pricing`, or `platform_fee`.
 *
 * Four candidate keys are probed at each of up to three nesting layers, and the
 * FIRST strictly-positive one wins. A zero therefore never short-circuits the
 * search — which is what lets a real fee two layers down beat a `0` written at
 * the top — and an order that genuinely carries no platform fee falls all the
 * way through to `0`.
 * @param orderDetail - A GET order-detail response in any of its wrapper shapes
 * @returns The platform fee, or `0` when no layer carries a positive one
 * @example readPlatformFeeFromOrderDetail({ data: { pricing: { platform_fee: "12.50" } } }) // -> 12.5
 */
export function readPlatformFeeFromOrderDetail(orderDetail: unknown): number {
  return readFirstPositiveMoney(orderDetail, ["platformFee", "platform_fee"])
}

function collectPayloadLayers(orderDetail: unknown): Record<string, unknown>[] {
  if (orderDetail == null || typeof orderDetail !== "object") {
    return []
  }
  const r = orderDetail as Record<string, unknown>
  const layers: Record<string, unknown>[] = [r]

  if ("data" in r && r.data && typeof r.data === "object") {
    const inner = r.data as Record<string, unknown>
    layers.push(inner)
    if ("data" in inner && inner.data && typeof inner.data === "object") {
      layers.push(inner.data as Record<string, unknown>)
    }
  }
  return layers
}

function readFirstPositiveMoney(orderDetail: unknown, keys: string[]): number {
  for (const layer of collectPayloadLayers(orderDetail)) {
    const pricing = layer.pricing as Record<string, unknown> | undefined
    const candidates = [
      ...keys.map((key) => layer[key]),
      ...keys.map((key) => pricing?.[key])
    ]
    for (const candidate of candidates) {
      const n = parseMoneyValue(candidate)
      if (n > 0) {
        return n
      }
    }
  }
  return 0
}

function hasFreeDeliveryFlag(orderDetail: unknown): boolean {
  for (const layer of collectPayloadLayers(orderDetail)) {
    const pricing = layer.pricing as Record<string, unknown> | undefined
    if (layer.freeDelivery === true || pricing?.freeDelivery === true) {
      return true
    }
  }
  return false
}

/** Every money line of an order detail, already resolved to numbers. */
export interface OrderPricingBreakdown {
  subtotal: number
  discount: number
  deliveryFee: number
  platformFee: number
  tax: number
  total: number
  isFreeDelivery: boolean
}

/**
 * Reads every money line of an order detail in one pass, wrapper shape and key
 * casing tolerated the same way the platform-fee reader tolerates them.
 *
 * `subtotal` is summed off the main item lines (add-on and soft-deleted rows
 * dropped, matching `getMainProductNamesFromOrderDetail`) because no layer
 * carries a trustworthy pre-summed one. `total` is read, never recomputed: the
 * backend's figure is the one the customer was charged.
 *
 * `isFreeDelivery` reports the payload honestly and says nothing about layout —
 * whether a delivery row renders at all is the component's call.
 * @param orderDetail - A GET order-detail response in any of its wrapper shapes
 * @returns Every line resolved to a number, all zeros for an absent order
 * @example readOrderPricingBreakdown({ data: { total: 500, deliveryFee: 0 } }).isFreeDelivery // -> true
 */
export function readOrderPricingBreakdown(
  orderDetail: GetOrderDetailResponse | undefined
): OrderPricingBreakdown {
  const items = orderDetail?.data?.items ?? orderDetail?.items ?? []
  const subtotal = items
    .filter((line) => !(line.isAddon || line.deletedAt))
    .reduce((sum, line) => sum + parseMoneyValue(line.subtotal), 0)
  const deliveryFee = readFirstPositiveMoney(orderDetail, [
    "deliveryFee",
    "delivery_fee"
  ])

  return {
    subtotal,
    discount: readFirstPositiveMoney(orderDetail, ["discount"]),
    deliveryFee,
    platformFee: readPlatformFeeFromOrderDetail(orderDetail),
    tax: readFirstPositiveMoney(orderDetail, ["tax", "tax_amount"]),
    total: parseMoneyValue(orderDetail?.data?.total ?? orderDetail?.total),
    isFreeDelivery: deliveryFee === 0 || hasFreeDeliveryFlag(orderDetail)
  }
}
