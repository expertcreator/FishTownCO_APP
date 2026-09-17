/**
 * "Has this customer already rated this order?" (`mw-3-4`, copied verbatim from
 * `mobile-tenant-app`'s `features/orders/utils/orderRatingStatus.ts` — the
 * second module `mw-4-3` deferred).
 *
 * One reader for both surfaces: a `myReview` rides on the orders LIST row AND
 * on the order DETAIL payload, so neither the history screen nor the detail
 * page needs a rule of its own, and neither spends a request to find out. The
 * key-scanning fallbacks below cover backends that answer the question with a
 * flag instead — none of this app's payloads carry one today, and removing the
 * scan on that basis would be a behaviour change to a verbatim port.
 *
 * Imports the sibling reader rather than re-deriving the parse; that edge is
 * load-bearing and is kept exactly as mobile has it.
 */

import {
  myReviewSummaryStars,
  pickMyReviewFromOrderPayload
} from "./order-my-review"

function truthyRated(value: unknown): boolean {
  if (value === true) {
    return true
  }
  if (typeof value === "number" && value > 0) {
    return true
  }
  if (typeof value === "string" && value.trim().toLowerCase() === "true") {
    return true
  }
  return false
}

function scanRecord(rec: Record<string, unknown>): boolean {
  const keys = [
    "customerRated",
    "hasCustomerRated",
    "isRated",
    "rated",
    "ratingSubmitted",
    "hasRated",
    "reviewSubmitted",
    "customerReviewSubmitted"
  ]
  for (const k of keys) {
    if (truthyRated(rec[k])) {
      return true
    }
  }
  return false
}

function coerceCustomerStarCount(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    const n = Math.round(value)
    if (n >= 1 && n <= 5) {
      return n
    }
    if (n > 5) {
      return 5
    }
    return
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10)
    if (parsed >= 1 && parsed <= 5) {
      return parsed
    }
  }
  return
}

function scanRecordForStarCount(
  rec: Record<string, unknown>
): number | undefined {
  const keys = [
    "customerOrderRating",
    "customerRating",
    "myRating",
    "orderRating",
    "userRating",
    "starRating",
    "stars",
    "rating"
  ]
  for (const k of keys) {
    const v = rec[k]
    const direct = coerceCustomerStarCount(v)
    if (direct != null) {
      return direct
    }
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const inner = v as Record<string, unknown>
      for (const ik of ["value", "stars", "rating", "score", "overall"]) {
        const nested = coerceCustomerStarCount(inner[ik])
        if (nested != null) {
          return nested
        }
      }
    }
  }
  return
}

/**
 * Best-effort numeric 1–5 stars from order list/detail payloads when the
 * backend exposes them.
 *
 * The parsed `myReview` wins; the key scan is the fallback, and it recurses
 * one wrapper deep at a time up to five levels.
 * @param payload - An orders LIST row or an order DETAIL payload
 * @param depth - Recursion guard; callers pass nothing
 * @returns 1–5, or `undefined` when nothing in the payload says
 * @example orderPayloadCustomerRatingStars({ data: { customerRating: 4 } }) // -> 4
 */
export function orderPayloadCustomerRatingStars(
  payload: unknown,
  depth = 0
): number | undefined {
  const fromMyReview = myReviewSummaryStars(
    pickMyReviewFromOrderPayload(payload)
  )
  if (fromMyReview != null) {
    return fromMyReview
  }
  if (depth > 4 || !payload || typeof payload !== "object") {
    return
  }
  const root = payload as Record<string, unknown>
  const fromRoot = scanRecordForStarCount(root)
  if (fromRoot != null) {
    return fromRoot
  }
  const nestedRating = root.customerRating ?? root.ratingSummary
  if (
    nestedRating &&
    typeof nestedRating === "object" &&
    !Array.isArray(nestedRating)
  ) {
    const fromNested = scanRecordForStarCount(
      nestedRating as Record<string, unknown>
    )
    if (fromNested != null) {
      return fromNested
    }
  }
  const data = root.data
  if (data && typeof data === "object") {
    return orderPayloadCustomerRatingStars(data, depth + 1)
  }
  return
}

/**
 * Whether the payload says the customer already rated this order.
 *
 * This is the ONE question both web rating surfaces ask: a `true` renders
 * `View rating` and opens the dialog read-only, a `false` renders `Rate order`.
 * An explicit `myReview: null` — the field present and empty — is a `false`,
 * which is what makes an unrated completed order distinguishable from a
 * payload that simply never carried the field.
 * @param payload - An orders LIST row or an order DETAIL payload
 * @returns True when the payload indicates a submitted review
 * @example orderPayloadIndicatesCustomerRated({ myReview: null }) // -> false
 */
export function orderPayloadIndicatesCustomerRated(payload: unknown): boolean {
  if (pickMyReviewFromOrderPayload(payload) != null) {
    return true
  }
  if (!payload || typeof payload !== "object") {
    return false
  }
  const root = payload as Record<string, unknown>
  if (scanRecord(root)) {
    return true
  }
  // Explicit myReview: null means not rated yet (field present).
  const data = root.data
  if (data && typeof data === "object") {
    const inner = data as Record<string, unknown>
    if (scanRecord(inner)) {
      return true
    }
    const nestedRating = inner.customerRating ?? inner.ratingSummary
    if (nestedRating && typeof nestedRating === "object") {
      return scanRecord(nestedRating as Record<string, unknown>)
    }
  }
  return false
}
