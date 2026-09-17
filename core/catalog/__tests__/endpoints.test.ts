import { describe, expect, it } from "vitest"
import { CATALOG_ENDPOINTS, type Slug, slugSchema } from "../index"

/**
 * Parses a literal to a branded `Slug` so path fixtures can be written inline.
 * @param value - Slug literal known to be valid
 * @returns The branded slug
 */
function slug(value: string): Slug {
  return slugSchema.parse(value)
}

const RESTAURANT = slug("al-rehman")

describe("CATALOG_ENDPOINTS", () => {
  it("defines exactly the eight catalog reads", () => {
    // mw-1-10 added `getHomeSections`/`listCategories` — the home page's two
    // new geo-shaped reads, appended after `search` rather than inserted
    // earlier, since key order here is never load-bearing but a diff that
    // reorders existing keys for no reason is a worse diff to review.
    expect(Object.keys(CATALOG_ENDPOINTS)).toEqual([
      "listAreaRestaurants",
      "getRestaurant",
      "getRestaurantMenu",
      "getRestaurantItem",
      "getRestaurantPhotos",
      "search",
      "getHomeSections",
      "listCategories"
    ])
  })

  it("has no list-areas read — the taxonomy is a constant, not an endpoint", () => {
    expect(CATALOG_ENDPOINTS).not.toHaveProperty("listAreas")
  })

  it("is read-only — every definition is a GET", () => {
    for (const endpoint of Object.values(CATALOG_ENDPOINTS)) {
      expect(endpoint.method).toBe("GET")
    }
  })

  it.each([
    [
      "listAreaRestaurants",
      CATALOG_ENDPOINTS.listAreaRestaurants.path(),
      "home/section/view-all"
    ],
    [
      "getRestaurant",
      CATALOG_ENDPOINTS.getRestaurant.path(RESTAURANT),
      "public/restaurants/al-rehman"
    ],
    [
      "getRestaurantMenu",
      CATALOG_ENDPOINTS.getRestaurantMenu.path(RESTAURANT),
      "public/restaurants/al-rehman/menu"
    ],
    [
      "getRestaurantItem",
      CATALOG_ENDPOINTS.getRestaurantItem.path(RESTAURANT, "zinger-burger"),
      "public/restaurants/al-rehman/items/zinger-burger"
    ],
    [
      "getRestaurantItem by uuid",
      CATALOG_ENDPOINTS.getRestaurantItem.path(
        RESTAURANT,
        "1b0d9a1e-0000-4000-8000-000000000000"
      ),
      "public/restaurants/al-rehman/items/1b0d9a1e-0000-4000-8000-000000000000"
    ],
    [
      "getRestaurantPhotos",
      CATALOG_ENDPOINTS.getRestaurantPhotos.path(RESTAURANT),
      "public/restaurants/al-rehman/photos"
    ],
    ["search", CATALOG_ENDPOINTS.search.path(), "public/search"],
    ["getHomeSections", CATALOG_ENDPOINTS.getHomeSections.path(), "home/data"],
    ["listCategories", CATALOG_ENDPOINTS.listCategories.path(), "categories"]
  ])("builds the %s path", (_name, actual, expected) => {
    expect(actual).toBe(expected)
    expect(actual.startsWith("/")).toBe(false)
  })

  it("takes no city segment — the API dropped it and page URLs keep their own", () => {
    // Regression guard for the mw-0-2 contract, which addressed restaurants as
    // `cities/{city}/restaurants/{slug}`. The service never consulted the city
    // and withdrew the segment; slugs are globally unique. A path that carries
    // one again would 404 against the running service.
    for (const path of [
      CATALOG_ENDPOINTS.getRestaurant.path(RESTAURANT),
      CATALOG_ENDPOINTS.getRestaurantMenu.path(RESTAURANT),
      CATALOG_ENDPOINTS.getRestaurantPhotos.path(RESTAURANT),
      CATALOG_ENDPOINTS.getRestaurantItem.path(RESTAURANT, "zinger-burger"),
      CATALOG_ENDPOINTS.search.path()
    ]) {
      expect(path).not.toContain("cities/")
    }
  })

  it("never lets an item key smuggle a path segment", () => {
    // The key comes from a query string a visitor can edit, so it is the one
    // interpolated value on this surface that is genuinely untrusted.
    expect(
      CATALOG_ENDPOINTS.getRestaurantItem.path(RESTAURANT, "../../secrets")
    ).toBe("public/restaurants/al-rehman/items/..%2F..%2Fsecrets")
  })

  it("wraps the item response in the same nullable envelope as its siblings", () => {
    // Absence has exactly one encoding across this domain, and here it carries
    // three upstream conditions at once — unknown key, another tenant's slug,
    // and no inventory at this branch.
    expect(
      CATALOG_ENDPOINTS.getRestaurantItem.response.parse({
        success: true,
        data: null
      }).data
    ).toBeNull()
  })

  it("fails the item parse when the envelope says the call failed", () => {
    // A 200 with `success: false` must never reach a caller as absence — that
    // is how an outage becomes an indexed soft 404.
    expect(() =>
      CATALOG_ENDPOINTS.getRestaurantItem.response.parse({
        success: false,
        data: null
      })
    ).toThrow()
  })

  it("encodes every interpolated segment", () => {
    // Not a legal slug, but the builder must never emit a raw path separator.
    const hostile = "a/b" as Slug

    expect(CATALOG_ENDPOINTS.getRestaurant.path(hostile)).toBe(
      "public/restaurants/a%2Fb"
    )
    expect(CATALOG_ENDPOINTS.getRestaurantMenu.path(hostile)).toBe(
      "public/restaurants/a%2Fb/menu"
    )
    expect(CATALOG_ENDPOINTS.getRestaurantPhotos.path(hostile)).toContain(
      "restaurants/a%2Fb/photos"
    )
  })
})

describe("CATALOG_ENDPOINTS query contracts", () => {
  const POINT = { lat: 32.1877, lng: 74.1945, radiusKm: 5 }

  it("asks the listing for one point, defaulting the section and the window", () => {
    expect(CATALOG_ENDPOINTS.listAreaRestaurants.query.parse(POINT)).toEqual({
      ...POINT,
      section: "topPlaces",
      page: 0,
      limit: 20
    })
  })

  it("keeps the 0-indexed page contract on the listing", () => {
    expect(
      CATALOG_ENDPOINTS.listAreaRestaurants.query.parse({
        ...POINT,
        page: 1,
        limit: 30
      })
    ).toMatchObject({ page: 1, limit: 30 })
  })

  it.each([
    ["a missing point — the listing cannot answer without one", {}],
    ["a latitude out of range", { lat: 91, lng: 74.1945, radiusKm: 5 }],
    ["a longitude out of range", { lat: 32.1877, lng: 181, radiusKm: 5 }],
    ["a missing radius", { lat: 32.1877, lng: 74.1945 }],
    ["a zero radius, which matches nothing", { ...POINT, radiusKm: 0 }],
    ["a radius above the backend's cap of 30", { ...POINT, radiusKm: 31 }]
  ])("rejects %s", (_label, input) => {
    expect(() =>
      CATALOG_ENDPOINTS.listAreaRestaurants.query.parse(input)
    ).toThrow()
  })

  it("carries radiusKm through, so the area's own radius reaches the backend", () => {
    // REVERSED 2026-08-19: this previously asserted the parameter was stripped,
    // on the premise that a caller radius overrides the per-tenant delivery
    // boundary. The backend AND-s the two (home-queries.ts:1663), and omitting
    // the radius falls through to a ~30km default that makes every area page in
    // a city return the same restaurants.
    const parsed = CATALOG_ENDPOINTS.listAreaRestaurants.query.parse({
      ...POINT,
      radiusKm: 5
    })

    expect(parsed).toHaveProperty("radiusKm", 5)
    // Pins the exact parameter set, so neither a stray addition nor a silently
    // stripped one reaches the borrowed endpoint untested.
    expect(Object.keys(parsed).sort()).toEqual([
      "lat",
      "limit",
      "lng",
      "page",
      "radiusKm",
      "section"
    ])
  })

  it("declares the search parameter names, since search has no path segments", () => {
    expect(CATALOG_ENDPOINTS.search.query.parse({ q: "bbq" })).toEqual({
      q: "bbq",
      page: 0,
      limit: 20
    })
    expect(() => CATALOG_ENDPOINTS.search.query.parse({})).toThrow()
  })

  it("drops a city narrowing rather than sending one the service ignores", () => {
    expect(
      CATALOG_ENDPOINTS.search.query.parse({ q: "bbq", city: "gujranwala" })
    ).not.toHaveProperty("city")
  })
})

describe("CATALOG_ENDPOINTS response schemas", () => {
  /** A `public/*` row: already the shape this domain renders. */
  const restaurant = {
    id: "restaurant-1",
    slug: "al-rehman",
    name: "Al Rehman",
    fulfillment: "delivery",
    openState: { openNow: true, businessHoursStatusKey: "open" }
  }

  /** A `home/section/view-all` row: the mobile app's shape, mapped on parse. */
  const discoveryRow = {
    id: "restaurant-1",
    slug: "al-rehman",
    name: { en: "Al Rehman" },
    orderFulfillment: "delivery",
    openNow: true,
    businessHoursStatusKey: "open"
  }

  it("parses a page of restaurants off the borrowed listing's `data` key", () => {
    const parsed = CATALOG_ENDPOINTS.listAreaRestaurants.response.parse({
      success: true,
      data: {
        data: [discoveryRow],
        total: 12,
        page: 0,
        limit: 20,
        appliedFilters: []
      }
    })

    expect(parsed.data.items[0]?.slug).toBe("al-rehman")
    expect(parsed.data.total).toBe(12)
  })

  it("rejects an `items` page — that key belongs to no endpoint we call", () => {
    // Guards the mw-0-2 assumption that `be-2-3` would standardize on `items`.
    // The endpoint that was going to is deleted; the borrowed one says `data`.
    expect(() =>
      CATALOG_ENDPOINTS.listAreaRestaurants.response.parse({
        data: { items: [discoveryRow], total: 12 }
      })
    ).toThrow()
  })

  it("treats a listing miss as an empty page, never as an absent parent", () => {
    // The area's existence is decided by the taxonomy constant, not by this
    // endpoint — so there is no `null` for it to return.
    const parsed = CATALOG_ENDPOINTS.listAreaRestaurants.response.parse({
      data: { data: [], total: 0 }
    })

    expect(parsed.data.items).toEqual([])
    expect(() =>
      CATALOG_ENDPOINTS.listAreaRestaurants.response.parse({ data: null })
    ).toThrow()
  })

  it.each([
    ["getRestaurant", CATALOG_ENDPOINTS.getRestaurant.response],
    ["getRestaurantMenu", CATALOG_ENDPOINTS.getRestaurantMenu.response],
    ["getRestaurantPhotos", CATALOG_ENDPOINTS.getRestaurantPhotos.response]
  ])("encodes absence the same way on %s", (_name, schema) => {
    expect(schema.parse({ data: null }).data).toBeNull()
  })

  it("parses an empty photo list as empty, not absent", () => {
    expect(
      CATALOG_ENDPOINTS.getRestaurantPhotos.response.parse({ data: [] }).data
    ).toEqual([])
  })

  it("parses a search payload", () => {
    const parsed = CATALOG_ENDPOINTS.search.response.parse({
      data: { query: "bbq", total: 1, restaurants: [restaurant] }
    })

    expect(parsed.data.restaurants[0]?.name).toEqual({ en: "Al Rehman" })
  })

  it.each([
    ["getRestaurant", CATALOG_ENDPOINTS.getRestaurant.response],
    ["search", CATALOG_ENDPOINTS.search.response]
  ])("rejects a success:false envelope on %s", (_name, schema) => {
    expect(() =>
      schema.parse({ success: false, message: "upstream timeout", data: null })
    ).toThrow()
  })

  it("rejects a payload that is missing the envelope", () => {
    expect(() =>
      CATALOG_ENDPOINTS.getRestaurantPhotos.response.parse([])
    ).toThrow()
  })
})
