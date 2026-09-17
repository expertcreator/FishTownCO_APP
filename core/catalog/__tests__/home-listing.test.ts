import { describe, expect, it } from "vitest"
import {
  type HomeListingSource,
  mergeCategoryPages,
  mergeHomeSectionsPages,
  planHomeListingRequests
} from "../home-listing"
import {
  categoryEntitySchema,
  homeSectionSchema,
  type HomeSectionData,
  type CategoryEntity
} from "../schemas"

/** Two points inside Magnoliya Park, reused wherever the exact place is irrelevant. */
const POINTS = [
  { latitude: 32.102_014, longitude: 74.208_89 },
  { latitude: 32.107_558, longitude: 74.207_746 }
]

/**
 * Builds a parsed `HomeSectionData` from the few fields a test cares about.
 * @param overrides - The section under test
 * @param overrides.section - The section key
 * @param overrides.ids - Ids of the tenant rows in this section's `data`
 * @param overrides.title - The section's own heading
 * @returns The parsed section
 */
function tenantSection(overrides: {
  section: string
  ids: readonly string[]
  title?: string
}): HomeSectionData {
  return homeSectionSchema.parse({
    data: overrides.ids.map((id) => ({
      businessHoursStatusKey: "open",
      coverPicture: null,
      deliveryFee: "0",
      freeDelivery: true,
      id,
      name: { en: id },
      nextOpenTime: null,
      openNow: true,
      rating: null,
      restaurantPicture: null,
      slug: id,
      totalReviews: 0
    })),
    metadata: {
      description: null,
      title: overrides.title ?? "Nearby top brands",
      totalCount: overrides.ids.length
    },
    section: overrides.section
  })
}

/**
 * Builds a parsed `HomeSectionData` for a dish-shaped (non-`topPlaces`)
 * section — `homeSectionSchema` parses `data` against `homeProductItemSchema`
 * for every section but `topPlaces`, so a fixture reusing `tenantSection`'s
 * restaurant-shaped rows would fail to parse here.
 * @param overrides - The section under test
 * @param overrides.section - The section key
 * @param overrides.ids - Ids of the dish rows in this section's `data`
 * @param overrides.title - The section's own heading
 * @returns The parsed section
 */
function productSection(overrides: {
  section: string
  ids: readonly string[]
  title?: string
}): HomeSectionData {
  return homeSectionSchema.parse({
    data: overrides.ids.map((id) => ({
      branch: { name: { en: "Al Rehman" } },
      id,
      images: [],
      name: { en: id },
      price: "650",
      slug: id
    })),
    metadata: {
      description: null,
      title: overrides.title ?? "Try something new",
      totalCount: overrides.ids.length
    },
    section: overrides.section
  })
}

/**
 * Builds a parsed `CategoryEntity`.
 * @param id - The tile's id, also used as its slug-ish name
 * @param position - Sort position
 * @returns The parsed tile
 */
function category(id: string, position: number): CategoryEntity {
  return categoryEntitySchema.parse({
    description: null,
    id,
    image: null,
    name: { en: id },
    parentId: null,
    position,
    rootCategoryId: id
  })
}

describe("planHomeListingRequests", () => {
  const source: HomeListingSource = { coordinates: POINTS, radiusKm: 5 }

  it("builds one query per coordinate, in coordinate order", () => {
    const queries = planHomeListingRequests(source)

    expect(queries).toEqual([
      { lat: POINTS[0]?.latitude, lng: POINTS[0]?.longitude, radiusKm: 5 },
      { lat: POINTS[1]?.latitude, lng: POINTS[1]?.longitude, radiusKm: 5 }
    ])
  })

  it("throws when the radius does not satisfy the query schema", () => {
    expect(() =>
      planHomeListingRequests({ coordinates: POINTS, radiusKm: 0 })
    ).toThrow()
  })

  it("answers an empty plan for an area with no points", () => {
    expect(planHomeListingRequests({ coordinates: [], radiusKm: 5 })).toEqual(
      []
    )
  })
})

describe("mergeHomeSectionsPages", () => {
  it("answers an empty stack for no pages", () => {
    expect(mergeHomeSectionsPages([])).toEqual([])
  })

  it("answers an empty stack when every page holds no sections", () => {
    expect(mergeHomeSectionsPages([[], []])).toEqual([])
  })

  it("preserves first-seen section order across pages", () => {
    const pageOne = [
      tenantSection({ ids: ["a"], section: "topPlaces" }),
      productSection({ ids: ["b"], section: "tryNew" })
    ]
    const pageTwo = [tenantSection({ ids: ["c"], section: "topPlaces" })]

    const merged = mergeHomeSectionsPages([pageOne, pageTwo])

    expect(merged.map((section) => section.section)).toEqual([
      "topPlaces",
      "tryNew"
    ])
  })

  it("dedupes each section's data by id, first occurrence winning", () => {
    const pageOne = tenantSection({
      ids: ["shared", "only-on-one"],
      section: "topPlaces"
    })
    const pageTwo = tenantSection({
      ids: ["shared", "only-on-two"],
      section: "topPlaces"
    })

    const merged = mergeHomeSectionsPages([[pageOne], [pageTwo]])
    const ids = merged[0]?.data.map((item) => item.id)

    expect(ids).toEqual(["shared", "only-on-one", "only-on-two"])
  })

  it("keeps two different sections from colliding over a shared id", () => {
    // A dish and a restaurant — or two different dish sections — may
    // legitimately reuse an id across sections; a flat dedupe would wrongly
    // drop one of them.
    const topPlaces = tenantSection({ ids: ["1"], section: "topPlaces" })
    const tryNew = homeSectionSchema.parse({
      data: [
        {
          branch: { name: { en: "Al Rehman" }, slug: "al-rehman" },
          compareAtPrice: null,
          id: "1",
          images: [],
          name: { en: "Zinger Burger" },
          price: "650",
          rating: null,
          slug: "zinger-burger",
          totalReviews: null
        }
      ],
      metadata: {
        description: null,
        title: "Try something new",
        totalCount: 1
      },
      section: "tryNew"
    })

    const merged = mergeHomeSectionsPages([[topPlaces, tryNew]])

    expect(merged.find((s) => s.section === "topPlaces")?.data).toHaveLength(1)
    expect(merged.find((s) => s.section === "tryNew")?.data).toHaveLength(1)
  })

  it("takes a section's metadata from its first appearance", () => {
    const pageOne = tenantSection({
      ids: ["a"],
      section: "topPlaces",
      title: "First title"
    })
    const pageTwo = tenantSection({
      ids: ["b"],
      section: "topPlaces",
      title: "Second title"
    })

    const merged = mergeHomeSectionsPages([[pageOne], [pageTwo]])

    expect(merged[0]?.metadata.title).toEqual({ en: "First title" })
  })
})

describe("mergeCategoryPages", () => {
  it("answers an empty list for no pages", () => {
    expect(mergeCategoryPages([])).toEqual([])
  })

  it("dedupes by id across pages, first occurrence winning", () => {
    const pageOne = [category("chicken", 0)]
    const pageTwo = [category("chicken", 0), category("bbq", 1)]

    const merged = mergeCategoryPages([pageOne, pageTwo])

    expect(merged.map((c) => c.id)).toEqual(["chicken", "bbq"])
  })

  it("sorts the merged result by position ascending", () => {
    const pageOne = [category("dessert", 3), category("chicken", 0)]
    const pageTwo = [category("bbq", 2), category("pakistani", 1)]

    const merged = mergeCategoryPages([pageOne, pageTwo])

    expect(merged.map((c) => c.id)).toEqual([
      "chicken",
      "pakistani",
      "bbq",
      "dessert"
    ])
  })
})
