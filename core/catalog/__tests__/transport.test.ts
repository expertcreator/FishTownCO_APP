import { describe, expect, it } from "vitest"
import {
  type AreaRestaurants,
  areaRestaurantsSchema,
  type CatalogSearchResults,
  type CatalogTransport,
  type CityAreas,
  cityAreasSchema,
  menuItemDetailSchema,
  type RestaurantDetail,
  restaurantDetailSchema,
  type Slug,
  slugSchema
} from "../index"

/**
 * Parses a literal to a branded `Slug` so fixtures can be written inline.
 * @param value - Slug literal known to be valid
 * @returns The branded slug
 */
function slug(value: string): Slug {
  return slugSchema.parse(value)
}

const CITY = slug("gujranwala")
const AREA = slug("magnoliya-park")
const KNOWN = slug("al-rehman")
const UNKNOWN = slug("does-not-exist")

const DETAIL: RestaurantDetail = restaurantDetailSchema.parse({
  id: "restaurant-1",
  slug: "al-rehman",
  citySlug: "gujranwala",
  areaSlug: "magnoliya-park",
  name: "Al Rehman",
  fulfillment: "delivery",
  openState: { openNow: true, businessHoursStatusKey: "open" }
})

const EMPTY_RESULTS: CatalogSearchResults = {
  query: "",
  total: 0,
  restaurants: [],
  areas: []
}

const CITY_AREAS: CityAreas = cityAreasSchema.parse({
  city: {
    id: "city-1",
    slug: "gujranwala",
    name: "Gujranwala",
    isLive: true
  },
  areas: [],
  total: 0
})

const AREA_RESTAURANTS: AreaRestaurants = areaRestaurantsSchema.parse({
  area: {
    id: "area-1",
    slug: "magnoliya-park",
    citySlug: "gujranwala",
    name: "Magnoliya Park",
    isLive: true,
    coordinates: [{ latitude: 32.1877, longitude: 74.1945 }]
  },
  restaurants: [],
  total: 0
})

/** The one item key the working transport knows about. */
const KNOWN_ITEM = "seekh-kebab"

/** The item that key resolves to — the plain shape 73% of production has. */
const ITEM = menuItemDetailSchema.parse({
  id: "item-1",
  slug: KNOWN_ITEM,
  name: { en: "Seekh Kebab" },
  price: "450.00"
})

/**
 * Minimal `CatalogTransport` that knows one city, one area and one restaurant.
 * Stands in for the `mw-0-3` fixture transport and the `mw-5-1` HTTP one: if
 * both satisfy this interface, swapping them touches no screen.
 */
const workingTransport: CatalogTransport = {
  getDeliveryRule: () => Promise.resolve(null),
  listAreas: (citySlug) =>
    Promise.resolve(citySlug === CITY ? CITY_AREAS : null),
  listAreaRestaurants: (citySlug, areaSlug) =>
    Promise.resolve(
      citySlug === CITY && areaSlug === AREA ? AREA_RESTAURANTS : null
    ),
  getRestaurant: (_citySlug, restaurantSlug) =>
    Promise.resolve(restaurantSlug === KNOWN ? DETAIL : null),
  getRestaurantMenu: (_citySlug, restaurantSlug) =>
    Promise.resolve(restaurantSlug === KNOWN ? [] : null),
  getRestaurantPhotos: (_citySlug, restaurantSlug) =>
    Promise.resolve(restaurantSlug === KNOWN ? [] : null),
  getItem: (_citySlug, restaurantSlug, itemKey) =>
    Promise.resolve(
      restaurantSlug === KNOWN && itemKey === KNOWN_ITEM ? ITEM : null
    ),
  search: (query) => Promise.resolve({ ...EMPTY_RESULTS, query }),
  getHomeSections: () => Promise.resolve([]),
  listCategories: () => Promise.resolve([])
}

/** Every read fails the way a network outage or a 5xx does. */
const brokenTransport: CatalogTransport = {
  getDeliveryRule: () => Promise.reject(new Error("upstream unavailable")),
  listAreas: () => Promise.reject(new Error("upstream unavailable")),
  listAreaRestaurants: () => Promise.reject(new Error("upstream unavailable")),
  getRestaurant: () => Promise.reject(new Error("upstream unavailable")),
  getRestaurantMenu: () => Promise.reject(new Error("upstream unavailable")),
  getRestaurantPhotos: () => Promise.reject(new Error("upstream unavailable")),
  getItem: () => Promise.reject(new Error("upstream unavailable")),
  search: () => Promise.reject(new Error("upstream unavailable")),
  getHomeSections: () => Promise.reject(new Error("upstream unavailable")),
  listCategories: () => Promise.reject(new Error("upstream unavailable"))
}

describe("CatalogTransport — absent means null", () => {
  it("resolves null for an unknown restaurant", async () => {
    await expect(
      workingTransport.getRestaurant(CITY, UNKNOWN)
    ).resolves.toBeNull()
  })

  it("resolves the record for a known restaurant", async () => {
    await expect(workingTransport.getRestaurant(CITY, KNOWN)).resolves.toEqual(
      DETAIL
    )
  })

  it("resolves null when the parent city or area does not exist", async () => {
    await expect(workingTransport.listAreas(UNKNOWN)).resolves.toBeNull()
    await expect(
      workingTransport.listAreaRestaurants(CITY, UNKNOWN)
    ).resolves.toBeNull()
  })

  it("distinguishes an empty parent from an absent one", async () => {
    await expect(workingTransport.listAreas(CITY)).resolves.toEqual(CITY_AREAS)
    await expect(
      workingTransport.listAreaRestaurants(CITY, AREA)
    ).resolves.toEqual(AREA_RESTAURANTS)
  })

  it("carries the parent record and the total, not just the children", async () => {
    const areas = await workingTransport.listAreas(CITY)
    const restaurants = await workingTransport.listAreaRestaurants(CITY, AREA)

    // Without these the /{city} page has no source for its own name and the
    // area page cannot render "N restaurants".
    expect(areas?.city.name).toEqual({ en: "Gujranwala" })
    expect(areas?.total).toBe(0)
    expect(restaurants?.area.slug).toBe("magnoliya-park")
    expect(restaurants?.total).toBe(0)
  })

  it("resolves null for the menu and photos of an unknown restaurant", async () => {
    await expect(
      workingTransport.getRestaurantMenu(CITY, UNKNOWN)
    ).resolves.toBeNull()
    await expect(
      workingTransport.getRestaurantPhotos(CITY, UNKNOWN)
    ).resolves.toBeNull()
  })

  it("resolves the item for a known key and null for anything else", async () => {
    // `null` here carries three upstream conditions at once — unknown key,
    // another tenant's slug, and no inventory at this branch — and all three
    // are deliberately indistinguishable to a caller.
    await expect(
      workingTransport.getItem(CITY, KNOWN, KNOWN_ITEM)
    ).resolves.toEqual(ITEM)
    await expect(
      workingTransport.getItem(CITY, KNOWN, "not-a-dish")
    ).resolves.toBeNull()
    await expect(
      workingTransport.getItem(CITY, UNKNOWN, KNOWN_ITEM)
    ).resolves.toBeNull()
  })

  it("returns an empty result set rather than null for a search miss", async () => {
    await expect(workingTransport.search("nothing here")).resolves.toEqual({
      ...EMPTY_RESULTS,
      query: "nothing here"
    })
  })

  it("accepts optional search pagination", async () => {
    // Pagination only — there is no city scope. The service has no city
    // dimension to search within, so an option here would promise a narrowing
    // no implementation could honour without filtering results itself.
    await expect(
      workingTransport.search("bbq", { page: 0, limit: 20 })
    ).resolves.toMatchObject({ query: "bbq" })
  })

  it("resolves an array, never null, for the home sections and category tiles", async () => {
    // Neither read has a parent-absent case (Boundaries — "always an array,
    // empty is valid"), unlike every other read above.
    await expect(workingTransport.getHomeSections(CITY)).resolves.toEqual([])
    await expect(workingTransport.listCategories(CITY)).resolves.toEqual([])
  })
})

describe("CatalogTransport — broken means throw", () => {
  it.each([
    ["listAreas", () => brokenTransport.listAreas(CITY)],
    [
      "listAreaRestaurants",
      () => brokenTransport.listAreaRestaurants(CITY, AREA)
    ],
    ["getRestaurant", () => brokenTransport.getRestaurant(CITY, KNOWN)],
    ["getRestaurantMenu", () => brokenTransport.getRestaurantMenu(CITY, KNOWN)],
    [
      "getRestaurantPhotos",
      () => brokenTransport.getRestaurantPhotos(CITY, KNOWN)
    ],
    ["getItem", () => brokenTransport.getItem(CITY, KNOWN, KNOWN_ITEM)],
    ["search", () => brokenTransport.search("bbq")],
    ["getHomeSections", () => brokenTransport.getHomeSections(CITY)],
    ["listCategories", () => brokenTransport.listCategories(CITY)]
  ])("%s rejects instead of resolving null", async (_name, call) => {
    await expect(call()).rejects.toThrow("upstream unavailable")
  })
})
