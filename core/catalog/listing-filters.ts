/**
 * **This module imports nothing, and that is a byte decision.**
 *
 * It is the one piece of core the *client* leaf needs — the filter controls read
 * the URL and count matches with it — and it is imported there by its exact
 * path rather than through `@/core/catalog`. The barrel re-exports
 * `schemas.ts`, which is zod plus the whole `@/constants` package, so a single
 * barrel import from a `"use client"` file put 70.4 KB gzipped of parser into
 * the bundle of a page whose entire purpose is to be cheap on an entry-level
 * Android phone: `/gujranwala/magnoliya-park` measured 476.8 KB with it and
 * 406.4 KB without. `SLUG_REGEX` lives in `schemas.ts` and dragged the same
 * graph, which is why the route-shape half of this domain sits in
 * `listing-indexability.ts` instead — only the middleware needs it, and the
 * middleware is not a bundle anybody downloads.
 */

/**
 * The query parameters an area listing's filter and sort controls own.
 *
 * **One declaration, three consumers.** The client leaf builds its nuqs parsers
 * from this, the middleware decides indexability from it, and the pre-hydration
 * script is serialised out of it. It started as three hand-kept copies guarded
 * by a comment, which is how a fourth filter ships an indexable duplicate URL
 * that nobody notices until Search Console reports it.
 *
 * Every parameter has a **default that means "not narrowed"**, and the default
 * is a value rather than an absence. nuqs erases a parameter equal to its
 * default, so switching a filter back off restores the clean URL rather than
 * leaving `?open=0` behind — and the middleware can tell a genuinely narrowed
 * URL from one that merely spells out the canonical view.
 *
 * There is deliberately no `hybrid` fulfillment option. A restaurant that does
 * both answers either question a visitor is asking, so it stays visible under
 * both; offering "delivery and pickup" as a third choice would ask the visitor
 * to think about our enum instead of about their dinner.
 */
export const AREA_FILTERS = {
  fulfillment: {
    default: "any",
    values: ["any", "delivery", "pickup"]
  },
  open: {
    default: "0",
    values: ["0", "1"]
  },
  sort: {
    default: "recommended",
    values: ["recommended", "rating"]
  }
} as const

/** A parameter name the area listing owns. */
export type AreaFilterName = keyof typeof AREA_FILTERS

/**
 * Names of the parameters {@link AREA_FILTERS} declares.
 *
 * Typed as `AreaFilterName[]` rather than inferred from `Object.keys`, which
 * widens to `string[]`. `listing-filters.test.ts` asserts the two agree in both
 * directions, so a parameter added to one and forgotten in the other fails a
 * test rather than shipping a filter the middleware cannot see.
 */
export const AREA_FILTER_NAMES: readonly AreaFilterName[] = [
  "fulfillment",
  "open",
  "sort"
]

/** The fulfillment values the filter offers, `any` included. */
export type AreaFulfillmentFilter =
  (typeof AREA_FILTERS)["fulfillment"]["values"][number]

/** The orders the sort control offers. */
export type AreaSortOrder = (typeof AREA_FILTERS)["sort"]["values"][number]

/**
 * A resolved filter selection, in the form a renderer actually uses.
 *
 * `openOnly` is a boolean here and `"0" | "1"` in the URL: the URL form exists
 * so the parameter reads as a flag to a human editing it, and nothing past the
 * parser should have to know that.
 */
export interface AreaFilterState {
  readonly openOnly: boolean
  readonly fulfillment: AreaFulfillmentFilter
  readonly sort: AreaSortOrder
}

/** What an unfiltered area page shows: everything, in the recommended order. */
export const UNFILTERED_AREA_STATE: AreaFilterState = {
  fulfillment: "any",
  openOnly: false,
  sort: "recommended"
}

/**
 * Reads one parameter, falling back to its default for anything unrecognised.
 * @param searchParams - The URL's query string
 * @param name - The parameter to read
 * @returns The value, or the parameter's default when absent or not one of ours
 */
function readParam(
  searchParams: URLSearchParams,
  name: AreaFilterName
): string {
  const raw = searchParams.get(name)
  const allowed: readonly string[] = AREA_FILTERS[name].values

  return raw !== null && allowed.includes(raw)
    ? raw
    : AREA_FILTERS[name].default
}

/**
 * Resolves a URL's query string into a filter selection.
 *
 * Anything unrecognised falls back to that parameter's default rather than
 * being carried through — a hand-edited `?sort=cheapest` must not be able to
 * put an arbitrary string into an attribute selector on the page.
 * @param searchParams - The URL's query string
 * @returns The selection to render
 * @example readAreaFilterState(new URLSearchParams("?open=1")).openOnly // -> true
 */
export function readAreaFilterState(
  searchParams: URLSearchParams
): AreaFilterState {
  return {
    fulfillment: readParam(
      searchParams,
      "fulfillment"
    ) as AreaFulfillmentFilter,
    openOnly: readParam(searchParams, "open") === "1",
    sort: readParam(searchParams, "sort") as AreaSortOrder
  }
}

/**
 * Whether a URL asks for a **narrowed or re-sorted** view of an area page.
 *
 * Presence is not enough, and that is the whole point: `?sort=recommended`
 * describes the page the canonical URL already serves, so de-indexing it would
 * suppress a duplicate that is not one. Only a recognised parameter carrying a
 * recognised, non-default value counts — `?sort=cheapest` is nonsense the page
 * ignores, and a page that ignores a parameter should still be indexable at it.
 * @param searchParams - The URL's query string
 * @returns `true` when the URL genuinely narrows or re-sorts the listing
 * @example isNarrowedAreaListingUrl(new URLSearchParams("?sort=recommended")) // -> false
 */
export function isNarrowedAreaListingUrl(
  searchParams: URLSearchParams
): boolean {
  return AREA_FILTER_NAMES.some((name) => {
    const raw = searchParams.get(name)
    const allowed: readonly string[] = AREA_FILTERS[name].values

    return (
      raw !== null &&
      allowed.includes(raw) &&
      raw !== AREA_FILTERS[name].default
    )
  })
}

/**
 * Whether one card survives a filter selection.
 *
 * **This is the counting half of a rule whose visual half is CSS.** The grid
 * hides cards with attribute selectors so that filtering costs no JavaScript and
 * no re-render; this function answers "how many are left", which the CSS cannot
 * report back. The two are written as the same predicate in the same shape —
 * exclusion, not inclusion — and `e2e/area-filters.spec.ts` is what proves they
 * still agree, because a unit test can only ever check one of them.
 *
 * A `hybrid` restaurant is excluded by neither fulfillment filter. That is the
 * invariant the exclusion form exists to express: it is a real answer to both
 * questions, so neither question hides it.
 * @param card - The facts the grid marks each card with
 * @param state - The current selection
 * @returns `true` when the card stays visible
 * @example matchesAreaFilters({ fulfillment: "hybrid", isOpen: true }, { fulfillment: "pickup", openOnly: false, sort: "recommended" }) // -> true
 */
export function matchesAreaFilters(
  card: { readonly isOpen: boolean; readonly fulfillment: string },
  state: AreaFilterState
): boolean {
  if (state.openOnly && !card.isOpen) {
    return false
  }

  if (state.fulfillment === "delivery" && card.fulfillment === "pickup") {
    return false
  }

  if (state.fulfillment === "pickup" && card.fulfillment === "delivery") {
    return false
  }

  return true
}

/**
 * The query parameters the **city home page**'s chip row owns.
 *
 * A second declaration rather than a widened {@link AREA_FILTERS}, because the
 * two pages genuinely narrow different things. `open` and `sort` are shared by
 * reference — identical questions, and a copy is a copy that drifts — but the
 * home grid has no fulfillment axis to offer: `homeTenantItemSchema` hardcodes
 * `fulfillment: "delivery"` in its transform (`schemas.ts:1105`), so every home
 * card answers "delivery" and a fulfillment chip there would be a control that
 * never changes the result. The area listing, whose rows carry a real
 * fulfillment, keeps it.
 *
 * The mock's other two chips are absent for the same reason and it is worth
 * recording which: "Offers" has no source on a `RestaurantSummary` —
 * `compareAtPrice` exists on dishes only — and "All filters" opened a sheet
 * with nothing left to put in it once these three are on the row.
 *
 * Same "default means not narrowed" rule as {@link AREA_FILTERS}, for the same
 * reason: nuqs erases a parameter equal to its default, so clearing a chip
 * restores the clean URL and {@link isNarrowedHomeListingUrl} can tell a
 * genuinely narrowed page from one merely spelling out the canonical view.
 */
export const HOME_FILTERS = {
  freeDelivery: {
    default: "0",
    values: ["0", "1"]
  },
  open: AREA_FILTERS.open,
  rating4: {
    default: "0",
    values: ["0", "1"]
  },
  sort: AREA_FILTERS.sort
} as const

/** A parameter name the city home listing owns. */
export type HomeFilterName = keyof typeof HOME_FILTERS

/**
 * Names of the parameters {@link HOME_FILTERS} declares.
 *
 * Typed rather than inferred from `Object.keys`, which widens to `string[]` —
 * see {@link AREA_FILTER_NAMES}.
 */
export const HOME_FILTER_NAMES: readonly HomeFilterName[] = [
  "freeDelivery",
  "open",
  "rating4",
  "sort"
]

/** A resolved home selection, in the form a renderer actually uses. */
export interface HomeFilterState {
  readonly openOnly: boolean
  readonly rating4Plus: boolean
  readonly freeDeliveryOnly: boolean
  readonly sort: AreaSortOrder
}

/** What an unfiltered home grid shows: everything, in the recommended order. */
export const UNFILTERED_HOME_STATE: HomeFilterState = {
  freeDeliveryOnly: false,
  openOnly: false,
  rating4Plus: false,
  sort: "recommended"
}

/**
 * Reads one home parameter, falling back to its default for anything unrecognised.
 * @param searchParams - The URL's query string
 * @param name - The parameter to read
 * @returns The value, or the parameter's default when absent or not one of ours
 */
function readHomeParam(
  searchParams: URLSearchParams,
  name: HomeFilterName
): string {
  const raw = searchParams.get(name)
  const allowed: readonly string[] = HOME_FILTERS[name].values

  return raw !== null && allowed.includes(raw)
    ? raw
    : HOME_FILTERS[name].default
}

/**
 * Resolves a URL's query string into a home filter selection.
 *
 * Anything unrecognised falls back to that parameter's default rather than
 * being carried through — a hand-edited `?sort=cheapest` must not be able to
 * put an arbitrary string into an attribute selector on the page.
 * @param searchParams - The URL's query string
 * @returns The selection to render
 * @example readHomeFilterState(new URLSearchParams("?rating4=1")).rating4Plus // -> true
 */
export function readHomeFilterState(
  searchParams: URLSearchParams
): HomeFilterState {
  return {
    freeDeliveryOnly: readHomeParam(searchParams, "freeDelivery") === "1",
    openOnly: readHomeParam(searchParams, "open") === "1",
    rating4Plus: readHomeParam(searchParams, "rating4") === "1",
    sort: readHomeParam(searchParams, "sort") as AreaSortOrder
  }
}

/**
 * Whether a URL asks for a **narrowed or re-sorted** view of a city home page.
 *
 * The city home page is indexable and is the entry point for `/{city}` search
 * traffic, so a chip that produced an indexable `?rating4=1` duplicate of it
 * would be an own goal — `shouldNoindexListingUrl` reads this.
 *
 * Presence is not enough, exactly as in {@link isNarrowedAreaListingUrl}:
 * `?sort=recommended` describes the page the canonical URL already serves.
 * @param searchParams - The URL's query string
 * @returns `true` when the URL genuinely narrows or re-sorts the home grid
 * @example isNarrowedHomeListingUrl(new URLSearchParams("?sort=recommended")) // -> false
 */
export function isNarrowedHomeListingUrl(
  searchParams: URLSearchParams
): boolean {
  if (isUsableCategoryId(searchParams.get(HOME_CATEGORY_PARAM))) {
    return true
  }

  return HOME_FILTER_NAMES.some((name) => {
    const raw = searchParams.get(name)
    const allowed: readonly string[] = HOME_FILTERS[name].values

    return (
      raw !== null &&
      allowed.includes(raw) &&
      raw !== HOME_FILTERS[name].default
    )
  })
}

/**
 * Whether one home card survives a filter selection.
 *
 * The counting half of a rule whose visual half is CSS — see
 * {@link matchesAreaFilters}, which this mirrors deliberately, exclusion form
 * and all. Every fact arrives precomputed as a boolean because the grid marks
 * each card with one: the derivations (`isOpenForListing`,
 * `isRating4PlusForListing`, `isFreeDeliveryForListing`) live in
 * `area-listing.ts` and run on the server, so this module keeps importing
 * nothing and the client leaf stays cheap.
 * @param card - The facts the grid marks each card with
 * @param state - The current selection
 * @returns `true` when the card stays visible
 * @example matchesHomeFilters({ isFreeDelivery: false, isOpen: true, isRating4Plus: true }, { freeDeliveryOnly: false, openOnly: true, rating4Plus: true, sort: "recommended" }) // -> true
 */
export function matchesHomeFilters(
  card: {
    readonly isOpen: boolean
    readonly isRating4Plus: boolean
    readonly isFreeDelivery: boolean
  },
  state: HomeFilterState
): boolean {
  if (state.openOnly && !card.isOpen) {
    return false
  }

  if (state.rating4Plus && !card.isRating4Plus) {
    return false
  }

  if (state.freeDeliveryOnly && !card.isFreeDelivery) {
    return false
  }

  return true
}

/**
 * The query parameter the city home page's **category tiles** own.
 *
 * Declared apart from {@link HOME_FILTERS}, and the reason is a real difference
 * in kind rather than tidiness: every member of `HOME_FILTERS` is a closed set
 * of values, which is what lets nuqs build a `parseAsStringLiteral`, lets the
 * pre-hydration script check membership, and lets a CSS attribute selector
 * express the whole rule statically. A category is an **opaque id from the
 * producer** — unbounded, unknowable at build time — so none of those three
 * mechanisms apply to it. Folding it into `HOME_FILTERS` would have quietly
 * broken all three.
 *
 * The consequence, stated because it is the one asymmetry in this feature:
 * category matching is computed in JavaScript and written onto each card as
 * `data-category-match`, and CSS only hides what that marks. The other filters
 * are pure CSS. See `city-home-screen.tsx`.
 */
export const HOME_CATEGORY_PARAM = "category"

/**
 * The character class a category id may occupy.
 *
 * Deliberately conservative rather than a uuid pattern — see
 * {@link isUsableCategoryId} for why.
 */
const CATEGORY_ID_SHAPE = /^[A-Za-z0-9-]+$/

/**
 * Whether a raw `?category=` value is a shape worth applying.
 *
 * The producer's ids are uuids, but this deliberately checks a **conservative
 * character class rather than a uuid pattern**: the value is written into a DOM
 * attribute and compared against one, and the job here is to refuse anything
 * that could be something other than an identifier. A stricter uuid test would
 * also silently stop working the day the producer changes its id format, which
 * is a worse failure than accepting a harmless id-shaped string that simply
 * matches no card.
 * @param raw - The raw parameter value
 * @returns `true` when the value may be used as a category selection
 * @example isUsableCategoryId("018f-3b2a") // -> true
 */
export function isUsableCategoryId(raw: string | null): raw is string {
  return (
    raw !== null &&
    raw.length > 0 &&
    raw.length <= 64 &&
    CATEGORY_ID_SHAPE.test(raw)
  )
}

/**
 * Reads the selected category from a URL, if it named a usable one.
 * @param searchParams - The URL's query string
 * @returns The selected category id, or `null` for the unfiltered view
 * @example readHomeCategory(new URLSearchParams("?category=abc")) // -> "abc"
 */
export function readHomeCategory(searchParams: URLSearchParams): string | null {
  const raw = searchParams.get(HOME_CATEGORY_PARAM)

  return isUsableCategoryId(raw) ? raw : null
}

/**
 * Whether one card survives a category selection.
 *
 * **A card with no category never matches a selection.** An uncategorised
 * record is not evidence of belonging to the tile that was pressed, and showing
 * it would make the tile look broken in exactly the case the producer has the
 * least information. It is shown again the moment the selection is cleared.
 * @param cardCategoryId - The card's own category, or `null` when it names none
 * @param selected - The selected category, or `null` for the unfiltered view
 * @returns `true` when the card stays visible
 * @example matchesHomeCategory(null, "abc") // -> false
 */
export function matchesHomeCategory(
  cardCategoryId: string | null,
  selected: string | null
): boolean {
  if (selected === null) {
    return true
  }

  return cardCategoryId === selected
}
