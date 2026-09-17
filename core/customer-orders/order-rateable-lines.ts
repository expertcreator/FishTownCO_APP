/**
 * The rating dialog's line model (`mw-3-4`): which lines of an order can be
 * rated, what a submitted review pre-fills them with, and the exact body
 * `POST orders/{id}/rate` accepts.
 *
 * **Why not `buildMainLineItemsForModal`.** That sibling already unwraps
 * `data.items ?? items` and already drops addon rows — the same two rules this
 * module needs — but it projects a display row and DROPS `productId` and
 * `dealId`, which are the two keys the rating body is keyed on. Its output
 * cannot be rated. The unwrap and the addon filter are copied rather than
 * shared for that reason; if that sibling ever grows the ids, delete this
 * duplication.
 *
 * **Payload assembly lives here, not in a component.** The upstream refuses a
 * body with no product, deal or rider entry (`AT_LEAST_ONE_RATING_REQUIRED`)
 * and refuses an id that is not on the order, so "which lines are legal to
 * send" is a domain rule the web and mobile screens must agree on rather than
 * each deciding for itself.
 */

import { z } from "zod"
import { getLocalizedValue } from "@/core/i18n"
import type { OrderMyReview } from "./order-my-review"
import type {
  GetOrderDetailResponse,
  OrderDetailItem,
  RateOrderRequest
} from "./types"

/**
 * The id format `rateOrderBodySchema` declares, and it is **`z.uuid()` itself,
 * not a regex that resembles it**.
 *
 * Checked here rather than left to the upstream because a malformed id costs a
 * whole submission: one bad `productId` fails the body's validation and the
 * customer loses every star they set, with a `VALIDATION_ERROR` that names a
 * field they never saw. Dropping the line client-side keeps the rest sendable.
 *
 * An earlier revision hand-wrote the RFC 9562 variant pattern here. It was
 * STRICTER than the proxy's own `z.uuid()` in exactly two places — the nil id
 * (`00000000-…`) and the max id (`ffffffff-…`), which RFC 9562 special-cases
 * and zod accepts — so a line the proxy would have forwarded was dropped
 * client-side and could never be rated, with nothing anywhere saying why. The
 * two checks are now the same call, so they cannot drift again.
 */
const uuidSchema = z.uuid()

/**
 * Whether an id is one `rateOrderBodySchema` accepts.
 * @param id - The trimmed id
 * @returns True when the proxy's own schema would accept it
 */
function isUuid(id: string): boolean {
  return uuidSchema.safeParse(id).success
}

/** The lowest star value that counts as an answer. */
const MIN_STARS = 1

/** One line of an order the customer may rate. */
export interface RateableLine {
  /** Stable per-line identity for the dialog's state map; never empty. */
  readonly key: string
  /** Set for a product line; absent for a deal-only line. */
  readonly productId?: string
  /** Set for a deal line; absent for a plain product line. */
  readonly dealId?: string
  /** Localized display name, or `"—"` when the line carries none. */
  readonly name: string
  /** How many of this line the order holds; at least 1, never `undefined`. */
  readonly quantity: number
  /** First product image, when the line carries one. */
  readonly imageUri?: string
}

/** What the customer entered (or what a submitted review pre-filled) for one line. */
export interface LineRating {
  /** 1–5; `0` means unanswered. */
  readonly stars: number
  /** Free-text note; `""` when there is none. */
  readonly comment: string
}

/** Line ratings keyed by {@link RateableLine.key}. */
export type LineRatingsByKey = Readonly<Record<string, LineRating>>

/**
 * Reads a line's display name — `order-modal-line-items.ts`'s own reader, which
 * is private to that module. The wire sends either a localized object or a
 * plain string.
 * @param line - The order line
 * @param locale - Active locale
 * @returns The name, or `""` when the line carries none
 */
function lineDisplayName(line: OrderDetailItem, locale: string): string {
  const name = line.productName

  if (!name) {
    return ""
  }

  return typeof name === "string" ? name : getLocalizedValue(name, locale)
}

/**
 * Reads a line quantity off the wire.
 *
 * `OrderDetailItem.quantity` is declared `number` but `types.ts` is a verbatim
 * wire type with no zod behind it, so the declaration is a claim about the
 * contract rather than a guarantee about the bytes. Unguarded, a missing value
 * renders as "undefined×" beside the stars.
 * @param raw - The quantity as received
 * @returns A whole quantity of at least 1
 */
function readQuantity(raw: unknown): number {
  return typeof raw === "number" && Number.isFinite(raw) && raw >= 1
    ? Math.floor(raw)
    : 1
}

/**
 * Keeps an id only when it is a UUID the upstream will accept.
 * @param raw - The id as received
 * @returns The trimmed id, or `undefined` when it is absent or malformed
 */
function usableId(raw: string | null | undefined): string | undefined {
  const id = typeof raw === "string" ? raw.trim() : ""

  return isUuid(id) ? id : undefined
}

/**
 * The lines of an order that can carry a rating.
 *
 * Addon rows are excluded (they are not separately rateable, and the upstream
 * would reject their ids), and so is any line left with neither a usable
 * `productId` nor a usable `dealId` — there is no legal body entry for it. A
 * line whose `productId` is malformed but whose `dealId` is not survives as a
 * deal line rather than being lost: dropping it would silently shrink an order
 * the customer can see.
 * @param order - Order-detail response, wrapped or flat
 * @param locale - Active locale for localized line names
 * @returns One entry per rateable line, in payload order; `[]` when there are none
 * @example buildRateableLines(orderDetail, "en") // -> [{ key: "li1", productId: "…", name: "Zinger", quantity: 2 }]
 */
export function buildRateableLines(
  order: GetOrderDetailResponse | undefined,
  locale: string
): RateableLine[] {
  if (!order) {
    return []
  }

  const raw = order.data?.items ?? order.items ?? []

  return raw
    .filter((line) => !line.isAddon)
    .map((line, index) => {
      const productId = usableId(line.productId)
      const dealId = usableId(line.dealId)

      if (productId === undefined && dealId === undefined) {
        return null
      }

      return {
        // Mobile's `lineItemRatingKey`: the row id when there is one, so two
        // lines of the same product stay two rows. The INDEX rides the
        // fallback because mobile's version collides — two lines with a blank
        // `id` and the same product produce one key, which React renders as a
        // duplicate key and the dialog treats as one shared rating, so
        // starring either line stars both and the body carries one entry
        // instead of two.
        key: line.id || `${productId ?? dealId}-${index}`,
        ...(productId === undefined ? {} : { productId }),
        ...(dealId === undefined ? {} : { dealId }),
        name: lineDisplayName(line, locale).trim() || "—",
        quantity: readQuantity(line.quantity),
        ...(line.product?.images?.[0] === undefined
          ? {}
          : { imageUri: line.product.images[0] })
      } satisfies RateableLine
    })
    .filter((line): line is RateableLine => line !== null)
}

/**
 * Pre-fills the dialog from a review the customer already submitted.
 *
 * Matches by `productId` first, then `dealId` — mobile's order, and the one
 * that matters for a line carrying both. When no line matched at all but the
 * review carries a single `overallRating`, that score lands on the FIRST line:
 * a backend that answered one overall number has nothing per-line to map, and
 * showing an empty read-only dialog would claim the order was never rated.
 * @param lines - The rateable lines, from {@link buildRateableLines}
 * @param myReview - The parsed review, or nothing
 * @returns Ratings keyed by line key; `{}` when the review fills nothing
 * @example hydrateRatingsFromMyReview(lines, { productRatings: [{ productId: "p1", rating: 5, comment: "" }] })
 */
export function hydrateRatingsFromMyReview(
  lines: readonly RateableLine[],
  myReview: OrderMyReview | null | undefined
): LineRatingsByKey {
  if (!myReview) {
    return {}
  }

  const filled: Record<string, LineRating> = {}

  for (const line of lines) {
    const matchProduct = line.productId
      ? myReview.productRatings.find(
          (entry) => entry.productId === line.productId
        )
      : undefined
    const matchDeal =
      !matchProduct && line.dealId
        ? myReview.dealRatings?.find((entry) => entry.dealId === line.dealId)
        : undefined
    const match = matchProduct ?? matchDeal

    if (match) {
      filled[line.key] = { comment: match.comment, stars: match.rating }
    }
  }

  const firstLine = lines[0]

  if (
    Object.keys(filled).length === 0 &&
    myReview.overallRating != null &&
    firstLine
  ) {
    filled[firstLine.key] = {
      comment: myReview.overallComment ?? "",
      stars: myReview.overallRating
    }
  }

  return filled
}

/**
 * Builds the exact `POST orders/{id}/rate` body from the dialog's state.
 *
 * A line with no star is skipped rather than sent as a `0`, which the
 * upstream's `int().min(1)` would reject for the whole body. A blank comment is
 * OMITTED rather than sent as `""`, and an array with no entries is omitted
 * rather than sent empty — an empty `productRatings: []` still trips the
 * upstream's at-least-one refine, so sending it would fail the same way sending
 * nothing does, only less obviously.
 * @param lines - The rateable lines, from {@link buildRateableLines}
 * @param ratings - The stars and comments keyed by line key
 * @returns The request body; `{}` when nothing is rateable, which callers must not send
 * @example buildRateOrderPayload(lines, { li1: { stars: 5, comment: "" } })
 */
export function buildRateOrderPayload(
  lines: readonly RateableLine[],
  ratings: LineRatingsByKey
): RateOrderRequest {
  const productRatings: NonNullable<RateOrderRequest["productRatings"]> = []
  const dealRatings: NonNullable<RateOrderRequest["dealRatings"]> = []

  for (const line of lines) {
    const rating = ratings[line.key]

    if (!rating || rating.stars < MIN_STARS) {
      continue
    }

    const comment = rating.comment.trim()
    const entry = {
      rating: rating.stars,
      ...(comment ? { comment } : {})
    }

    if (line.productId) {
      productRatings.push({ productId: line.productId, ...entry })
    } else if (line.dealId) {
      dealRatings.push({ dealId: line.dealId, ...entry })
    }
  }

  return {
    ...(productRatings.length > 0 ? { productRatings } : {}),
    ...(dealRatings.length > 0 ? { dealRatings } : {})
  }
}

/**
 * Whether every rateable line carries a star — the dialog's submit gate.
 * @param lines - The rateable lines
 * @param ratings - The stars and comments keyed by line key
 * @returns True when there is at least one line and none is unanswered
 * @example isRatingComplete(lines, {}) // -> false
 */
export function isRatingComplete(
  lines: readonly RateableLine[],
  ratings: LineRatingsByKey
): boolean {
  return (
    lines.length > 0 &&
    lines.every((line) => (ratings[line.key]?.stars ?? 0) >= MIN_STARS)
  )
}
