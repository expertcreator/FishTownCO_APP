// biome-ignore-all lint/style/useConsistentTypeDefinitions: verbatim copy from mobile-tenant-app (mw-3-4) — rewriting these to `interface` is an UNSAFE fix that breaks the token-equivalence AC, and interfaces get no implicit index signature. Suppressed in-file so it travels to every app that mounts core.
/**
 * `myReview` readers for customer order payloads (`mw-3-4`, copied verbatim
 * from `mobile-tenant-app`'s `features/orders/utils/orderMyReview.ts` — the
 * module `mw-4-3` deferred while order history was out of scope).
 *
 * **The alias tolerance is the whole point and must not be narrowed.** The
 * backend projects `myReview` on BOTH the orders LIST row (`ratingsOnly`, so
 * no comments) and the order DETAIL payload (commented), at three different
 * wrapper depths depending on who unwrapped what, and the array is spelled
 * `productReviews` on the read while the write spells it `productRatings`.
 * That tolerance is what lets ONE function answer "has this been rated" for a
 * list row and a detail payload alike — narrowing it changes what counts as
 * rated, which is an Ask-First change, not a cleanup.
 *
 * Every reader takes `unknown`, which is why no list or detail type has to
 * grow a `myReview` field to be asked the question.
 *
 * **Type-name note:** this module's `OrderMyReview` is the PARSED shape and is
 * barrelled as `ParsedOrderMyReview`, because `types.ts` already exports an
 * `OrderMyReview` describing the raw wire field. Two different things with one
 * name is the collision; the in-file name stays verbatim, the barrel disambiguates.
 */

/** One parsed per-product rating. `comment` is `""` when the payload carried none. */
export type OrderMyReviewProduct = {
  productId: string
  rating: number
  comment: string
}

/** One parsed per-deal rating. `comment` is `""` when the payload carried none. */
export type OrderMyReviewDeal = {
  dealId: string
  rating: number
  comment: string
}

/** The parsed rider rating. Read but never written by this app (no rider rating on web). */
export type OrderMyReviewRider = {
  rating: number
  comment: string
}

/** The customer's own review, normalised out of whatever shape the payload used. */
export type OrderMyReview = {
  productRatings: OrderMyReviewProduct[]
  dealRatings?: OrderMyReviewDeal[]
  riderRating?: OrderMyReviewRider
  /** When API returns a single overall score without productRatings. */
  overallRating?: number
  overallComment?: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function coerceStars(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    const n = Math.round(value)
    if (n >= 1 && n <= 5) {
      return n
    }
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10)
    if (parsed >= 1 && parsed <= 5) {
      return parsed
    }
  }
  return
}

function coerceComment(value: unknown): string {
  if (typeof value === "string") {
    return value
  }
  return ""
}

function parseProductEntry(entry: unknown): OrderMyReviewProduct | null {
  const row = asRecord(entry)
  if (!row) {
    return null
  }
  // Prefer productId — `id` on review rows is the review id, not the product.
  const productIdRaw = row.productId ?? row.product_id
  const productId = typeof productIdRaw === "string" ? productIdRaw.trim() : ""
  const rating = coerceStars(row.rating ?? row.stars ?? row.score)
  if (!(productId && rating != null)) {
    return null
  }
  return {
    productId,
    rating,
    comment: coerceComment(row.comment ?? row.review ?? row.reviewText)
  }
}

function parseDealEntry(entry: unknown): OrderMyReviewDeal | null {
  const row = asRecord(entry)
  if (!row) {
    return null
  }
  const dealIdRaw = row.dealId ?? row.deal_id
  const dealId = typeof dealIdRaw === "string" ? dealIdRaw.trim() : ""
  const rating = coerceStars(row.rating ?? row.stars ?? row.score)
  if (!(dealId && rating != null)) {
    return null
  }
  return {
    dealId,
    rating,
    comment: coerceComment(row.comment ?? row.review ?? row.reviewText)
  }
}

function parseRiderEntry(value: unknown): OrderMyReviewRider | undefined {
  const row = asRecord(value)
  if (!row) {
    return
  }
  const rating = coerceStars(row.rating ?? row.stars ?? row.score)
  if (rating == null) {
    return
  }
  return {
    rating,
    comment: coerceComment(row.comment ?? row.review ?? row.reviewText)
  }
}

function normalizeMyReviewObject(raw: unknown): OrderMyReview | null {
  if (raw == null) {
    return null
  }

  // Already an array of product ratings
  if (Array.isArray(raw)) {
    const productRatings = raw
      .map(parseProductEntry)
      .filter((x): x is OrderMyReviewProduct => x != null)
    if (productRatings.length === 0) {
      return null
    }
    return { productRatings }
  }

  const rec = asRecord(raw)
  if (!rec) {
    return null
  }

  const productSource =
    rec.productReviews ??
    rec.productRatings ??
    rec.products ??
    rec.items ??
    rec.reviews

  const productRatings = Array.isArray(productSource)
    ? productSource
        .map(parseProductEntry)
        .filter((x): x is OrderMyReviewProduct => x != null)
    : []

  const dealSource = rec.dealReviews ?? rec.dealRatings ?? rec.deals
  const dealRatings = Array.isArray(dealSource)
    ? dealSource
        .map(parseDealEntry)
        .filter((x): x is OrderMyReviewDeal => x != null)
    : []

  const riderRating = parseRiderEntry(
    rec.riderReview ?? rec.riderRating ?? rec.driverRating ?? rec.rider
  )

  // Single overall / rider-only review without product/deal list
  if (productRatings.length === 0 && dealRatings.length === 0) {
    const overall = coerceStars(
      rec.rating ?? rec.stars ?? rec.customerRating ?? rec.score
    )
    if (!(overall != null || riderRating)) {
      return null
    }
    return {
      productRatings: [],
      ...(riderRating ? { riderRating } : {}),
      ...(overall != null
        ? {
            overallRating: overall,
            overallComment: coerceComment(
              rec.comment ?? rec.review ?? rec.reviewText
            )
          }
        : {})
    }
  }

  return {
    productRatings,
    ...(dealRatings.length > 0 ? { dealRatings } : {}),
    ...(riderRating ? { riderRating } : {})
  }
}

/**
 * Finds `myReview` on the payload whether wrapped as `{ success, data }` or nested.
 *
 * Three depths are tried in order — root, `data`, `data.data` — because the
 * wrapper depth is not stable across the list row, the detail payload and this
 * app's own proxy, which unwraps one layer the mobile client does not.
 * @param payload - An orders LIST row or an order DETAIL payload, at any depth
 * @returns The parsed review, or `null` when the order carries none
 * @example pickMyReviewFromOrderPayload({ myReview: { productReviews: [{ productId: "p1", rating: 4 }] } })
 */
export function pickMyReviewFromOrderPayload(
  payload: unknown
): OrderMyReview | null {
  if (!payload || typeof payload !== "object") {
    return null
  }
  const root = payload as Record<string, unknown>

  const tryPaths: unknown[] = [
    root.myReview,
    asRecord(root.data)?.myReview,
    asRecord(asRecord(root.data)?.data)?.myReview
  ]

  for (const candidate of tryPaths) {
    const parsed = normalizeMyReviewObject(candidate)
    if (parsed) {
      return parsed
    }
  }
  return null
}

/**
 * Whether the payload carries a readable `myReview`.
 * @param payload - An orders LIST row or an order DETAIL payload
 * @returns True when a review was parsed off it
 * @example orderPayloadHasMyReview({ myReview: null }) // -> false
 */
export function orderPayloadHasMyReview(payload: unknown): boolean {
  return pickMyReviewFromOrderPayload(payload) != null
}

/**
 * One representative star count for a parsed review, for a summary line.
 *
 * First product, then first deal, then the overall score, then the rider —
 * the order the customer would recognise as "what I gave this order".
 * @param review - A parsed review, or nothing
 * @returns 1–5, or `undefined` when the review carries no usable score
 * @example myReviewSummaryStars({ productRatings: [{ productId: "p", rating: 4, comment: "" }] }) // -> 4
 */
export function myReviewSummaryStars(
  review: OrderMyReview | null | undefined
): number | undefined {
  if (!review) {
    return
  }
  const firstProduct = review.productRatings[0]?.rating
  if (firstProduct != null && firstProduct >= 1) {
    return firstProduct
  }
  const firstDeal = review.dealRatings?.[0]?.rating
  if (firstDeal != null && firstDeal >= 1) {
    return firstDeal
  }
  if (review.overallRating != null && review.overallRating >= 1) {
    return review.overallRating
  }
  const rider = review.riderRating?.rating
  if (rider != null && rider >= 1) {
    return rider
  }
  return
}
