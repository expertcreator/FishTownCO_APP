import { describe, expect, it } from "vitest"
import {
  type AreaListingPage,
  type AreaListingSource,
  compareRestaurantsByRating,
  compareRestaurantsForListing,
  hasPublishableRating,
  isFreeDeliveryForListing,
  isRating4PlusForListing,
  LISTING_RATING_4_PLUS,
  mergeAreaListingPages,
  planAreaListingRequests
} from "../area-listing"
import { resolveArea } from "../geo-taxonomy"
import {
  areaListingQuerySchema,
  type BusinessHoursStatusKey,
  type RestaurantSummary,
  restaurantSummarySchema
} from "../schemas"

/** One point inside Magnoliya Park, reused wherever the exact place is irrelevant. */
const POINT = { latitude: 32.102_014, longitude: 74.208_89 }

/**
 * Builds a parsed `RestaurantSummary` from the few fields a test cares about.
 *
 * Everything goes through `restaurantSummarySchema` rather than being cast, so a
 * contract change breaks these tests at the seed rather than silently letting
 * them assert on a shape the domain no longer has.
 * @param overrides - The fields under test
 * @param overrides.slug - Restaurant slug, also used as the id unless one is given
 * @param overrides.id - Explicit id, for the dedupe cases where two slugs share one
 * @param overrides.rating - Star rating, or `null` for an unrated listing
 * @param overrides.reviewCount - Number of reviews behind the rating
 * @param overrides.openNow - What the service says about right now
 * @param overrides.businessHoursStatusKey - The service's own status key
 * @returns The parsed record
 */
function summary(overrides: {
  slug: string
  id?: string
  rating?: number | null
  reviewCount?: number
  openNow?: boolean
  businessHoursStatusKey?: BusinessHoursStatusKey
}): RestaurantSummary {
  return restaurantSummarySchema.parse({
    fulfillment: "delivery",
    id: overrides.id ?? `id-${overrides.slug}`,
    name: { en: overrides.slug },
    openState: {
      businessHoursStatusKey: overrides.businessHoursStatusKey ?? "open",
      nextOpenTime: null,
      openNow: overrides.openNow ?? true
    },
    rating: overrides.rating ?? null,
    reviewCount: overrides.reviewCount ?? 0,
    slug: overrides.slug
  })
}

/**
 * Wraps records as one parsed page of the discovery listing.
 * @param items - The rows the service returned for one query point
 * @returns A page reporting those rows and their count
 */
function page(items: readonly RestaurantSummary[]): AreaListingPage {
  return { items, total: items.length }
}

describe("planAreaListingRequests", () => {
  it("emits one query per coordinate, in coordinate order", () => {
    const area: AreaListingSource = {
      coordinates: [POINT, { latitude: 32.097_282, longitude: 74.204_913 }],
      radiusKm: 5
    }

    const plan = planAreaListingRequests(area)

    expect(plan).toHaveLength(2)
    expect(plan.map((query) => query.lat)).toEqual([32.102_014, 32.097_282])
    expect(plan.map((query) => query.lng)).toEqual([74.208_89, 74.204_913])
  })

  it("carries the area's own radius onto every request", () => {
    // Omitting it does not mean "unbounded" — the service substitutes a default
    // the caller did not choose, which makes every area page in one city return
    // the same restaurants.
    const plan = planAreaListingRequests({
      coordinates: [POINT, POINT, POINT],
      radiusKm: 3.5
    })

    expect(plan.every((query) => query.radiusKm === 3.5)).toBe(true)
  })

  // `nearbyPlaces` reads like the right answer and is not: it is the gated
  // "Big Brands Nearby You" section, which returned zero rows at every
  // geography we measured. Asserting the literal keeps a future reader from
  // "correcting" the section back to the name that sounds correct.
  it("pins the section to the plain ungated listing, not the big-brands one", () => {
    expect(
      planAreaListingRequests({ coordinates: [POINT], radiusKm: 5 })
    ).toEqual([expect.objectContaining({ section: "topPlaces" })])
  })

  it("refuses the gated big-brands section outright", () => {
    expect(() =>
      areaListingQuerySchema.parse({
        lat: POINT.latitude,
        lng: POINT.longitude,
        radiusKm: 5,
        section: "nearbyPlaces"
      })
    ).toThrow()
  })

  it("defaults the window rather than leaving it undefined", () => {
    const [query] = planAreaListingRequests({
      coordinates: [POINT],
      radiusKm: 5
    })

    expect(query.page).toBe(0)
    expect(query.limit).toBeGreaterThan(0)
  })

  it("applies one window identically to every point", () => {
    // The union has no page semantics of its own; a per-point window is the only
    // window the service offers.
    const plan = planAreaListingRequests(
      { coordinates: [POINT, POINT], radiusKm: 5 },
      { limit: 10, page: 2 }
    )

    expect(plan.map((query) => [query.page, query.limit])).toEqual([
      [2, 10],
      [2, 10]
    ])
  })

  it("plans the shipped area straight from the taxonomy constant", () => {
    const area = resolveArea("gujranwala", "magnoliya-park")

    expect(area).toBeDefined()
    if (!area) {
      return
    }

    const plan = planAreaListingRequests(area)
    const pin = area.coordinates.at(0)

    expect(plan).toHaveLength(area.coordinates.length)
    expect(plan.at(0)?.lat).toBe(pin?.latitude)
    expect(plan.at(0)?.lng).toBe(pin?.longitude)
    expect(plan.at(0)?.radiusKm).toBe(area.radiusKm)
  })

  it("refuses to build a query the service would reject", () => {
    // A radius of 0 parses upstream and then matches nothing, rendering an empty
    // area page rather than an error. The schema is the guard, so this fails
    // here rather than in production.
    expect(() =>
      planAreaListingRequests({ coordinates: [POINT], radiusKm: 0 })
    ).toThrow()

    expect(() =>
      planAreaListingRequests({
        coordinates: [{ latitude: 932, longitude: 74.2 }],
        radiusKm: 5
      })
    ).toThrow()
  })

  it("emits nothing for an area with no points rather than an unbounded query", () => {
    expect(planAreaListingRequests({ coordinates: [], radiusKm: 5 })).toEqual(
      []
    )
  })
})

describe("mergeAreaListingPages", () => {
  it("unions the pages in first-seen order", () => {
    const a = summary({ slug: "a" })
    const b = summary({ slug: "b" })
    const c = summary({ slug: "c" })

    expect(
      mergeAreaListingPages([page([a, b]), page([c])]).map((r) => r.slug)
    ).toEqual(["a", "b", "c"])
  })

  it("dedupes by id, because the points of one area overlap by design", () => {
    const first = summary({ slug: "a" })
    const again = summary({ slug: "a" })

    expect(mergeAreaListingPages([page([first]), page([again])])).toHaveLength(
      1
    )
  })

  it("dedupes on the id and not on the slug", () => {
    // The id is the record key on every response. Two rows sharing an id are one
    // restaurant however their slugs read.
    const left = summary({ id: "shared", slug: "a" })
    const right = summary({ id: "shared", slug: "b" })

    const merged = mergeAreaListingPages([page([left]), page([right])])

    expect(merged).toHaveLength(1)
    expect(merged[0].slug).toBe("a")
  })

  it("keeps the first occurrence, so the order is reproducible from the plan", () => {
    const early = summary({
      id: "shared",
      rating: 4.9,
      reviewCount: 10,
      slug: "x"
    })
    const late = summary({
      id: "shared",
      rating: 1.1,
      reviewCount: 10,
      slug: "x"
    })

    expect(mergeAreaListingPages([page([early]), page([late])])[0].rating).toBe(
      4.9
    )
  })

  it("dedupes within a single page as well as across pages", () => {
    const one = summary({ slug: "a" })

    expect(mergeAreaListingPages([page([one, one])])).toHaveLength(1)
  })

  it("answers an empty list for no pages and for empty pages", () => {
    expect(mergeAreaListingPages([])).toEqual([])
    expect(mergeAreaListingPages([page([]), page([])])).toEqual([])
  })

  it("returns no union total, because there is no honest one to return", () => {
    // Summing the per-point totals double-counts every overlap; the deduped
    // array is what the caller renders and therefore what it counts.
    const shared = summary({ slug: "a" })
    const merged = mergeAreaListingPages([
      { items: [shared], total: 40 },
      { items: [shared], total: 40 }
    ])

    expect(merged).toHaveLength(1)
  })
})

describe("hasPublishableRating", () => {
  it("is false for a null rating", () => {
    expect(hasPublishableRating({ rating: null, reviewCount: 0 })).toBe(false)
    expect(hasPublishableRating({ rating: null, reviewCount: 9 })).toBe(false)
  })

  it("is false for a rating with no reviews behind it", () => {
    expect(hasPublishableRating({ rating: 4.5, reviewCount: 0 })).toBe(false)
  })

  it("is true only when there is both a rating and a review", () => {
    expect(hasPublishableRating({ rating: 4.5, reviewCount: 1 })).toBe(true)
  })

  it("treats a genuine zero rating as publishable when reviews exist", () => {
    // `ratingSchema` bounds to [0, 5] because the column can hold 0. That is a
    // real, evidenced rating and is not the same thing as `null`.
    expect(hasPublishableRating({ rating: 0, reviewCount: 3 })).toBe(true)
  })
})

describe("compareRestaurantsForListing", () => {
  const open = summary({ rating: 3, reviewCount: 5, slug: "open" })
  const reopening = summary({
    businessHoursStatusKey: "opens_at",
    openNow: false,
    rating: 4.9,
    reviewCount: 900,
    slug: "reopening"
  })
  const unresolved = summary({
    businessHoursStatusKey: "temporarily_unavailable",
    openNow: false,
    rating: 5,
    reviewCount: 900,
    slug: "unresolved"
  })

  it("puts open now first, however well the closed one is rated", () => {
    expect(
      [reopening, open].sort(compareRestaurantsForListing).map((r) => r.slug)
    ).toEqual(["open", "reopening"])
  })

  it("sorts unresolved hours last, behind a merely closed restaurant", () => {
    // The tri-state is the point. `temporarily_unavailable` means "we could not
    // resolve this restaurant's hours", so a place that reopens in an hour must
    // outrank it — ranking the two together is the bug this test exists for.
    expect(
      [unresolved, reopening, open]
        .sort(compareRestaurantsForListing)
        .map((r) => r.slug)
    ).toEqual(["open", "reopening", "unresolved"])
  })

  it("ranks on the status key even when openNow contradicts it", () => {
    // A degraded row can carry `openNow: true` alongside the unresolved key.
    // The key is the more specific claim.
    const contradictory = summary({
      businessHoursStatusKey: "temporarily_unavailable",
      openNow: true,
      rating: 5,
      reviewCount: 900,
      slug: "contradictory"
    })

    expect(
      [contradictory, open]
        .sort(compareRestaurantsForListing)
        .map((r) => r.slug)
    ).toEqual(["open", "contradictory"])
  })

  it.each([
    "opens_at",
    "opens_tomorrow_at"
  ] as const)("treats %s as closed-with-a-reopen rather than unresolved", (key) => {
    const closed = summary({
      businessHoursStatusKey: key,
      openNow: false,
      slug: "closed"
    })

    expect(
      [unresolved, closed].sort(compareRestaurantsForListing).map((r) => r.slug)
    ).toEqual(["closed", "unresolved"])
  })

  it("sorts by rating descending inside a group", () => {
    const low = summary({ rating: 3.1, reviewCount: 10, slug: "low" })
    const high = summary({ rating: 4.8, reviewCount: 10, slug: "high" })

    expect(
      [low, high].sort(compareRestaurantsForListing).map((r) => r.slug)
    ).toEqual(["high", "low"])
  })

  it("sorts an unrated restaurant below every rated one in its group", () => {
    const unrated = summary({
      rating: null,
      reviewCount: 0,
      slug: "aaa-unrated"
    })
    const poor = summary({ rating: 1.2, reviewCount: 4, slug: "zzz-poor" })

    expect(
      [unrated, poor].sort(compareRestaurantsForListing).map((r) => r.slug)
    ).toEqual(["zzz-poor", "aaa-unrated"])
  })

  it("treats a rating with no reviews as unrated, exactly as the page does", () => {
    const evidenceless = summary({ rating: 5, reviewCount: 0, slug: "aaa" })
    const evidenced = summary({ rating: 2, reviewCount: 1, slug: "zzz" })

    expect(
      [evidenceless, evidenced]
        .sort(compareRestaurantsForListing)
        .map((r) => r.slug)
    ).toEqual(["zzz", "aaa"])
  })

  it("breaks a tie on slug so the rendered order is a pure function of its input", () => {
    const zed = summary({ rating: 4, reviewCount: 10, slug: "zed" })
    const amy = summary({ rating: 4, reviewCount: 10, slug: "amy" })

    expect(
      [zed, amy].sort(compareRestaurantsForListing).map((r) => r.slug)
    ).toEqual(["amy", "zed"])
  })

  it("breaks a tie between two unrated restaurants on slug too", () => {
    const zed = summary({ slug: "zed" })
    const amy = summary({ slug: "amy" })

    expect(
      [zed, amy].sort(compareRestaurantsForListing).map((r) => r.slug)
    ).toEqual(["amy", "zed"])
  })

  it("answers 0 for a record compared with itself", () => {
    expect(compareRestaurantsForListing(open, open)).toBe(0)
  })

  it("is antisymmetric across every pair it orders", () => {
    const records = [open, reopening, unresolved]

    for (const a of records) {
      for (const b of records) {
        // `+ 0` normalises the signed zero `Math.sign` returns for an equal
        // pair; `Object.is(-0, 0)` is false and would fail the identity case
        // for a reason that has nothing to do with the ordering.
        expect(Math.sign(compareRestaurantsForListing(a, b)) + 0).toBe(
          -Math.sign(compareRestaurantsForListing(b, a)) + 0
        )
      }
    }
  })
})

describe("compareRestaurantsByRating", () => {
  it("ignores open state entirely", () => {
    // "Top rated" must mean top rated. A visitor who asked for it and still saw
    // every closed restaurant pushed to the bottom did not get the sort.
    const closedButBest = summary({
      businessHoursStatusKey: "opens_at",
      openNow: false,
      rating: 4.9,
      reviewCount: 900,
      slug: "closed-best"
    })
    const openButWorse = summary({
      rating: 3,
      reviewCount: 5,
      slug: "open-worse"
    })

    expect(
      [openButWorse, closedButBest]
        .sort(compareRestaurantsByRating)
        .map((r) => r.slug)
    ).toEqual(["closed-best", "open-worse"])
  })

  it("still puts unrated last and still breaks ties on slug", () => {
    const unrated = summary({ slug: "aaa" })
    const zed = summary({ rating: 4, reviewCount: 2, slug: "zed" })
    const amy = summary({ rating: 4, reviewCount: 2, slug: "amy" })

    expect(
      [unrated, zed, amy].sort(compareRestaurantsByRating).map((r) => r.slug)
    ).toEqual(["amy", "zed", "aaa"])
  })

  it("answers 0 for a record compared with itself", () => {
    expect(
      compareRestaurantsByRating(summary({ slug: "a" }), summary({ slug: "a" }))
    ).toBe(0)
  })
})

describe("isRating4PlusForListing", () => {
  it("matches the backend's own threshold", () => {
    // `business-discovery-backend` filters `rating4Plus` on `>= 4.0`
    // (home-queries.ts, home-enrichment.ts:313). The home chip narrows cards
    // the server already sent, so a different number here would make one chip
    // mean two things depending on which half answered.
    expect(LISTING_RATING_4_PLUS).toBe(4)
  })

  it("is inclusive at the threshold", () => {
    expect(isRating4PlusForListing({ rating: 4, reviewCount: 3 })).toBe(true)
  })

  it("is false just below it", () => {
    expect(isRating4PlusForListing({ rating: 3.9, reviewCount: 3 })).toBe(false)
  })

  it("is false for a rating no listing may publish", () => {
    // Unrated is not "below 4" — there is no rating to compare. Reading
    // `rating ?? 0` would answer no for the right reason by accident, and would
    // start answering yes the moment the fallback changed.
    expect(isRating4PlusForListing({ rating: 4.8, reviewCount: 0 })).toBe(false)
    expect(isRating4PlusForListing({ rating: null, reviewCount: 9 })).toBe(
      false
    )
  })
})

describe("isFreeDeliveryForListing", () => {
  it("is true only for a fee that is known and zero", () => {
    expect(isFreeDeliveryForListing({ deliveryFee: 0 })).toBe(true)
  })

  it("is false for a fee that costs something", () => {
    expect(isFreeDeliveryForListing({ deliveryFee: 120 })).toBe(false)
  })

  it("does not treat an unknown fee as free", () => {
    // `null` means "we do not know what this costs", which is the one answer a
    // "Free delivery" filter must not read as a yes. It is also exactly when
    // `deliveryFeeLabel` prints nothing rather than "Free delivery".
    expect(isFreeDeliveryForListing({ deliveryFee: null })).toBe(false)
  })
})
