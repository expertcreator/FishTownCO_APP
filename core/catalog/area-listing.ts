import type { TaxonomyArea } from "./geo-taxonomy"
import {
  type AreaListingQuery,
  areaListingQuerySchema,
  type PaginationQuery,
  type RestaurantSummary
} from "./schemas"

/**
 * The half of a `TaxonomyArea` this module actually reads.
 *
 * Declared structurally rather than as the whole area so the fan-out can be
 * exercised over hand-written point sets — one point, five points, a radius at
 * the schema's bound — without editing the shipped taxonomy constant, which
 * lives in this same package and is the source every published URL comes from.
 */
export type AreaListingSource = Pick<TaxonomyArea, "coordinates" | "radiusKm">

/**
 * One page of `CATALOG_ENDPOINTS.listAreaRestaurants` as the transport parses it.
 *
 * `discoveryPageSchema` renames the service's `data` key to `items` on the way
 * out, so this is the normalized shape and not the wire shape. `total` is the
 * count the service reports **for that one query point**, which is why it is
 * kept out of the merged result — see {@link mergeAreaListingPages}.
 */
export interface AreaListingPage {
  readonly items: readonly RestaurantSummary[]
  readonly total: number
}

/**
 * Plans the fan-out an area page's listing is assembled from.
 *
 * An area is not a zone and there is no zone-scoped read: `areaSchema.coordinates`
 * is a **list** of interior query points, and an area page is the deduped union
 * of the discovery listing taken at each of them. One centroid is not enough,
 * because a tenant may deliver to one end of an area and not to its middle.
 *
 * Every request carries the area's own `radiusKm`. That is not an optimisation —
 * `radiusKm` is optional upstream and omitting it substitutes
 * `getDefaultBrowseRadiusKm` (on Fishtownco, the configured `onboardingRadiusKm`;
 * elsewhere 30km in a city roughly 10km across), which makes every area page in
 * one city return the same restaurants. `areaListingQuerySchema` is what refuses
 * to build a query without one, so the plan is parsed rather than hand-built.
 *
 * Pagination is applied identically to every point. A per-point window is the
 * only window the service offers; the union has no page semantics of its own,
 * and inventing one here would let a caller believe page 2 of the union is a
 * thing it can ask for.
 * @param area - The resolved area's query points and its search radius
 * @param pagination - Optional window, applied to every point; defaults to the schema's page 0 and default limit
 * @returns One query per coordinate, in coordinate order
 * @throws When a coordinate or the radius does not satisfy `areaListingQuerySchema`
 * @example planAreaListingRequests({ coordinates: [{ latitude: 32.1, longitude: 74.2 }], radiusKm: 5 }).length // -> 1
 */
export function planAreaListingRequests(
  area: AreaListingSource,
  pagination?: Partial<PaginationQuery>
): AreaListingQuery[] {
  return area.coordinates.map((point) =>
    areaListingQuerySchema.parse({
      lat: point.latitude,
      limit: pagination?.limit,
      lng: point.longitude,
      page: pagination?.page,
      radiusKm: area.radiusKm
    })
  )
}

/**
 * Unions the per-point pages into the one list an area page renders.
 *
 * Deduped by restaurant **id**, not by slug: the id is the record key on every
 * response, and the points of one area overlap heavily by design — five points
 * 5km apart in an area 2km across will return mostly the same branches. First
 * occurrence wins, so the order is stable and reproducible from the plan;
 * `compareRestaurantsForListing` is what imposes the display order afterwards.
 *
 * **It returns the restaurants and nothing else, deliberately.** There is no
 * union `total` to return that would be honest. Summing the per-point totals
 * double-counts every overlap and would report 60 restaurants for an area
 * holding 12. Taking the maximum understates it. The deduped length is exact
 * when every page is complete and a floor when one is truncated, so the caller
 * derives the count from the array it is actually rendering rather than from a
 * number that silently disagrees with it.
 *
 * Overlap between two *adjacent areas* is a separate thing and is accepted — a
 * restaurant legitimately appears on both nearby area pages. Nothing here
 * filters for that.
 * @param pages - One parsed page per query point, in any order
 * @returns The union in first-seen order, each restaurant once
 * @example mergeAreaListingPages([{ items: [], total: 0 }]) // -> []
 */
export function mergeAreaListingPages(
  pages: readonly AreaListingPage[]
): RestaurantSummary[] {
  const seen = new Set<string>()
  const merged: RestaurantSummary[] = []

  for (const page of pages) {
    for (const restaurant of page.items) {
      if (seen.has(restaurant.id)) {
        continue
      }

      seen.add(restaurant.id)
      merged.push(restaurant)
    }
  }

  return merged
}

/**
 * Whether a restaurant has a rating worth publishing.
 *
 * The two guards are one decision, so they live in one function: the rendered
 * rating element, the listing sort order and the `aggregateRating` JSON-LD node
 * all read it, and they must not disagree about the same restaurant. They were
 * written twice once already and did — a record with `rating: 4.5,
 * reviewCount: 0` rendered "4.5 (0)" while the structured data correctly
 * omitted the node.
 *
 * A `null` rating is a listing nobody has reviewed and must never render as
 * zero stars. A rating with no reviews behind it is a value with no evidence:
 * Google rejects the node, and showing it to a visitor is just as wrong.
 *
 * Lives in core rather than in the web app because it is a domain rule mobile
 * needs identically — `@/features/catalog/metadata` re-exports it so app code
 * keeps one import path.
 * @param restaurant - Any record carrying a rating and a review count
 * @returns `true` when there is both a rating and at least one review
 * @example hasPublishableRating({ rating: 4.5, reviewCount: 0 }) // -> false
 */
export function hasPublishableRating(
  restaurant: Pick<RestaurantSummary, "rating" | "reviewCount">
): boolean {
  return restaurant.rating !== null && restaurant.reviewCount > 0
}

/** Open first, then closed with a known reopen time, then hours we could not resolve. */
const OPEN_RANK = { open: 0, reopening: 1, unresolved: 2 } as const

/**
 * Whether a listing may present a restaurant as open right now.
 *
 * **Stricter than `openState.openNow` alone, deliberately.** `toOpenState`
 * degrades every unrecognised or absent open-state to
 * `temporarily_unavailable` rather than dropping the restaurant out of a
 * listing, and a degraded row can still carry `openNow: true` from a field the
 * service did not compute. The key is the more specific claim, so it wins:
 * "open" has to mean we know it is open.
 *
 * One function because three things read the answer — the card's badge, the
 * `data-open` attribute the open-now filter matches on, and the sort rank — and
 * a card that says "Open now" while the filter hides it is worse than either
 * answer on its own.
 * @param restaurant - Any record carrying a parsed open state
 * @returns `true` only when the record positively says it is open
 * @example isOpenForListing({ openState: { openNow: true, businessHoursStatusKey: "open", nextOpenTime: null } }) // -> true
 */
export function isOpenForListing(
  restaurant: Pick<RestaurantSummary, "openState">
): boolean {
  return (
    restaurant.openState.openNow &&
    restaurant.openState.businessHoursStatusKey !== "temporarily_unavailable"
  )
}

/**
 * The rating at or above which a listing calls a restaurant well-rated.
 *
 * `4.0`, matching `business-discovery-backend`'s own `rating4Plus` threshold
 * (`home-queries.ts` filters on `>= 4.0`, `home-enrichment.ts:313` agrees). The
 * home filter narrows cards the server already sent rather than re-requesting
 * them, so a different threshold here would make the same chip mean two things
 * depending on which half answered.
 */
export const LISTING_RATING_4_PLUS = 4

/**
 * Whether a listing may present a restaurant as well-rated.
 *
 * Gated on {@link hasPublishableRating} first: an unrated restaurant has no
 * rating to be above a threshold, and `rating ?? 0` would quietly answer "no"
 * for the right reason by accident.
 * @param restaurant - Any record carrying a rating and a review count
 * @returns `true` when the record has a publishable rating of 4.0 or better
 * @example isRating4PlusForListing({ rating: 4.2, reviewCount: 9 }) // -> true
 */
export function isRating4PlusForListing(
  restaurant: Pick<RestaurantSummary, "rating" | "reviewCount">
): boolean {
  return (
    hasPublishableRating(restaurant) &&
    (restaurant.rating as number) >= LISTING_RATING_4_PLUS
  )
}

/**
 * Whether a listing may present a restaurant as delivering free.
 *
 * **`null` is not free.** `deliveryFee` is nullish on the wire and a null means
 * "we do not know what this costs", which is the one answer a "Free delivery"
 * filter must not treat as a yes.
 *
 * One function for the same reason {@link isOpenForListing} is one: this is
 * exactly the condition under which `deliveryFeeLabel` prints "Free delivery"
 * on the card (`text.ts:271`), and a card advertising free delivery that the
 * free-delivery filter then hides is worse than either answer alone.
 * @param restaurant - Any record carrying a parsed delivery fee
 * @returns `true` only when the fee is known and zero
 * @example isFreeDeliveryForListing({ deliveryFee: 0 }) // -> true
 */
export function isFreeDeliveryForListing(
  restaurant: Pick<RestaurantSummary, "deliveryFee">
): boolean {
  return restaurant.deliveryFee === 0
}

/**
 * Ranks a restaurant's open state for the listing order.
 *
 * **Three states, not two.** Ranking an unresolved row alongside a merely-closed
 * one would let a place whose hours failed to resolve outrank one that reopens
 * in an hour, which is the wrong answer for a hungry visitor and the wrong
 * answer for the restaurant.
 * @param restaurant - The record being ranked
 * @returns 0 for open, 1 for closed with a known reopen, 2 for unresolved hours
 */
function openRank(restaurant: RestaurantSummary): number {
  if (
    restaurant.openState.businessHoursStatusKey === "temporarily_unavailable"
  ) {
    return OPEN_RANK.unresolved
  }

  return isOpenForListing(restaurant) ? OPEN_RANK.open : OPEN_RANK.reopening
}

/**
 * Orders two restaurants by rating, unrated last, slug as the tie-break.
 *
 * Split out because both public comparators need exactly this and a second copy
 * is a second thing to get wrong. `rating` is read only after
 * {@link hasPublishableRating} has agreed there is one, so the `?? 0` is type
 * narrowing rather than a fallback anyone can reach.
 * @param a - Left record
 * @param b - Right record
 * @returns Negative when `a` sorts first, positive when `b` does; never 0 for distinct slugs
 */
function compareByRatingThenSlug(
  a: RestaurantSummary,
  b: RestaurantSummary
): number {
  const aRated = hasPublishableRating(a)
  const bRated = hasPublishableRating(b)

  if (aRated !== bRated) {
    return aRated ? -1 : 1
  }

  if (aRated && bRated && a.rating !== b.rating) {
    return (b.rating ?? 0) - (a.rating ?? 0)
  }

  // Compared with `<` rather than `localeCompare` so the order cannot shift with
  // the runtime locale between a build machine and a server, which would change
  // the rendered HTML of a cached page for no reason. Slugs are `[a-z0-9-]+`, so
  // byte order is the only order they have.
  if (a.slug === b.slug) {
    return 0
  }

  return a.slug < b.slug ? -1 : 1
}

/**
 * The order an area page lists restaurants in: open now, then reopening, then
 * hours unresolved — and within each group, best rated first with unrated last.
 *
 * This is the requirement's "open-now sorts first, then rating", made total. The
 * final slug tie-break is not cosmetic: without it two equally-rated closed
 * restaurants could swap places between two renders of the same cached page,
 * and a listing whose order is not a pure function of its input cannot be
 * asserted on.
 * @param a - Left record
 * @param b - Right record
 * @returns Negative when `a` sorts first, positive when `b` does
 * @example [b, a].sort(compareRestaurantsForListing) // -> open before closed
 */
export function compareRestaurantsForListing(
  a: RestaurantSummary,
  b: RestaurantSummary
): number {
  const rankDelta = openRank(a) - openRank(b)

  return rankDelta === 0 ? compareByRatingThenSlug(a, b) : rankDelta
}

/**
 * The alternate order the listing's sort control offers: rating alone.
 *
 * Deliberately blind to open state. {@link compareRestaurantsForListing} answers
 * "where should I order from right now"; this one answers "which of these is
 * best", which is a different question and the reason the control exists at all.
 * A visitor who picked "top rated" and still saw every closed restaurant pushed
 * to the bottom would not have got the sort they asked for.
 * @param a - Left record
 * @param b - Right record
 * @returns Negative when `a` sorts first, positive when `b` does
 * @example [unrated, rated].sort(compareRestaurantsByRating)[0] === rated // -> true
 */
export function compareRestaurantsByRating(
  a: RestaurantSummary,
  b: RestaurantSummary
): number {
  return compareByRatingThenSlug(a, b)
}
