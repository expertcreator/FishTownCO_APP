import type { TenantDeliveryChargeRule } from "../pricing/delivery-rule"
import type {
  AreaRestaurants,
  CategoryEntity,
  CatalogSearchResults,
  CityAreas,
  HomeSectionData,
  MenuCategory,
  MenuItemDetail,
  Photo,
  RestaurantDetail,
  Slug
} from "./schemas"

/**
 * Optional narrowing for `CatalogTransport.search`. `page` is 0-indexed.
 * The wire form is `catalogSearchQuerySchema` (`q` / `page` / `limit`); this is
 * the caller-facing shape, which already holds the query.
 *
 * There is no city scope. The service has no city dimension to search within —
 * the `city` parameter was withdrawn on 2026-08-19 — so an implementation that
 * accepted one would have to filter results itself against the taxonomy
 * constant. If a city-scoped search page is ever wanted, that filtering is a
 * deliberate feature with its own story, not an option flag here.
 */
export interface CatalogSearchOptions {
  page?: number
  limit?: number
}

/**
 * The only seam between screens and catalog data.
 *
 * `mw-0-3` implements it over fixtures and `mw-5-1` over HTTP; swapping them
 * must not touch a screen or add a method. Every implementation obeys the same
 * two-value contract:
 *
 * - **`null` means the record is absent** — the caller answers with
 *   `notFound()`.
 * - **A transport, network, status or parse failure throws** — the caller
 *   answers with an error boundary.
 *
 * Conflating them turns every unknown slug during an outage into a soft 404
 * that Google indexes, so no implementation may return `null` on failure.
 *
 * List methods scoped to a parent follow the same rule: `null` when the parent
 * does not exist, an empty collection when it exists and holds nothing. They
 * return the **parent record alongside its children** rather than a bare array,
 * so a page can render its own heading, intro copy and total without a second
 * round trip — and so `City` has a reachable source at all.
 */
export interface CatalogTransport {
  /**
   * Loads a city together with its areas.
   * @param citySlug - Validated city slug
   * @returns The city, its areas and the total, or `null` when the city does not exist
   * @throws When the upstream call or its parsing fails
   */
  listAreas(citySlug: Slug): Promise<CityAreas | null>

  /**
   * Loads an area together with the restaurants assigned to it.
   * @param citySlug - Validated city slug
   * @param areaSlug - Validated area slug
   * @returns The area, its restaurants and the total, or `null` when the area does not exist
   * @throws When the upstream call or its parsing fails
   */
  listAreaRestaurants(
    citySlug: Slug,
    areaSlug: Slug
  ): Promise<AreaRestaurants | null>

  /**
   * Loads one restaurant.
   * @param citySlug - Validated city slug
   * @param restaurantSlug - Validated restaurant slug
   * @returns The restaurant, or `null` when it does not exist
   * @throws When the upstream call or its parsing fails
   */
  getRestaurant(
    citySlug: Slug,
    restaurantSlug: Slug
  ): Promise<RestaurantDetail | null>

  /**
   * Loads a restaurant's menu, grouped by category.
   * @param citySlug - Validated city slug
   * @param restaurantSlug - Validated restaurant slug
   * @returns The menu categories, or `null` when the restaurant does not exist
   * @throws When the upstream call or its parsing fails
   */
  getRestaurantMenu(
    citySlug: Slug,
    restaurantSlug: Slug
  ): Promise<MenuCategory[] | null>

  /**
   * Loads one item off a restaurant's menu, with everything needed to configure
   * and price it.
   *
   * **The null-vs-throw contract applies here with an extra upstream condition
   * folded into the `null`.** The service answers `data: null` when the key does
   * not resolve, when the slug belongs to another tenant, **and** when the item
   * has no active inventory at this branch — that last one is "not sold here",
   * which is a different fact from "sold out" and is deliberately
   * indistinguishable to a caller. All three are absence: the caller shows no
   * overlay. Anything else — a transport failure, a bad status, a parse failure
   * — still throws, so an outage can never be rendered as "there is no such
   * dish".
   *
   * `citySlug` stays in the signature and is dropped before the HTTP call,
   * matching all five sibling reads: the city was withdrawn from every API path
   * on 2026-08-19 because slugs are globally unique, and a method that omitted
   * it here would be the one read whose shape did not match the others.
   * @param citySlug - Validated city slug, resolved from the taxonomy constant
   * @param restaurantSlug - Validated restaurant slug
   * @param itemKey - The item's slug, or its product UUID
   * @returns The item, or `null` when it does not resolve, belongs elsewhere, or is not sold at this branch
   * @throws When the upstream call or its parsing fails
   */
  getItem(
    citySlug: Slug,
    restaurantSlug: Slug,
    itemKey: string
  ): Promise<MenuItemDetail | null>

  /**
   * Loads a restaurant's gallery.
   * @param citySlug - Validated city slug
   * @param restaurantSlug - Validated restaurant slug
   * @returns The photos (possibly empty), or `null` when the restaurant does not exist
   * @throws When the upstream call or its parsing fails
   */
  getRestaurantPhotos(
    citySlug: Slug,
    restaurantSlug: Slug
  ): Promise<Photo[] | null>

  /**
   * Searches restaurants, cuisines and dish names.
   * @param query - Raw user query; never a slug
   * @param options - Optional city scope and 0-indexed pagination
   * @returns The result set, empty when nothing matches
   * @throws When the upstream call or its parsing fails
   */
  search(
    query: string,
    options?: CatalogSearchOptions
  ): Promise<CatalogSearchResults>

  /**
   * Loads the home page's server-driven section stack for a city (mw-1-10).
   *
   * **Always an array, unlike every parent-scoped method above.** A city that
   * resolves at all has a home feed, even one every section of which is empty,
   * so this carries no `| null` half of the null-vs-throw contract. A transport
   * failure still throws.
   *
   * Sections arrive in the order the backend decided (design brief §4). The
   * caller renders that order verbatim and omits empty sections; neither
   * decision belongs to this method.
   * @param citySlug - Validated city slug
   * @returns The ordered section list; `[]` when the city has nothing to show yet
   * @throws When the upstream call or its parsing fails
   */
  getHomeSections(citySlug: Slug): Promise<HomeSectionData[]>

  /**
   * Loads the cuisine/category tiles for a city (mw-1-10).
   *
   * Same "always an array" contract as {@link getHomeSections}.
   * @param citySlug - Validated city slug
   * @returns The tile list, ordered by `position`; `[]` when there is nothing to show
   * @throws When the upstream call or its parsing fails
   */
  listCategories(citySlug: Slug): Promise<CategoryEntity[]>

  /**
   * Loads a branch's effective delivery-charge rule — the tax rate and the
   * distance-derived fee the order will actually carry (`mw-4-2`).
   *
   * **Scoped by tenant id, not by slug**, which is the one read on this
   * interface that is: the endpoint is the discovery service's own
   * `tenants/:tenantId/delivery-charges`, shared with the mobile app, and it
   * predates the slug-only public surface.
   *
   * The null-vs-throw contract applies unchanged. `null` is absence — no such
   * tenant, or a tenant with no rule configured anywhere up the resolution
   * chain — and the caller carries on quoting the branch's flat fee, which is
   * exactly the pre-`mw-4-2` behaviour. A transport, status or parse failure
   * throws, so an outage can never be rendered as "this branch charges no tax".
   * @param tenantId - The branch's tenant id, from `RestaurantDetail.id`
   * @returns The effective rule, or `null` when there is none to read
   * @throws When the upstream call or its parsing fails
   */
  getDeliveryRule(tenantId: string): Promise<TenantDeliveryChargeRule | null>
}
