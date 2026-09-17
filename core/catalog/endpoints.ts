import {
  areaListingQuerySchema,
  catalogEnvelopeSchema,
  catalogSearchQuerySchema,
  catalogSearchResultsSchema,
  categoriesPayloadSchema,
  discoveryPageSchema,
  discoveryRestaurantSchema,
  homeDataPayloadSchema,
  homeListingQuerySchema,
  menuCategorySchema,
  menuItemDetailSchema,
  photoArraySchema,
  restaurantDetailSchema,
  type Slug
} from "./schemas"

/**
 * Public catalog paths on `business-discovery-backend`, relative and with **no
 * leading slash**. The base URL a transport supplies is the service root plus
 * `/api/v1` — every path below carries its own surface prefix from there, so
 * one base serves all five reads.
 *
 * Two surfaces, deliberately:
 *
 * - **`public/*` — the guest catalog** (`be-2-3`). Slug-only, no session, guarded
 *   by the `x-public-api-key` service token. Confirmed against the running
 *   service on 2026-08-20.
 * - **`home/section/view-all` — the borrowed discovery listing** (`be-2-9`).
 *   Shared with the mobile app, so its response shape is the app's, not this
 *   domain's — see `discoveryPageSchema`.
 *
 * `citySlug` is **not** part of any API path. It was withdrawn from the backend
 * on 2026-08-19: slugs are globally unique and the city was never consulted.
 * The website still serves `/{city}/{segment}` page URLs for SEO — the city is
 * resolved against the taxonomy constant (`mw-0-12`) and dropped before the
 * call. Never reintroduce it here to make a page URL and an API path rhyme.
 *
 * There is no list-areas read and there will not be one: cities and areas ship
 * as a constant with the website, so a `CatalogTransport` resolves that half of
 * the domain locally. Do not "restore" a missing endpoint here.
 *
 * Definitions only. Nothing here fetches; `mw-5-1` owns the HTTP layer.
 *
 * Every read scoped to a parent record declares a `.nullable()` response, so
 * absence has exactly one encoding across the whole domain and `mw-5-1` can
 * produce the `null` that `CatalogTransport` documents. `listAreaRestaurants`
 * and `search` are not parent-scoped — they answer a query, and a miss is an
 * empty page, never `null`.
 */

/**
 * Builds the `public/restaurants/:restaurant` prefix the three detail reads
 * hang off. A restaurant slug is globally unique, so nothing else scopes it.
 * @param restaurantSlug - Validated restaurant slug
 * @returns Encoded `public/restaurants/{restaurantSlug}` path prefix
 */
function restaurantFolder(restaurantSlug: Slug): string {
  return `public/restaurants/${encodeURIComponent(restaurantSlug)}`
}

export const CATALOG_ENDPOINTS = {
  /**
   * Restaurants near one point that deliver to it, from the discovery listing
   * the mobile app already uses. Nothing is interpolated into the path — the
   * area is expressed as `lat`/`lng` plus `radiusKm` in the query string, so an
   * area page issues one call per `area.coordinates` entry, all at that area's
   * `radiusKm`, and dedupes by restaurant id.
   *
   * This is the **only** listing read. A dedicated `public/restaurants?lat&lng`
   * briefly existed and was deleted on 2026-08-20: it took no `radiusKm`, so its
   * only geographic bound was a brand-gated delivery-area filter, and on any
   * deployment where that gate is off it returned every active branch in the
   * database.
   *
   * The radius is required, and it is this domain's guard rather than the
   * service's: `radiusKm` is optional upstream and omitting it substitutes a
   * default the caller did not choose (~30km in a city ~10km across), which
   * makes every area page in one city return the same restaurants. See
   * `areaListingQuerySchema`. Do not relax it to match the backend's optionality.
   */
  listAreaRestaurants: {
    method: "GET",
    /**
     * Builds the discovery-listing path.
     * @returns The `home/section/view-all` path
     */
    path: () => "home/section/view-all",
    query: areaListingQuerySchema,
    response: catalogEnvelopeSchema(
      discoveryPageSchema(discoveryRestaurantSchema)
    )
  },
  /** One restaurant, everything the detail page renders. */
  getRestaurant: {
    method: "GET",
    /**
     * Builds the restaurant-detail path.
     * @param restaurantSlug - Validated restaurant slug
     * @returns Encoded `public/restaurants/{restaurantSlug}` path
     */
    path: (restaurantSlug: Slug) => restaurantFolder(restaurantSlug),
    response: catalogEnvelopeSchema(restaurantDetailSchema.nullable())
  },
  /** Full menu, grouped by category. */
  getRestaurantMenu: {
    method: "GET",
    /**
     * Builds the restaurant-menu path.
     * @param restaurantSlug - Validated restaurant slug
     * @returns Encoded `.../restaurants/{restaurantSlug}/menu` path
     */
    path: (restaurantSlug: Slug) => `${restaurantFolder(restaurantSlug)}/menu`,
    response: catalogEnvelopeSchema(menuCategorySchema.array().nullable())
  },
  /**
   * One item, with its whole variant / option / combination / add-on tree
   * (`be-2-13`).
   *
   * `itemKey` is the product **slug** or its UUID; both resolve at the endpoint
   * and both are encoded here, so a caller never has to know which it holds.
   * The slug is scoped to this restaurant's business — another tenant's slug
   * answers `data: null`, which this domain encodes as absence exactly like a
   * missing restaurant.
   *
   * `.nullable()`, and it carries **three** upstream conditions rather than one:
   * the key does not resolve, the item belongs to another tenant, and the item
   * has no active inventory at this branch (not sold here — distinct from sold
   * out, which keeps the row with `isAvailable: false`). All three are
   * indistinguishable by design and all three are a 404 to the caller.
   */
  getRestaurantItem: {
    method: "GET",
    /**
     * Builds the item-detail path.
     * @param restaurantSlug - Validated restaurant slug
     * @param itemKey - The item's slug, or its product UUID
     * @returns Encoded `.../restaurants/{restaurantSlug}/items/{itemKey}` path
     */
    path: (restaurantSlug: Slug, itemKey: string) =>
      `${restaurantFolder(restaurantSlug)}/items/${encodeURIComponent(itemKey)}`,
    response: catalogEnvelopeSchema(menuItemDetailSchema.nullable())
  },
  /** Gallery images. Cover plus logo today — there is no richer source yet. */
  getRestaurantPhotos: {
    method: "GET",
    /**
     * Builds the restaurant-photos path.
     * @param restaurantSlug - Validated restaurant slug
     * @returns Encoded `.../restaurants/{restaurantSlug}/photos` path
     */
    path: (restaurantSlug: Slug) =>
      `${restaurantFolder(restaurantSlug)}/photos`,
    // `photoArraySchema`, not `photoSchema.array()`: a stored reference the
    // domain cannot use drops that one photo instead of failing the read. The
    // `.nullable()` still carries "no such restaurant", which is a different
    // answer from "a restaurant with nothing to show".
    response: catalogEnvelopeSchema(photoArraySchema.nullable())
  },
  /** Free-text search over restaurant names, cuisines and dish names. */
  search: {
    method: "GET",
    /**
     * Builds the search path. Everything search takes is query-string-shaped,
     * so nothing is interpolated into the path — see `query` below for the
     * parameter contract.
     * @returns The `public/search` path
     */
    path: () => "public/search",
    query: catalogSearchQuerySchema,
    response: catalogEnvelopeSchema(catalogSearchResultsSchema)
  },
  /**
   * The home page's server-driven section stack (mw-1-10).
   *
   * Point-and-radius-shaped like `listAreaRestaurants`: there is no
   * city-scoped read on this contract, only a geo one. A city page fans this
   * out over every live area's points and merges — see `home-listing.ts`.
   */
  getHomeSections: {
    method: "GET",
    /**
     * Builds the home-sections path.
     * @returns The `home/data` path
     */
    path: () => "home/data",
    query: homeListingQuerySchema,
    response: catalogEnvelopeSchema(homeDataPayloadSchema)
  },
  /** The cuisine/category tiles a home page renders (mw-1-10). Same geo shape as {@link CATALOG_ENDPOINTS.getHomeSections}. */
  listCategories: {
    method: "GET",
    /**
     * Builds the categories path.
     * @returns The `categories` path
     */
    path: () => "categories",
    query: homeListingQuerySchema,
    response: catalogEnvelopeSchema(categoriesPayloadSchema)
  }
} as const
