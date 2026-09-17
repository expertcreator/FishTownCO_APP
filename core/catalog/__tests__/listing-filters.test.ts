import { describe, expect, it } from "vitest"
import {
  AREA_FILTER_NAMES,
  AREA_FILTERS,
  type AreaFilterState,
  HOME_FILTER_NAMES,
  HOME_FILTERS,
  isNarrowedAreaListingUrl,
  isNarrowedHomeListingUrl,
  isUsableCategoryId,
  matchesAreaFilters,
  matchesHomeCategory,
  matchesHomeFilters,
  readAreaFilterState,
  readHomeCategory,
  readHomeFilterState,
  UNFILTERED_AREA_STATE,
  UNFILTERED_HOME_STATE
} from "../listing-filters"
import {
  isAreaListingPath,
  isCityHomePath,
  shouldNoindexListingUrl
} from "../listing-indexability"

/** The locales this site serves as a URL prefix; the default carries none. */
const LOCALES = ["en", "ur"]

/**
 * Builds a query string.
 * @param query - The raw query, with or without a leading `?`
 * @returns The parsed parameters
 */
function params(query: string): URLSearchParams {
  return new URLSearchParams(query)
}

/**
 * Builds a filter selection from the fields a case is about.
 * @param overrides - The fields under test
 * @returns The selection
 */
function state(overrides: Partial<AreaFilterState> = {}): AreaFilterState {
  return { ...UNFILTERED_AREA_STATE, ...overrides }
}

describe("AREA_FILTERS — the single declaration", () => {
  it("names exactly the parameters it declares", () => {
    // The middleware and the client leaf both read this. A parameter added to
    // one and forgotten in the other ships an indexable duplicate URL.
    expect([...AREA_FILTER_NAMES].sort()).toEqual(
      Object.keys(AREA_FILTERS).sort()
    )
  })

  it("gives every parameter a default that is one of its own values", () => {
    for (const name of AREA_FILTER_NAMES) {
      const { default: fallback, values } = AREA_FILTERS[name]

      expect(values as readonly string[]).toContain(fallback)
    }
  })

  it("describes the unfiltered view with those same defaults", () => {
    expect(UNFILTERED_AREA_STATE.fulfillment).toBe(
      AREA_FILTERS.fulfillment.default
    )
    expect(UNFILTERED_AREA_STATE.sort).toBe(AREA_FILTERS.sort.default)
    // The open flag is `"0" | "1"` in the URL and a boolean past the parser.
    expect(UNFILTERED_AREA_STATE.openOnly).toBe(false)
    expect(AREA_FILTERS.open.default).toBe("0")
  })

  it("offers no hybrid fulfillment option", () => {
    // A restaurant that does both answers either question, so it is never a
    // third choice a visitor has to reason about.
    expect(AREA_FILTERS.fulfillment.values as readonly string[]).not.toContain(
      "hybrid"
    )
  })
})

describe("readAreaFilterState", () => {
  it("reads a selection out of the query string", () => {
    expect(
      readAreaFilterState(params("?open=1&fulfillment=pickup&sort=rating"))
    ).toEqual({ fulfillment: "pickup", openOnly: true, sort: "rating" })
  })

  it("falls back to the unfiltered view for an empty query", () => {
    expect(readAreaFilterState(params(""))).toEqual(UNFILTERED_AREA_STATE)
  })

  it("ignores a value that is not one of ours", () => {
    // A hand-edited URL must not be able to put an arbitrary string into an
    // attribute selector on the page.
    expect(
      readAreaFilterState(params("?sort=cheapest&fulfillment=<script>"))
    ).toEqual(UNFILTERED_AREA_STATE)
  })

  it("reads only `1` as the open filter being on", () => {
    expect(readAreaFilterState(params("?open=0")).openOnly).toBe(false)
    expect(readAreaFilterState(params("?open=true")).openOnly).toBe(false)
    expect(readAreaFilterState(params("?open=1")).openOnly).toBe(true)
  })
})

describe("isNarrowedAreaListingUrl", () => {
  it("is false for a clean URL", () => {
    expect(isNarrowedAreaListingUrl(params(""))).toBe(false)
  })

  it("is true for a recognised, non-default value", () => {
    expect(isNarrowedAreaListingUrl(params("?open=1"))).toBe(true)
    expect(isNarrowedAreaListingUrl(params("?fulfillment=pickup"))).toBe(true)
    expect(isNarrowedAreaListingUrl(params("?sort=rating"))).toBe(true)
  })

  it("is FALSE for a parameter spelled out at its default", () => {
    // `?sort=recommended` describes the page the canonical URL already serves.
    // De-indexing it would suppress a duplicate that is not one.
    expect(isNarrowedAreaListingUrl(params("?sort=recommended"))).toBe(false)
    expect(isNarrowedAreaListingUrl(params("?open=0"))).toBe(false)
    expect(isNarrowedAreaListingUrl(params("?fulfillment=any"))).toBe(false)
  })

  it("is false for a value the page ignores", () => {
    // A page that ignores a parameter should still be indexable at it.
    expect(isNarrowedAreaListingUrl(params("?sort=cheapest"))).toBe(false)
  })

  it("is false for a parameter that is not ours at all", () => {
    expect(isNarrowedAreaListingUrl(params("?utm_source=whatsapp"))).toBe(false)
  })

  it("is true when one of several parameters narrows", () => {
    expect(isNarrowedAreaListingUrl(params("?sort=recommended&open=1"))).toBe(
      true
    )
  })
})

describe("isAreaListingPath", () => {
  it("accepts the two-segment catalog shape", () => {
    expect(isAreaListingPath("/gujranwala/magnoliya-park", LOCALES)).toBe(true)
  })

  it("accepts it behind a locale prefix", () => {
    expect(isAreaListingPath("/ur/gujranwala/magnoliya-park", LOCALES)).toBe(
      true
    )
  })

  it("tolerates a trailing slash", () => {
    expect(isAreaListingPath("/gujranwala/magnoliya-park/", LOCALES)).toBe(true)
  })

  it("rejects everything shorter or longer", () => {
    expect(isAreaListingPath("/", LOCALES)).toBe(false)
    expect(isAreaListingPath("/gujranwala", LOCALES)).toBe(false)
    expect(isAreaListingPath("/gujranwala/al-rehman-tikka/menu", LOCALES)).toBe(
      false
    )
  })

  it("rejects a reserved first segment", () => {
    // `/cart/x` is a 404, not an area page — and `/search?sort=...` is exactly
    // the generic-parameter case this guard exists for.
    expect(isAreaListingPath("/cart/checkout", LOCALES)).toBe(false)
    expect(isAreaListingPath("/search/anything", LOCALES)).toBe(false)
  })

  it("rejects a segment that is not slug-shaped", () => {
    expect(isAreaListingPath("/gujranwala/Café Bar", LOCALES)).toBe(false)
    expect(isAreaListingPath("/Gujranwala/magnoliya-park", LOCALES)).toBe(false)
  })

  it("treats a locale-shaped city as a locale only when it is one", () => {
    // `/en/x` is the default locale spelled out, which this site does not serve
    // — two segments after stripping it is one, so it is not this shape.
    expect(isAreaListingPath("/en/gujranwala", LOCALES)).toBe(false)
    // `/ur` is a real prefix, so the same path with a real pair behind it is.
    expect(isAreaListingPath("/ur/gujranwala/x", LOCALES)).toBe(true)
  })
})

describe("shouldNoindexListingUrl", () => {
  it("de-indexes a narrowed area page", () => {
    expect(
      shouldNoindexListingUrl(
        "/gujranwala/magnoliya-park",
        params("?open=1"),
        LOCALES
      )
    ).toBe(true)
  })

  it("leaves the clean area page indexable", () => {
    expect(
      shouldNoindexListingUrl("/gujranwala/magnoliya-park", params(""), LOCALES)
    ).toBe(false)
  })

  it("does not de-index another route that happens to use `sort`", () => {
    // The middleware matcher covers every non-asset path, so an unscoped rule
    // would drop any page carrying a parameter with a name this generic.
    expect(shouldNoindexListingUrl("/", params("?sort=rating"), LOCALES)).toBe(
      false
    )
    expect(
      shouldNoindexListingUrl("/search", params("?sort=rating"), LOCALES)
    ).toBe(false)
    expect(
      shouldNoindexListingUrl(
        "/gujranwala/al-rehman-tikka/menu",
        params("?sort=rating"),
        LOCALES
      )
    ).toBe(false)
  })

  it("does not de-index a default value on the right route", () => {
    expect(
      shouldNoindexListingUrl(
        "/ur/gujranwala/magnoliya-park",
        params("?sort=recommended"),
        LOCALES
      )
    ).toBe(false)
  })
})

describe("matchesAreaFilters", () => {
  const openDelivery = { fulfillment: "delivery", isOpen: true }
  const closedDelivery = { fulfillment: "delivery", isOpen: false }
  const openPickup = { fulfillment: "pickup", isOpen: true }
  const openHybrid = { fulfillment: "hybrid", isOpen: true }

  it("matches everything when nothing is selected", () => {
    for (const card of [openDelivery, closedDelivery, openPickup, openHybrid]) {
      expect(matchesAreaFilters(card, UNFILTERED_AREA_STATE)).toBe(true)
    }
  })

  it("drops a closed restaurant under the open filter", () => {
    expect(matchesAreaFilters(closedDelivery, state({ openOnly: true }))).toBe(
      false
    )
    expect(matchesAreaFilters(openDelivery, state({ openOnly: true }))).toBe(
      true
    )
  })

  it("keeps a HYBRID restaurant under both fulfillment filters", () => {
    // The invariant the exclusion form exists to express: it is a real answer
    // to both questions, so neither question hides it. Written as an inclusion
    // it would vanish from both.
    expect(
      matchesAreaFilters(openHybrid, state({ fulfillment: "delivery" }))
    ).toBe(true)
    expect(
      matchesAreaFilters(openHybrid, state({ fulfillment: "pickup" }))
    ).toBe(true)
  })

  it("drops pickup-only under the delivery filter, and the reverse", () => {
    expect(
      matchesAreaFilters(openPickup, state({ fulfillment: "delivery" }))
    ).toBe(false)
    expect(
      matchesAreaFilters(openDelivery, state({ fulfillment: "pickup" }))
    ).toBe(false)
  })

  it("applies both filters together", () => {
    expect(
      matchesAreaFilters(
        closedDelivery,
        state({ fulfillment: "delivery", openOnly: true })
      )
    ).toBe(false)
  })

  it("ignores the sort, which reorders rather than narrows", () => {
    for (const card of [openDelivery, closedDelivery, openPickup, openHybrid]) {
      expect(matchesAreaFilters(card, state({ sort: "rating" }))).toBe(true)
    }
  })
})

describe("HOME_FILTER_NAMES", () => {
  it("names every key HOME_FILTERS declares, and only those", () => {
    expect([...HOME_FILTER_NAMES].sort()).toEqual(
      Object.keys(HOME_FILTERS).sort()
    )
  })

  it("gives every home parameter a default that is one of its own values", () => {
    for (const name of HOME_FILTER_NAMES) {
      const parameter: {
        readonly default: string
        readonly values: readonly string[]
      } = HOME_FILTERS[name]

      expect(parameter.values).toContain(parameter.default)
    }
  })

  it("shares `open` and `sort` with the area row rather than restating them", () => {
    // By reference, so a value added to one can never be missing from the other.
    expect(HOME_FILTERS.open).toBe(AREA_FILTERS.open)
    expect(HOME_FILTERS.sort).toBe(AREA_FILTERS.sort)
  })

  it("offers no fulfillment axis, because every home card is delivery", () => {
    // `homeTenantItemSchema` hardcodes `fulfillment: "delivery"`, so a chip here
    // would be a control that never changes the result.
    expect(HOME_FILTER_NAMES).not.toContain("fulfillment")
  })
})

describe("readHomeFilterState", () => {
  it("reads the unfiltered view from an empty query string", () => {
    expect(readHomeFilterState(new URLSearchParams(""))).toEqual(
      UNFILTERED_HOME_STATE
    )
  })

  it("reads every toggle", () => {
    const state = readHomeFilterState(
      new URLSearchParams("?open=1&rating4=1&freeDelivery=1&sort=rating")
    )

    expect(state).toEqual({
      freeDeliveryOnly: true,
      openOnly: true,
      rating4Plus: true,
      sort: "rating"
    })
  })

  it("falls back to the default for a value it does not recognise", () => {
    // A hand-edited value must not reach an attribute selector on the page.
    const state = readHomeFilterState(
      new URLSearchParams("?sort=cheapest&rating4=yes")
    )

    expect(state.sort).toBe("recommended")
    expect(state.rating4Plus).toBe(false)
  })
})

describe("isNarrowedHomeListingUrl", () => {
  it("is false for a URL that merely spells out the canonical view", () => {
    expect(
      isNarrowedHomeListingUrl(new URLSearchParams("?sort=recommended&open=0"))
    ).toBe(false)
  })

  it("is false for a parameter the page ignores", () => {
    expect(
      isNarrowedHomeListingUrl(new URLSearchParams("?sort=cheapest"))
    ).toBe(false)
  })

  it.each([
    "?open=1",
    "?rating4=1",
    "?freeDelivery=1",
    "?sort=rating"
  ])("is true for %s", (query) => {
    expect(isNarrowedHomeListingUrl(new URLSearchParams(query))).toBe(true)
  })
})

describe("matchesHomeFilters", () => {
  const everything = {
    isFreeDelivery: true,
    isOpen: true,
    isRating4Plus: true
  }

  it("keeps every card under the unfiltered selection", () => {
    expect(
      matchesHomeFilters(
        { isFreeDelivery: false, isOpen: false, isRating4Plus: false },
        UNFILTERED_HOME_STATE
      )
    ).toBe(true)
  })

  it.each([
    ["openOnly", { ...UNFILTERED_HOME_STATE, openOnly: true }, "isOpen"],
    [
      "rating4Plus",
      { ...UNFILTERED_HOME_STATE, rating4Plus: true },
      "isRating4Plus"
    ],
    [
      "freeDeliveryOnly",
      { ...UNFILTERED_HOME_STATE, freeDeliveryOnly: true },
      "isFreeDelivery"
    ]
  ] as const)("%s excludes exactly the cards lacking the fact", (_name, state, fact) => {
    expect(matchesHomeFilters(everything, state)).toBe(true)
    expect(matchesHomeFilters({ ...everything, [fact]: false }, state)).toBe(
      false
    )
  })

  it("requires every applied toggle at once, not any of them", () => {
    const allOn = {
      freeDeliveryOnly: true,
      openOnly: true,
      rating4Plus: true,
      sort: "recommended"
    } as const

    expect(matchesHomeFilters(everything, allOn)).toBe(true)
    // Two out of three is not a match — this is what a mistakenly-`||`'d
    // predicate would get wrong while every single-toggle case above passed.
    expect(
      matchesHomeFilters({ ...everything, isFreeDelivery: false }, allOn)
    ).toBe(false)
  })

  it("does not narrow on sort", () => {
    const card = { isFreeDelivery: false, isOpen: false, isRating4Plus: false }

    expect(
      matchesHomeFilters(card, { ...UNFILTERED_HOME_STATE, sort: "rating" })
    ).toBe(true)
  })
})

describe("isCityHomePath", () => {
  it.each([
    ["/gujranwala", true],
    ["/ur/gujranwala", true],
    ["/gujranwala/magnoliya-park", false],
    ["/", false],
    ["/search", false],
    ["/Gujranwala", false]
  ])("%s -> %s", (pathname, expected) => {
    expect(isCityHomePath(pathname, LOCALES)).toBe(expected)
  })
})

describe("shouldNoindexListingUrl — city home pages", () => {
  it("leaves the canonical city page indexable", () => {
    expect(
      shouldNoindexListingUrl("/gujranwala", new URLSearchParams(""), LOCALES)
    ).toBe(false)
  })

  it("de-indexes a narrowed city page", () => {
    // Without this the chip row would publish an indexable duplicate of the
    // page `/{city}` search traffic actually lands on.
    expect(
      shouldNoindexListingUrl(
        "/gujranwala",
        new URLSearchParams("?rating4=1"),
        LOCALES
      )
    ).toBe(true)
  })

  it("judges a city page by the HOME parameters, not the area ones", () => {
    // `fulfillment` is an area parameter. The home page ignores it, and a page
    // that ignores a parameter should still be indexable at it.
    expect(
      shouldNoindexListingUrl(
        "/gujranwala",
        new URLSearchParams("?fulfillment=pickup"),
        LOCALES
      )
    ).toBe(false)
  })
})

describe("isUsableCategoryId", () => {
  it.each([
    ["018f3b2a-1c4d-7e8f-9a0b-1c2d3e4f5a6b", true],
    ["cat-pizza", true],
    [null, false],
    ["", false],
    // Anything that could be read as something other than an identifier: the
    // value is written into a DOM attribute and compared against one.
    ['" onload="x', false],
    ["a b", false],
    ["a".repeat(65), false]
  ])("%s -> %s", (raw, expected) => {
    expect(isUsableCategoryId(raw)).toBe(expected)
  })
})

describe("readHomeCategory", () => {
  it("reads a usable id", () => {
    expect(readHomeCategory(new URLSearchParams("?category=cat-pizza"))).toBe(
      "cat-pizza"
    )
  })

  it("is null for an absent or unusable value", () => {
    expect(readHomeCategory(new URLSearchParams(""))).toBeNull()
    expect(readHomeCategory(new URLSearchParams("?category=a b"))).toBeNull()
  })
})

describe("matchesHomeCategory", () => {
  it("keeps every card when nothing is selected", () => {
    expect(matchesHomeCategory("cat-pizza", null)).toBe(true)
    expect(matchesHomeCategory(null, null)).toBe(true)
  })

  it("keeps only the selected category", () => {
    expect(matchesHomeCategory("cat-pizza", "cat-pizza")).toBe(true)
    expect(matchesHomeCategory("cat-burger", "cat-pizza")).toBe(false)
  })

  it("never keeps an uncategorised card under a selection", () => {
    // An uncategorised record is not evidence of belonging to the tile pressed,
    // and showing it would make the tile look broken in exactly the case the
    // producer knows least.
    expect(matchesHomeCategory(null, "cat-pizza")).toBe(false)
  })
})

describe("isNarrowedHomeListingUrl — category", () => {
  it("is true for a usable category, so the URL is de-indexed", () => {
    expect(
      isNarrowedHomeListingUrl(new URLSearchParams("?category=cat-pizza"))
    ).toBe(true)
  })

  it("is false for a category the page would ignore", () => {
    // A page that ignores a parameter should still be indexable at it.
    expect(isNarrowedHomeListingUrl(new URLSearchParams("?category=a b"))).toBe(
      false
    )
  })
})
