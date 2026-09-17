import { describe, expect, it } from "vitest"
import {
  areaRestaurantsSchema,
  areaSchema,
  categoriesPayloadSchema,
  categoryEntitySchema,
  catalogEnvelopeSchema,
  discoveryPageSchema,
  discoveryRestaurantSchema,
  catalogSearchQuerySchema,
  catalogSearchResultsSchema,
  cityAreasSchema,
  citySchema,
  coordinatesSchema,
  homeDataPayloadSchema,
  homeListingQuerySchema,
  homeSectionSchema,
  localizedTextSchema,
  menuCategorySchema,
  menuItemDetailSchema,
  menuItemSchema,
  openingHoursSchema,
  openStateSchema,
  optionalLocalizedTextSchema,
  paginationQuerySchema,
  photoArraySchema,
  photoSchema,
  priceSchema,
  ratingSchema,
  restaurantDetailSchema,
  restaurantSummarySchema,
  SLUG_REGEX,
  type Slug,
  slugSchema
} from "../index"
import {
  homeProductItemSchema,
  homeSectionsResponseSchema,
  homeTenantItemSchema
} from "../schemas"

/**
 * Parses a literal to a branded `Slug` so fixtures can be written inline.
 * @param value - Slug literal known to be valid
 * @returns The branded slug
 */
function slug(value: string): Slug {
  return slugSchema.parse(value)
}

const OPEN_STATE = {
  openNow: true,
  businessHoursStatusKey: "open"
} as const

const SUMMARY_INPUT = {
  id: "restaurant-1",
  slug: "al-rehman",
  name: "Al Rehman",
  fulfillment: "delivery",
  openState: OPEN_STATE
}

const CITY_INPUT = {
  id: "city-1",
  slug: "gujranwala",
  name: "Gujranwala",
  isLive: true
}

/** An area always carries at least one query point — see `areaSchema`. */
const AREA_INPUT = {
  id: "area-1",
  slug: "magnoliya-park",
  citySlug: "gujranwala",
  name: "Magnoliya Park",
  isLive: true,
  coordinates: [{ latitude: 32.1877, longitude: 74.1945 }]
}

describe("slugSchema", () => {
  it.each([
    ["magnoliya-park", "kebab case"],
    ["ur2", "digits are allowed"],
    ["a", "single character"]
  ])("accepts %s (%s)", (value) => {
    expect(slugSchema.parse(value)).toBe(value)
  })

  it.each([
    ["Magnoliya Park", "spaces and capitals"],
    ["café", "non-ascii"],
    ["a_b", "underscore"],
    ["", "empty"],
    ["_next", "leading underscore"],
    ["Al-Rehman", "capitals only"]
  ])("rejects %s (%s)", (value) => {
    expect(() => slugSchema.parse(value)).toThrow()
  })

  it("never coerces or slugifies a display name", () => {
    const parsed = slugSchema.safeParse("Al Rehman")

    expect(parsed.success).toBe(false)
    expect(SLUG_REGEX.test("Al Rehman")).toBe(false)
  })
})

describe("localizedTextSchema", () => {
  it.each([
    [
      "full record drops ar",
      { en: "Al Rehman", ur: "Al Rehman", ar: "الرحمن" },
      { en: "Al Rehman", ur: "Al Rehman" }
    ],
    ["partial record", { en: "Al Rehman" }, { en: "Al Rehman" }],
    ["legacy bare string", "Al Rehman", { en: "Al Rehman" }],
    [
      "urdu backfills a missing english value",
      { ur: "Kuch Bhi" },
      { en: "Kuch Bhi", ur: "Kuch Bhi" }
    ],
    [
      "empty english falls back to urdu",
      { en: "", ur: "Kuch Bhi" },
      { en: "Kuch Bhi", ur: "Kuch Bhi" }
    ]
  ])("normalizes %s", (_label, input, expected) => {
    expect(localizedTextSchema.parse(input)).toEqual(expected)
  })

  it.each([
    ["empty record", {}],
    ["empty english only", { en: "" }],
    ["whitespace-only english", { en: "   " }],
    ["whitespace-only string", "  \t "],
    ["whitespace in every served locale", { en: " ", ur: "  " }],
    ["arabic only — ar must never reach a page", { ar: "الرحمن" }],
    ["wrong type", 42]
  ])("rejects %s", (_label, input) => {
    expect(() => localizedTextSchema.parse(input)).toThrow()
  })

  it("trims surrounding whitespace off the stored value", () => {
    expect(localizedTextSchema.parse({ en: "  Al Rehman  " })).toEqual({
      en: "Al Rehman"
    })
  })
})

describe("optionalLocalizedTextSchema", () => {
  it.each([
    ["null", null, null],
    ["undefined", undefined, null],
    ["empty record", {}, null],
    ["blank string", "", null],
    ["whitespace-only string", "   ", null],
    ["value", { en: "Best biryani in town" }, { en: "Best biryani in town" }]
  ])("maps %s", (_label, input, expected) => {
    expect(optionalLocalizedTextSchema.parse(input)).toEqual(expected)
  })
})

describe("priceSchema", () => {
  it.each([
    ["decimal string", "450.00", 450],
    ["integer string", "450", 450],
    ["number", 450, 450],
    ["zero", 0, 0],
    ["upper bound", 999_999.99, 999_999.99]
  ])("coerces %s", (_label, input, expected) => {
    expect(priceSchema.parse(input)).toBe(expected)
  })

  it.each([
    ["negative", "-1"],
    ["above PRICE_MAX", 1_000_000],
    ["non-numeric", "free"],
    ["empty string", ""],
    ["boolean", true],
    ["null", null]
  ])("rejects %s", (_label, input) => {
    expect(() => priceSchema.parse(input)).toThrow()
  })
})

describe("ratingSchema", () => {
  it.each([
    ["decimal string from the raw column", "4.50", 4.5],
    ["number", 4.5, 4.5],
    ["lower bound", 0, 0],
    ["upper bound", 5, 5]
  ])("coerces a %s", (_label, input, expected) => {
    expect(ratingSchema.parse(input)).toBe(expected)
  })

  it.each([
    ["above five", 6],
    ["negative", "-1"],
    ["non-numeric", "great"]
  ])("rejects %s", (_label, input) => {
    expect(() => ratingSchema.parse(input)).toThrow()
  })
})

describe("coordinatesSchema", () => {
  it("accepts decimal strings from a postgres numeric column", () => {
    expect(
      coordinatesSchema.parse({ latitude: "32.1877", longitude: "74.1945" })
    ).toEqual({ latitude: 32.1877, longitude: 74.1945 })
  })

  it.each([
    ["latitude out of range", { latitude: 91, longitude: 0 }],
    ["longitude out of range", { latitude: 0, longitude: -181 }]
  ])("rejects %s", (_label, input) => {
    expect(() => coordinatesSchema.parse(input)).toThrow()
  })
})

describe("openingHoursSchema", () => {
  it("pads a sparse array to seven sunday-first days", () => {
    const hours = openingHoursSchema.parse([
      { dayOfWeek: "monday", openTime: "9:00", closeTime: "23:00" }
    ])

    expect(hours).toHaveLength(7)
    expect(hours.map((day) => day.dayOfWeek)).toEqual([
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ])
    expect(hours[1]).toEqual({
      dayOfWeek: "monday",
      openTime: "09:00",
      closeTime: "23:00",
      isClosed: false,
      crossesMidnight: false
    })
  })

  it.each([
    ["an absent day", []],
    [
      "isClosed: true",
      [
        {
          dayOfWeek: "sunday",
          openTime: "10:00",
          closeTime: "22:00",
          isClosed: true
        }
      ]
    ],
    [
      "a null openTime",
      [{ dayOfWeek: "sunday", openTime: null, closeTime: "22:00" }]
    ],
    [
      "a null closeTime",
      [{ dayOfWeek: "sunday", openTime: "10:00", closeTime: null }]
    ]
  ])("treats %s as closed", (_label, input) => {
    const [sunday] = openingHoursSchema.parse(input)

    expect(sunday).toEqual({
      dayOfWeek: "sunday",
      openTime: null,
      closeTime: null,
      isClosed: true,
      crossesMidnight: false
    })
  })

  it("preserves an overnight window and flags it", () => {
    const [sunday] = openingHoursSchema.parse([
      { dayOfWeek: "sunday", openTime: "20:00", closeTime: "02:00" }
    ])

    expect(sunday).toEqual({
      dayOfWeek: "sunday",
      openTime: "20:00",
      closeTime: "02:00",
      isClosed: false,
      crossesMidnight: true
    })
  })

  it.each([
    ["undefined", undefined],
    ["null", null]
  ])("treats %s as seven closed days", (_label, input) => {
    expect(openingHoursSchema.parse(input).every((day) => day.isClosed)).toBe(
      true
    )
  })

  it.each([
    ["an unknown day", [{ dayOfWeek: "someday", openTime: null }]],
    ["a malformed time", [{ dayOfWeek: "sunday", openTime: "25:00" }]]
  ])("rejects %s", (_label, input) => {
    expect(() => openingHoursSchema.parse(input)).toThrow()
  })
})

describe("openStateSchema", () => {
  it("carries the backend fields through without deriving anything", () => {
    expect(
      openStateSchema.parse({
        openNow: false,
        businessHoursStatusKey: "opens_at",
        nextOpenTime: "2026-08-18T12:00:00.000Z"
      })
    ).toEqual({
      openNow: false,
      businessHoursStatusKey: "opens_at",
      nextOpenTime: "2026-08-18T12:00:00.000Z"
    })
  })

  it("defaults an absent nextOpenTime to null", () => {
    expect(
      openStateSchema.parse({ openNow: true, businessHoursStatusKey: "open" })
        .nextOpenTime
    ).toBeNull()
  })

  it("rejects an unknown status key", () => {
    expect(() =>
      openStateSchema.parse({ openNow: true, businessHoursStatusKey: "maybe" })
    ).toThrow()
  })

  it("accepts an offset-bearing ISO datetime", () => {
    expect(
      openStateSchema.parse({
        openNow: false,
        businessHoursStatusKey: "opens_tomorrow_at",
        nextOpenTime: "2026-08-19T12:00:00+05:00"
      }).nextOpenTime
    ).toBe("2026-08-19T12:00:00+05:00")
  })

  it.each([
    ["a date with no time", "2026-08-18"],
    ["a display string", "opens at 5pm"],
    ["a bare time", "17:00"],
    ["an empty string", ""]
  ])("rejects %s rather than rendering Invalid Date", (_label, value) => {
    expect(() =>
      openStateSchema.parse({
        openNow: false,
        businessHoursStatusKey: "opens_at",
        nextOpenTime: value
      })
    ).toThrow()
  })
})

describe("photoSchema", () => {
  it("accepts a photo with no alt, because no alt column exists", () => {
    expect(photoSchema.parse({ url: "restaurants/1/cover.jpg" })).toEqual({
      url: "restaurants/1/cover.jpg",
      alt: null
    })
  })

  it("keeps an alt when one is supplied", () => {
    expect(photoSchema.parse({ url: "a.jpg", alt: "Dining room" }).alt).toBe(
      "Dining room"
    )
  })

  it("rejects an empty url", () => {
    expect(() => photoSchema.parse({ url: "" })).toThrow()
  })
})

/**
 * The reference that broke four of the five live reads on 2026-08-21: three
 * development tenants store a base64 PNG in the column `logoUrl` maps from.
 * Shortened here — the real values are 10,606, 11,262 and 11,282 characters —
 * because the only property under test is "longer than `IMAGE_URL_MAX`".
 */
const DATA_URI_LOGO = `data:image/png;base64,${"iVBORw0KGgo".repeat(40)}`

/** A stored reference the domain can actually render. */
const USABLE_IMAGE = "https://cdn.example.test/tenants/1/cover.png"

describe("image references degrade instead of failing their record", () => {
  const unusable: readonly [string, unknown][] = [
    ["a data: URI far over the length cap", DATA_URI_LOGO],
    ["an over-length URL", `https://x.test/${"a".repeat(300)}.png`],
    ["an empty string", ""],
    ["a non-string", 42]
  ]

  it.each(unusable)("maps %s to null on a summary", (_label, value) => {
    const parsed = restaurantSummarySchema.parse({
      ...SUMMARY_INPUT,
      coverImageUrl: value,
      logoUrl: value
    })

    expect(parsed.coverImageUrl).toBeNull()
    expect(parsed.logoUrl).toBeNull()
  })

  it("keeps a usable reference untouched", () => {
    expect(
      restaurantSummarySchema.parse({
        ...SUMMARY_INPUT,
        logoUrl: USABLE_IMAGE
      }).logoUrl
    ).toBe(USABLE_IMAGE)
  })

  // The whole point of the change: `discoveryPageSchema` parses through
  // `z.array(...)`, so before this a single bad row failed the entire page and
  // the area page rendered its error boundary instead of the restaurants that
  // were fine. Three rows, one poisoned, three survivors.
  it("lets a poisoned row ride along in a listing page instead of failing it", () => {
    const row = (slug: string, logo: unknown) => ({
      id: `id-${slug}`,
      slug,
      name: { en: slug },
      orderFulfillment: "delivery",
      restaurantPicture: logo
    })

    const page = discoveryPageSchema(discoveryRestaurantSchema).parse({
      data: [
        row("first", USABLE_IMAGE),
        row("poisoned", DATA_URI_LOGO),
        row("third", USABLE_IMAGE)
      ],
      total: 3,
      page: 0,
      limit: 20
    })

    expect(page.items).toHaveLength(3)
    expect(page.items.map((item) => item.logoUrl)).toEqual([
      USABLE_IMAGE,
      null,
      USABLE_IMAGE
    ])
  })
})

describe("photoArraySchema", () => {
  it("drops a photo it cannot use and keeps the rest", () => {
    expect(
      photoArraySchema.parse([
        { url: USABLE_IMAGE },
        { url: DATA_URI_LOGO },
        { url: "restaurants/1/cover.jpg" }
      ])
    ).toEqual([
      { url: USABLE_IMAGE, alt: null },
      { url: "restaurants/1/cover.jpg", alt: null }
    ])
  })

  it("answers an empty gallery when every photo is unusable", () => {
    expect(photoArraySchema.parse([{ url: DATA_URI_LOGO }])).toEqual([])
  })

  // Absence and emptiness are different answers and the endpoint's `.nullable()`
  // is what carries the first one. If this schema absorbed `null` the photos
  // read would report a missing restaurant as an existing one with no photos —
  // a 404 turned into an indexable 200.
  it("does not absorb null, because null means 'no such restaurant'", () => {
    expect(() => photoArraySchema.parse(null)).toThrow()
    expect(photoArraySchema.nullable().parse(null)).toBeNull()
  })

  it("empties a detail record's gallery rather than failing the record", () => {
    const detail = restaurantDetailSchema.parse({
      ...SUMMARY_INPUT,
      photos: [{ url: DATA_URI_LOGO }, { url: USABLE_IMAGE }]
    })

    expect(detail.photos).toEqual([{ url: USABLE_IMAGE, alt: null }])
  })
})

describe("citySchema and areaSchema", () => {
  it("parses a city", () => {
    const city = citySchema.parse({
      id: "city-1",
      slug: "gujranwala",
      name: { en: "Gujranwala", ur: "Gujranwala" },
      isLive: true
    })

    expect(city).toEqual({
      id: "city-1",
      slug: "gujranwala",
      name: { en: "Gujranwala", ur: "Gujranwala" },
      description: null,
      coordinates: null,
      isLive: true,
      areaCount: 0
    })
  })

  it("accepts a city with no coordinates — it lists areas, it never queries by point", () => {
    expect(
      citySchema.parse({
        id: "city-1",
        slug: "gujranwala",
        name: "Gujranwala",
        isLive: true,
        coordinates: null
      }).coordinates
    ).toBeNull()
  })

  it("parses an area", () => {
    const area = areaSchema.parse({
      id: "area-1",
      slug: "magnoliya-park",
      citySlug: "gujranwala",
      name: "Magnoliya Park",
      isLive: true,
      restaurantCount: 12,
      coordinates: [{ latitude: 32.1877, longitude: 74.1945 }]
    })

    expect(area.restaurantCount).toBe(12)
    expect(area.coordinates).toEqual([
      { latitude: 32.1877, longitude: 74.1945 }
    ])
  })

  it("keeps several query points, so a large area is not reduced to one pin", () => {
    // Risk R1: one centroid misses restaurants that deliver to one end of a
    // large area but not its middle. The caller queries each point and dedupes.
    const area = areaSchema.parse({
      ...AREA_INPUT,
      coordinates: [
        { latitude: 32.1877, longitude: 74.1945 },
        { latitude: "32.2001", longitude: "74.2103" },
        { latitude: 32.1755, longitude: 74.1802 }
      ]
    })

    expect(area.coordinates).toHaveLength(3)
    expect(area.coordinates[1]).toEqual({
      latitude: 32.2001,
      longitude: 74.2103
    })
  })

  it.each([
    ["no coordinates key at all", undefined],
    ["a null coordinates value", null],
    ["an empty coordinates list", []]
  ])("rejects an area with %s — it would be unqueryable", (_label, value) => {
    // An area with no query point cannot be listed under the constant-taxonomy
    // design, so it must fail parsing rather than publish an empty page.
    expect(() =>
      areaSchema.parse({ ...AREA_INPUT, coordinates: value })
    ).toThrow()
  })

  it("rejects a city whose slug came from a name", () => {
    expect(() =>
      citySchema.parse({
        id: "city-1",
        slug: "Gujranwala",
        name: "Gujranwala",
        isLive: true
      })
    ).toThrow()
  })
})

describe("restaurantSummarySchema", () => {
  it("fills every optional field with a null or empty default", () => {
    expect(restaurantSummarySchema.parse(SUMMARY_INPUT)).toEqual({
      id: "restaurant-1",
      slug: "al-rehman",
      name: { en: "Al Rehman" },
      categoryId: null,
      cuisines: [],
      coverImageUrl: null,
      logoUrl: null,
      rating: null,
      reviewCount: 0,
      deliveryFee: null,
      minimumOrder: null,
      prepTimeMinMinutes: null,
      prepTimeMaxMinutes: null,
      fulfillment: "delivery",
      openState: { ...OPEN_STATE, nextOpenTime: null }
    })
  })

  it("treats a null cuisines array as empty rather than failing the record", () => {
    expect(
      restaurantSummarySchema.parse({ ...SUMMARY_INPUT, cuisines: null })
        .cuisines
    ).toEqual([])
  })

  it("coerces a decimal-string rating the same way as money", () => {
    expect(
      restaurantSummarySchema.parse({ ...SUMMARY_INPUT, rating: "4.50" }).rating
    ).toBe(4.5)
  })

  it("coerces a decimal delivery fee", () => {
    const summary = restaurantSummarySchema.parse({
      ...SUMMARY_INPUT,
      deliveryFee: "120.00",
      minimumOrder: "500.00",
      rating: 4.5,
      reviewCount: 231,
      cuisines: ["BBQ", "Pakistani"],
      prepTimeMinMinutes: 25,
      prepTimeMaxMinutes: 40
    })

    expect(summary.deliveryFee).toBe(120)
    expect(summary.minimumOrder).toBe(500)
    expect(summary.rating).toBe(4.5)
  })

  it.each([
    ["an out-of-range rating", { rating: 6 }],
    ["an unknown fulfillment", { fulfillment: "teleport" }],
    ["a nameless restaurant", { name: {} }]
  ])("rejects %s", (_label, patch) => {
    expect(() =>
      restaurantSummarySchema.parse({ ...SUMMARY_INPUT, ...patch })
    ).toThrow()
  })
})

describe("restaurantDetailSchema", () => {
  it("extends the summary with detail-page fields", () => {
    const detail = restaurantDetailSchema.parse({
      ...SUMMARY_INPUT,
      description: { en: "Charcoal BBQ since 1998", ar: "..." },
      address: "Main Boulevard, Magnoliya Park",
      phone: "+92 300 1234567",
      coordinates: { latitude: 32.1877, longitude: 74.1945 },
      openingHours: [
        { dayOfWeek: "friday", openTime: "17:00", closeTime: "01:00" }
      ],
      photos: [{ url: "a.jpg" }]
    })

    expect(detail.description).toEqual({ en: "Charcoal BBQ since 1998" })
    expect(detail.openingHours).toHaveLength(7)
    expect(detail.openingHours[5]?.crossesMidnight).toBe(true)
    expect(detail.photos[0]?.alt).toBeNull()
  })

  it("defaults photos and openingHours when the backend omits them", () => {
    const detail = restaurantDetailSchema.parse(SUMMARY_INPUT)

    expect(detail.photos).toEqual([])
    expect(detail.openingHours).toHaveLength(7)
    expect(detail.address).toBeNull()
    expect(detail.phone).toBeNull()
  })

  it("treats a null photos array as empty rather than failing the record", () => {
    expect(
      restaurantDetailSchema.parse({ ...SUMMARY_INPUT, photos: null }).photos
    ).toEqual([])
  })
})

describe("menu schemas", () => {
  it("parses a category with items", () => {
    const category = menuCategorySchema.parse({
      id: "cat-1",
      slug: "bbq",
      name: { en: "BBQ", ur: "BBQ" },
      items: [
        {
          id: "item-1",
          slug: "seekh-kebab",
          name: "Seekh Kebab",
          price: "450.00"
        },
        {
          id: "item-2",
          slug: null,
          name: "Malai Boti",
          price: 650,
          isAvailable: false
        }
      ]
    })

    expect(category.items[0]?.price).toBe(450)
    expect(category.items[0]?.isAvailable).toBe(true)
    expect(category.items[1]?.isAvailable).toBe(false)
    expect(category.description).toBeNull()
  })

  it("carries the item slug the menu projection has always emitted", () => {
    // It was dropped here for the whole of mw-1-3, which is why nothing on the
    // menu page could address an item by anything but its UUID.
    const category = menuCategorySchema.parse({
      id: "cat-1",
      slug: "bbq",
      name: "BBQ",
      items: [
        { id: "item-1", slug: "seekh-kebab", name: "Seekh Kebab", price: 450 }
      ]
    })

    expect(category.items[0]?.slug).toBe("seekh-kebab")
  })

  it("accepts a null item slug, which the column allows", () => {
    // `slug IS NULL OR slug ~ '^[a-z0-9-]+$'` — 111 of 111 live rows carry one,
    // and the fallback to the id is still real.
    expect(
      menuItemSchema.parse({
        id: "item-1",
        slug: null,
        name: "Seekh Kebab",
        price: 450
      }).slug
    ).toBeNull()
  })

  it("rejects an item with no slug key at all", () => {
    // Nullable, not optional. A projection that stopped emitting the column
    // must fail loudly rather than silently making every item id-addressed
    // again.
    expect(() =>
      menuItemSchema.parse({ id: "item-1", name: "Seekh Kebab", price: 450 })
    ).toThrow()
  })

  it.each([
    ["omitted", undefined],
    ["null", null]
  ])("treats an %s items array as empty", (_label, items) => {
    expect(
      menuCategorySchema.parse({ id: "cat-1", slug: "bbq", name: "BBQ", items })
        .items
    ).toEqual([])
  })

  it("rejects an item with no price", () => {
    expect(() =>
      menuItemSchema.parse({ id: "item-1", slug: null, name: "Seekh Kebab" })
    ).toThrow()
  })
})

describe("menuItemDetailSchema", () => {
  /** The 73% shape: nothing to configure at all. */
  const PLAIN = {
    id: "item-1",
    slug: "seekh-kebab",
    name: { en: "Seekh Kebab" },
    description: { en: "Charcoal grilled." },
    imageUrl: "https://cdn.test.invalid/a.jpg",
    images: ["https://cdn.test.invalid/a.jpg"],
    price: "450.00",
    isAvailable: true,
    variants: [],
    combinations: [],
    addons: []
  }

  it("parses the plain item that is 73% of production", () => {
    const item = menuItemDetailSchema.parse(PLAIN)

    expect(item.price).toBe(450)
    expect(item.variants).toEqual([])
    expect(item.combinations).toEqual([])
    expect(item.addons).toEqual([])
    expect(item.images).toEqual(["https://cdn.test.invalid/a.jpg"])
  })

  it.each([
    ["omitted", undefined],
    ["null", null]
  ])("treats %s collections as empty rather than failing", (_label, value) => {
    const item = menuItemDetailSchema.parse({
      ...PLAIN,
      addons: value,
      combinations: value,
      images: value,
      variants: value
    })

    expect(item.variants).toEqual([])
    expect(item.combinations).toEqual([])
    expect(item.addons).toEqual([])
    expect(item.images).toEqual([])
  })

  it("accepts a null price, which the contract allows for an item with no purchasable combination", () => {
    expect(
      menuItemDetailSchema.parse({ ...PLAIN, price: null }).price
    ).toBeNull()
  })

  it("accepts a null slug and keys off the id instead", () => {
    expect(menuItemDetailSchema.parse({ ...PLAIN, slug: null }).slug).toBeNull()
  })

  it("degrades an unusable image reference rather than failing the item", () => {
    // Same column class as the restaurant images: three live tenants store an
    // 11 KB base64 `data:` URI against an `IMAGE_URL_MAX` of 255.
    const item = menuItemDetailSchema.parse({
      ...PLAIN,
      imageUrl: `data:image/png;base64,${"A".repeat(300)}`,
      images: ["https://cdn.test.invalid/a.jpg", "", "B".repeat(300)]
    })

    expect(item.imageUrl).toBeNull()
    expect(item.images).toEqual(["https://cdn.test.invalid/a.jpg"])
  })

  it("defaults selectionType to single, including for a null value", () => {
    // `"multiple"` is the only value that means anything else — the predicate
    // ported from mobile's `variantSelection.ts:4`.
    const item = menuItemDetailSchema.parse({
      ...PLAIN,
      variants: [
        {
          id: "v1",
          name: "Size",
          selectionType: null,
          options: [{ id: "o1", name: "Small", priceModifier: "0.00" }]
        }
      ]
    })

    expect(item.variants[0]?.selectionType).toBe("single")
    expect(item.variants[0]?.minSelections).toBe(0)
    expect(item.variants[0]?.maxSelections).toBeNull()
    expect(item.variants[0]?.isRequired).toBe(false)
    expect(item.variants[0]?.options[0]?.priceModifier).toBe(0)
    expect(item.variants[0]?.options[0]?.isPopular).toBe(false)
  })

  it("keeps a negative price modifier, which priceSchema's floor would reject", () => {
    const item = menuItemDetailSchema.parse({
      ...PLAIN,
      variants: [
        {
          id: "v1",
          name: "Extras",
          selectionType: "multiple",
          maxSelections: 2,
          options: [{ id: "o1", name: "No cheese", priceModifier: "-50" }]
        }
      ]
    })

    expect(item.variants[0]?.options[0]?.priceModifier).toBe(-50)
    expect(item.variants[0]?.maxSelections).toBe(2)
  })

  it("reads a combination priced zero as zero", () => {
    // The defect this schema exists to make impossible downstream: mobile's
    // `combinationPriceOrBase` turns this into the item's base price.
    const item = menuItemDetailSchema.parse({
      ...PLAIN,
      combinations: [
        {
          id: "c1",
          price: "0.00",
          isAvailable: false,
          options: [{ id: "o1", variantId: "v1", name: "Small" }]
        }
      ]
    })

    expect(item.combinations[0]?.price).toBe(0)
    expect(item.combinations[0]?.isAvailable).toBe(false)
  })

  it("defaults the dormant be-3-1 fields to null until the backend projects them", () => {
    // `inventoryId` (be-3-1a) and `compareAtPrice` (be-3-1b) are absent from
    // every live payload today. Absent, null and present must all parse — the
    // whole point is that the backend can ship them with no frontend release.
    const absent = menuItemDetailSchema.parse({
      ...PLAIN,
      combinations: [
        {
          id: "c1",
          price: "500.00",
          options: [{ id: "o1", variantId: "v1", name: "Small" }]
        }
      ],
      addons: [
        {
          id: "link-1",
          product: { id: "p2", name: { en: "Raita" } },
          price: "90.00"
        }
      ]
    })

    expect(absent.compareAtPrice).toBeNull()
    expect(absent.combinations[0]?.inventoryId).toBeNull()
    expect(absent.combinations[0]?.compareAtPrice).toBeNull()
    expect(absent.addons[0]?.inventoryId).toBeNull()
    expect(absent.addons[0]?.compareAtPrice).toBeNull()

    const present = menuItemDetailSchema.parse({
      ...PLAIN,
      compareAtPrice: "500.00",
      combinations: [
        {
          id: "c1",
          price: "500.00",
          inventoryId: "inv-1",
          compareAtPrice: "560.00",
          options: [{ id: "o1", variantId: "v1", name: "Small" }]
        }
      ],
      addons: [
        {
          id: "link-1",
          product: { id: "p2", name: { en: "Raita" } },
          price: "90.00",
          inventoryId: "inv-2",
          compareAtPrice: "110.00"
        }
      ]
    })

    expect(present.compareAtPrice).toBe(500)
    expect(present.combinations[0]?.inventoryId).toBe("inv-1")
    expect(present.combinations[0]?.compareAtPrice).toBe(560)
    expect(present.addons[0]?.inventoryId).toBe("inv-2")
    expect(present.addons[0]?.compareAtPrice).toBe(110)
  })

  it("keeps a null selectedCombinationIds distinct from an empty one", () => {
    // `null` means every combination; `[]` means none. Collapsing them would
    // withdraw every ungated add-on.
    const item = menuItemDetailSchema.parse({
      ...PLAIN,
      addons: [
        {
          id: "link-1",
          selectedCombinationIds: null,
          price: "120.00",
          product: {
            id: "p1",
            name: "Raita",
            description: null,
            imageUrl: null
          }
        },
        {
          id: "link-2",
          selectedCombinationIds: [],
          price: "80.00",
          product: {
            id: "p2",
            name: "Salad",
            description: null,
            imageUrl: null
          }
        }
      ]
    })

    expect(item.addons[0]?.selectedCombinationIds).toBeNull()
    expect(item.addons[1]?.selectedCombinationIds).toEqual([])
    expect(item.addons[0]?.isAvailable).toBe(true)
    expect(item.addons[0]?.isRequired).toBe(false)
  })

  it("rejects an item with no name", () => {
    expect(() =>
      menuItemDetailSchema.parse({ ...PLAIN, name: { en: "" } })
    ).toThrow()
  })
})

describe("catalogSearchResultsSchema", () => {
  it("accepts an empty result set", () => {
    expect(
      catalogSearchResultsSchema.parse({ query: "biryani", total: 0 })
    ).toEqual({
      query: "biryani",
      total: 0,
      restaurants: [],
      areas: []
    })
  })

  it("treats null collections as empty", () => {
    expect(
      catalogSearchResultsSchema.parse({
        query: "biryani",
        total: 0,
        restaurants: null,
        areas: null
      })
    ).toEqual({ query: "biryani", total: 0, restaurants: [], areas: [] })
  })

  it("requires total, so a truncated payload cannot look like zero hits", () => {
    expect(() =>
      catalogSearchResultsSchema.parse({ query: "biryani" })
    ).toThrow()
  })
})

describe("envelopes", () => {
  it("wraps a payload in { success, message, data }", () => {
    const parsed = catalogEnvelopeSchema(citySchema).parse({
      success: true,
      message: "ok",
      data: CITY_INPUT
    })

    expect(parsed.success).toBe(true)
    expect(parsed.data.slug).toBe("gujranwala")
  })

  it("tolerates an envelope with neither success nor message", () => {
    const parsed = catalogEnvelopeSchema(citySchema).parse({ data: CITY_INPUT })

    expect(parsed.success).toBeUndefined()
    expect(parsed.message).toBeUndefined()
    expect(parsed.data.slug).toBe("gujranwala")
  })

  it("REJECTS success:false — a failed envelope must never parse to data:null", () => {
    // A 200-wrapped upstream failure. Parsed permissively this yields
    // `data: null`, the transport reports "absent", and the caller renders a
    // soft 404 that Google indexes. It has to throw instead.
    expect(() =>
      catalogEnvelopeSchema(citySchema.nullable()).parse({
        success: false,
        message: "upstream timeout",
        data: null
      })
    ).toThrow()
  })

  it("still allows a genuine null payload when success is absent or true", () => {
    const schema = catalogEnvelopeSchema(citySchema.nullable())

    expect(schema.parse({ data: null }).data).toBeNull()
    expect(schema.parse({ success: true, data: null }).data).toBeNull()
  })
})

describe("discoveryPageSchema", () => {
  it("reads the wire's `data` key and yields `items`", () => {
    const page = discoveryPageSchema(areaSchema).parse({
      data: [],
      total: 40,
      appliedFilters: []
    })

    expect(page).toEqual({ items: [], total: 40, page: 0, limit: 20 })
  })

  it.each([
    ["a missing data key", { total: 12 }],
    [
      "an `items` key, which this endpoint never sends",
      { items: [], total: 0 }
    ],
    ["a missing total", { data: [] }],
    ["a negative page", { data: [], total: 0, page: -1 }]
  ])("rejects %s", (_label, input) => {
    expect(() => discoveryPageSchema(areaSchema).parse(input)).toThrow()
  })
})

describe("discoveryRestaurantSchema", () => {
  /** The listing row as `home/section/view-all` emits it. */
  const ROW = {
    id: "restaurant-1",
    slug: "al-rehman",
    name: { en: "Al Rehman", ur: "الرحمان" },
    orderFulfillment: "delivery",
    openNow: true,
    businessHoursStatusKey: "open"
  }

  it("maps the app's field names onto a RestaurantSummary", () => {
    const parsed = discoveryRestaurantSchema.parse({
      ...ROW,
      restaurantPicture: "logo.png",
      coverPicture: "cover.png",
      rating: "4.50",
      totalReviews: 231,
      deliveryFee: 120,
      minimumOrderValue: "500.00",
      timeRange: { min: 25, max: 40 }
    })

    expect(parsed).toMatchObject({
      logoUrl: "logo.png",
      coverImageUrl: "cover.png",
      rating: 4.5,
      reviewCount: 231,
      deliveryFee: 120,
      minimumOrder: 500,
      prepTimeMinMinutes: 25,
      prepTimeMaxMinutes: 40,
      fulfillment: "delivery"
    })
  })

  it("nests the flat open-state trio", () => {
    expect(discoveryRestaurantSchema.parse(ROW).openState).toEqual({
      openNow: true,
      businessHoursStatusKey: "open",
      nextOpenTime: null
    })
  })

  it("drops every column the endpoint leaks but a card must never carry", () => {
    // This endpoint returns whole tenant rows, so its payload includes owner
    // KYC, tax and commission columns. Parsing is what keeps them out of the
    // rendered page and the ISR cache.
    const parsed = discoveryRestaurantSchema.parse({
      ...ROW,
      ntn: "1234567-8",
      strn: "3277876000000",
      commissionRate: "12.50",
      commissionFreeOrderLimit: 20,
      idCardPicture: "cnic.png",
      contactEmail: "owner@example.com",
      businessMetadata: { bankAccount: "PK00…" }
    }) as Record<string, unknown>

    for (const leaked of [
      "ntn",
      "strn",
      "commissionRate",
      "commissionFreeOrderLimit",
      "idCardPicture",
      "contactEmail",
      "businessMetadata"
    ]) {
      expect(parsed).not.toHaveProperty(leaked)
    }
  })

  it("has no cuisine source on this endpoint, and does not invent one", () => {
    // The listing query selects tenant columns only and never joins
    // `restaurants`. A card renders no cuisine tags rather than a wrong one.
    expect(
      discoveryRestaurantSchema.parse({ ...ROW, cuisineType: "BBQ" }).cuisines
    ).toEqual([])
  })

  it.each([
    ["an unknown status key", { businessHoursStatusKey: "on_a_break" }],
    ["an absent status key", { businessHoursStatusKey: undefined }],
    ["a non-ISO next open time", { nextOpenTime: "tomorrow at 9" }]
  ])("degrades %s to temporarily unavailable rather than dropping the card", (_label, patch) => {
    const parsed = discoveryRestaurantSchema.parse({ ...ROW, ...patch })

    expect(parsed.openState.nextOpenTime).toBeNull()
    expect(parsed.slug).toBe("al-rehman")
  })

  it("treats an empty-string image column as absent", () => {
    const parsed = discoveryRestaurantSchema.parse({
      ...ROW,
      restaurantPicture: "",
      coverPicture: ""
    })

    expect(parsed.logoUrl).toBeNull()
    expect(parsed.coverImageUrl).toBeNull()
  })

  it.each([
    ["a row with no slug — it cannot be linked to", { slug: undefined }],
    ["a slug derived from a name", { slug: "Al Rehman" }],
    ["an unknown fulfillment", { orderFulfillment: "teleport" }],
    ["a nameless row", { name: {} }]
  ])("rejects %s", (_label, patch) => {
    expect(() =>
      discoveryRestaurantSchema.parse({ ...ROW, ...patch })
    ).toThrow()
  })
})

describe("list payloads carry their parent record", () => {
  it("gives the /{city} page a source for the city itself", () => {
    const parsed = cityAreasSchema.parse({
      city: CITY_INPUT,
      areas: [AREA_INPUT],
      total: 1
    })

    expect(parsed.city.name).toEqual({ en: "Gujranwala" })
    expect(parsed.areas).toHaveLength(1)
    expect(parsed.total).toBe(1)
  })

  it("gives the area page its heading, intro and count", () => {
    const parsed = areaRestaurantsSchema.parse({
      area: AREA_INPUT,
      restaurants: [SUMMARY_INPUT],
      total: 12
    })

    expect(parsed.area.slug).toBe("magnoliya-park")
    expect(parsed.restaurants).toHaveLength(1)
    expect(parsed.total).toBe(12)
  })

  it.each([
    ["a city-areas payload with no city", { areas: [], total: 0 }],
    ["an area payload with no area", { restaurants: [], total: 0 }]
  ])("rejects %s", (_label, input) => {
    const parsedCity = cityAreasSchema.safeParse(input)
    const parsedArea = areaRestaurantsSchema.safeParse(input)

    expect(parsedCity.success && parsedArea.success).toBe(false)
  })
})

describe("query schemas", () => {
  it("defaults pagination to the first page", () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 0, limit: 20 })
  })

  it("pins the search parameter names the service honours", () => {
    expect(catalogSearchQuerySchema.parse({ q: "biryani" })).toEqual({
      q: "biryani",
      page: 0,
      limit: 20
    })
    expect(
      catalogSearchQuerySchema.parse({ q: "biryani", page: 2, limit: 50 })
    ).toEqual({ q: "biryani", page: 2, limit: 50 })
  })

  it("drops a city narrowing — the service has no city dimension", () => {
    expect(
      catalogSearchQuerySchema.parse({ q: "bbq", city: "gujranwala" })
    ).not.toHaveProperty("city")
  })

  it.each([
    ["an empty query", { q: "" }],
    ["a missing query", {}],
    ["a limit above the cap", { q: "bbq", limit: 500 }],
    ["a negative page", { q: "bbq", page: -1 }]
  ])("rejects %s", (_label, input) => {
    expect(() => catalogSearchQuerySchema.parse(input)).toThrow()
  })
})

describe("branded Slug", () => {
  it("is assignable from a parsed value and not from a bare string", () => {
    const parsed = slug("magnoliya-park")

    expect(parsed).toBe("magnoliya-park")
    // @ts-expect-error a display name can never stand in for a Slug
    const rejected: Slug = "Magnoliya Park"

    expect(rejected).toBe("Magnoliya Park")
  })
})

// ============================================================================
// HOME PAGE (mw-1-10)
// ============================================================================

describe("homeListingQuerySchema", () => {
  it("parses a valid point and radius", () => {
    expect(
      homeListingQuerySchema.parse({
        lat: 32.102_014,
        lng: 74.208_89,
        radiusKm: 5
      })
    ).toEqual({ lat: 32.102_014, lng: 74.208_89, radiusKm: 5 })
  })

  it.each([
    ["a zero radius", { lat: 32.1, lng: 74.2, radiusKm: 0 }],
    ["a negative radius", { lat: 32.1, lng: 74.2, radiusKm: -5 }],
    ["a latitude past the pole", { lat: 91, lng: 74.2, radiusKm: 5 }],
    ["a longitude past the date line", { lat: 32.1, lng: 181, radiusKm: 5 }],
    ["a missing radius", { lat: 32.1, lng: 74.2 }]
  ])("rejects %s", (_label, input) => {
    expect(() => homeListingQuerySchema.parse(input)).toThrow()
  })
})

describe("homeTenantItemSchema", () => {
  /** The row as `home/data`'s `topPlaces` section carries it. */
  const ROW = {
    id: "restaurant-1",
    slug: "al-rehman",
    name: { en: "Al Rehman", ur: "Al Rehman" },
    coverPicture: "cover.png",
    restaurantPicture: "logo.png",
    rating: "4.50",
    totalReviews: 231,
    deliveryFee: "0",
    freeDelivery: true,
    openNow: true,
    businessHoursStatusKey: "open",
    nextOpenTime: null
  }

  it("maps onto a RestaurantSummary, matching discoveryRestaurantSchema's field names", () => {
    const parsed = homeTenantItemSchema.parse(ROW)

    expect(parsed).toMatchObject({
      id: "restaurant-1",
      slug: "al-rehman",
      coverImageUrl: "cover.png",
      logoUrl: "logo.png",
      rating: 4.5,
      reviewCount: 231,
      deliveryFee: 0
    })
  })

  it("always answers an empty cuisines array — this section has no source for it", () => {
    expect(
      homeTenantItemSchema.parse({ ...ROW, cuisines: ["BBQ"] }).cuisines
    ).toEqual([])
  })

  it("fixes fulfillment to delivery — the one member RestaurantCard never renders", () => {
    expect(homeTenantItemSchema.parse(ROW).fulfillment).toBe("delivery")
  })

  it("nests the flat open-state trio", () => {
    expect(homeTenantItemSchema.parse(ROW).openState).toEqual({
      openNow: true,
      businessHoursStatusKey: "open",
      nextOpenTime: null
    })
  })

  it("degrades an unusable cover to null rather than failing the row", () => {
    const oversized = "x".repeat(5000)

    expect(
      homeTenantItemSchema.parse({ ...ROW, coverPicture: oversized })
        .coverImageUrl
    ).toBeNull()
  })

  it("degrades an unrecognised open state rather than failing the row", () => {
    expect(
      homeTenantItemSchema.parse({
        ...ROW,
        businessHoursStatusKey: "on_a_break"
      }).openState
    ).toEqual({
      openNow: false,
      businessHoursStatusKey: "temporarily_unavailable",
      nextOpenTime: null
    })
  })
})

describe("homeProductItemSchema", () => {
  /** The row as every non-`topPlaces` `home/data` section carries it. */
  const ROW = {
    id: "product-1",
    slug: "zinger-burger",
    name: { en: "Zinger Burger" },
    images: ["dish.jpg"],
    price: "650.00",
    compareAtPrice: "900.00",
    branch: { name: { en: "Al Rehman" }, slug: "al-rehman" },
    rating: "4.60",
    totalReviews: 58
  }

  it("parses a fully populated dish", () => {
    expect(homeProductItemSchema.parse(ROW)).toMatchObject({
      id: "product-1",
      slug: "zinger-burger",
      price: 650,
      compareAtPrice: 900,
      rating: 4.6,
      totalReviews: 58,
      images: ["dish.jpg"]
    })
  })

  it("has no isAvailable field — the inventory join already excludes zero-stock rows", () => {
    expect(homeProductItemSchema.parse(ROW)).not.toHaveProperty("isAvailable")
  })

  it("defaults compareAtPrice, rating and totalReviews when the dish is not marked down or rated", () => {
    const plain = homeProductItemSchema.parse({
      id: "product-2",
      slug: "chicken-karahi",
      name: { en: "Chicken Karahi" },
      images: [],
      price: "1200.00",
      branch: { name: { en: "Desi Dhaba" } }
    })

    expect(plain.compareAtPrice).toBeNull()
    expect(plain.rating).toBeNull()
    expect(plain.branch.slug).toBeNull()
  })

  it("drops an unusable image rather than failing the dish", () => {
    const oversized = "x".repeat(5000)

    expect(
      homeProductItemSchema.parse({ ...ROW, images: ["ok.jpg", oversized] })
        .images
    ).toEqual(["ok.jpg"])
  })

  it("rejects a dish with no price", () => {
    expect(() =>
      homeProductItemSchema.parse({ ...ROW, price: undefined })
    ).toThrow()
  })
})

describe("homeSectionSchema", () => {
  it("parses topPlaces' data through homeTenantItemSchema", () => {
    const parsed = homeSectionSchema.parse({
      section: "topPlaces",
      metadata: {
        title: "Nearby top brands",
        description: null,
        totalCount: 1
      },
      data: [
        {
          id: "restaurant-1",
          slug: "al-rehman",
          name: { en: "Al Rehman" },
          coverPicture: null,
          restaurantPicture: null,
          rating: null,
          totalReviews: 0,
          deliveryFee: "0",
          freeDelivery: true,
          openNow: true,
          businessHoursStatusKey: "open",
          nextOpenTime: null
        }
      ]
    })

    expect(parsed.data[0]).toMatchObject({ fulfillment: "delivery" })
    expect(parsed.kind).toBe("tenant")
  })

  it("parses trendingNow's data through homeTenantItemSchema too — measured live 2026-08-25, not the product shape the Code Map originally assumed", () => {
    const parsed = homeSectionSchema.parse({
      section: "trendingNow",
      metadata: {
        title: "Trending now",
        description: null,
        totalCount: 1
      },
      data: [
        {
          id: "restaurant-1",
          slug: "al-rehman",
          name: { en: "Al Rehman" },
          coverPicture: null,
          restaurantPicture: null,
          rating: null,
          totalReviews: 0,
          deliveryFee: "0",
          freeDelivery: true,
          openNow: true,
          businessHoursStatusKey: "open",
          nextOpenTime: null
        }
      ]
    })

    expect(parsed.data[0]).toMatchObject({ fulfillment: "delivery" })
  })

  it("parses every other section's data through homeProductItemSchema", () => {
    const parsed = homeSectionSchema.parse({
      section: "tryNew",
      metadata: {
        title: "Try something new",
        description: null,
        totalCount: 1
      },
      data: [
        {
          id: "product-1",
          slug: "zinger-burger",
          name: { en: "Zinger Burger" },
          images: [],
          price: "650.00",
          branch: { name: { en: "Al Rehman" } }
        }
      ]
    })

    expect(parsed.data[0]).toMatchObject({ price: 650 })
    expect(parsed.kind).toBe("product")
  })

  it("parses and preserves an empty section — 'empty is valid' is the contract", () => {
    const parsed = homeSectionSchema.parse({
      section: "desserts",
      metadata: {
        title: "Delight in every bite",
        description: null,
        totalCount: 0
      },
      data: []
    })

    expect(parsed.data).toEqual([])
  })

  it("defaults an absent description and totalCount to null", () => {
    const parsed = homeSectionSchema.parse({
      section: "desserts",
      metadata: { title: "Delight in every bite" },
      data: []
    })

    expect(parsed.metadata.description).toBeNull()
    expect(parsed.metadata.totalCount).toBeNull()
  })

  it("parses an unrecognised section key instead of rejecting it (2026-08-28)", () => {
    const parsed = homeSectionSchema.parse({
      section: "somethingNew",
      metadata: { title: "X", description: null, totalCount: 0 },
      data: []
    })

    expect(parsed.section).toBe("somethingNew")
    // Empty data, no shape hint, unknown name: nothing marks it tenant.
    expect(parsed.kind).toBe("product")
  })

  it("obeys the server's shape hint over every client-side guess", () => {
    const parsed = homeSectionSchema.parse({
      section: "brandSpotlight",
      metadata: { title: "X", description: null, shape: "square" },
      data: [
        {
          id: "restaurant-1",
          slug: "al-rehman",
          name: { en: "Al Rehman" },
          coverPicture: null,
          restaurantPicture: null,
          rating: null,
          totalReviews: 0,
          deliveryFee: "0",
          freeDelivery: true,
          openNow: true,
          businessHoursStatusKey: "open",
          nextOpenTime: null
        }
      ]
    })

    expect(parsed.kind).toBe("tenant")
    expect(parsed.data[0]).toMatchObject({ fulfillment: "delivery" })
  })

  it("infers tenant from the first row when an unknown section has no shape hint — mobile's heuristic, mirrored", () => {
    const parsed = homeSectionSchema.parse({
      section: "neighbourhoodGems",
      metadata: { title: "X", description: null },
      data: [
        {
          id: "restaurant-1",
          slug: "al-rehman",
          name: { en: "Al Rehman" },
          coverPicture: null,
          restaurantPicture: "https://cdn.example.com/logo.jpg",
          rating: null,
          totalReviews: 0,
          deliveryFee: "0",
          freeDelivery: true,
          openNow: true,
          businessHoursStatusKey: "open",
          nextOpenTime: null
        }
      ]
    })

    expect(parsed.kind).toBe("tenant")
  })

  it("drops an unknown section's malformed rows rather than throwing", () => {
    const parsed = homeSectionSchema.parse({
      section: "somethingNew",
      metadata: { title: "X", description: null, shape: "rectangle" },
      data: [{ id: "half-a-row" }]
    })

    expect(parsed.data).toEqual([])
  })

  it("falls over to the other kind when a mis-declared unknown section parses nothing — the backend defaults shape to rectangle for sections missing its metadata map", () => {
    const parsed = homeSectionSchema.parse({
      section: "newBrandRail",
      // Declared rectangle (product), but every row is a tenant.
      metadata: { title: "X", description: null, shape: "rectangle" },
      data: [
        {
          id: "restaurant-1",
          slug: "al-rehman",
          name: { en: "Al Rehman" },
          coverPicture: null,
          restaurantPicture: null,
          rating: null,
          totalReviews: 0,
          deliveryFee: "0",
          freeDelivery: true,
          openNow: true,
          businessHoursStatusKey: "open",
          nextOpenTime: null
        }
      ]
    })

    expect(parsed.kind).toBe("tenant")
    expect(parsed.data[0]).toMatchObject({ fulfillment: "delivery" })
  })

  it("rejects a section with no title", () => {
    expect(() =>
      homeSectionSchema.parse({
        section: "desserts",
        metadata: { description: null, totalCount: 0 },
        data: []
      })
    ).toThrow()
  })
})

describe("homeSectionsResponseSchema", () => {
  it("parses an array of sections, in order", () => {
    const parsed = homeSectionsResponseSchema.parse([
      {
        section: "topPlaces",
        metadata: { title: "A", description: null, totalCount: 0 },
        data: []
      },
      {
        section: "tryNew",
        metadata: { title: "B", description: null, totalCount: 0 },
        data: []
      }
    ])

    expect(parsed.map((section) => section.section)).toEqual([
      "topPlaces",
      "tryNew"
    ])
  })

  it("parses an empty array — the whole feed may be empty", () => {
    expect(homeSectionsResponseSchema.parse([])).toEqual([])
  })

  it("keeps a section name this build does not know (2026-08-28) — the backend decides the stack", () => {
    const parsed = homeSectionsResponseSchema.parse([
      {
        section: "topPlaces",
        metadata: { title: "A", description: null, totalCount: 0 },
        data: []
      },
      {
        section: "sectionShippedAfterThisBuild",
        metadata: { title: "B", description: null, totalCount: 0 },
        data: []
      }
    ])

    expect(parsed.map((section) => section.section)).toEqual([
      "topPlaces",
      "sectionShippedAfterThisBuild"
    ])
  })

  it("drops an unknown section whose envelope cannot parse, rather than 500ing the page", () => {
    const parsed = homeSectionsResponseSchema.parse([
      {
        section: "topPlaces",
        metadata: { title: "A", description: null, totalCount: 0 },
        data: []
      },
      { section: "hasNoTitle", metadata: { description: null }, data: [] }
    ])

    expect(parsed.map((section) => section.section)).toEqual(["topPlaces"])
  })

  it("still throws on a known section carrying a malformed row", () => {
    expect(() =>
      homeSectionsResponseSchema.parse([
        {
          section: "desserts",
          metadata: { title: "A", description: null, totalCount: 0 },
          data: [{ id: "1" }]
        }
      ])
    ).toThrow()
  })
})

describe("homeDataPayloadSchema", () => {
  it("reads the section list out of the envelope's sections member — measured live, 2026-08-25", () => {
    const parsed = homeDataPayloadSchema.parse({
      sections: [
        {
          section: "topPlaces",
          metadata: { title: "A", description: null, totalCount: 0 },
          data: []
        }
      ],
      smartRecommendations: [],
      sort: "distance",
      location: { lat: 32.1, lng: 74.2 },
      metadata: { totalTenants: 0 }
    })

    expect(parsed.map((section) => section.section)).toEqual(["topPlaces"])
  })

  it("rejects a bare array — the real payload is never the sections list by itself", () => {
    expect(() => homeDataPayloadSchema.parse([])).toThrow()
  })
})

describe("categoryEntitySchema", () => {
  const ROW = {
    id: "category-1",
    parentId: null,
    rootCategoryId: "category-1",
    name: { en: "Chicken", ur: "Chicken" },
    description: null,
    image: "chicken.jpg",
    position: 2
  }

  it("parses a root tile", () => {
    expect(categoryEntitySchema.parse(ROW)).toMatchObject({
      id: "category-1",
      parentId: null,
      position: 2
    })
  })

  it("drops ar from the name, matching every other entity on this site", () => {
    expect(
      categoryEntitySchema.parse({
        ...ROW,
        name: { en: "Chicken", ar: "دجاج", ur: "Chicken" }
      }).name
    ).toEqual({ en: "Chicken", ur: "Chicken" })
  })

  it("keeps a non-root tile's parentId", () => {
    expect(
      categoryEntitySchema.parse({ ...ROW, parentId: "category-root" }).parentId
    ).toBe("category-root")
  })

  it("accepts a null rootCategoryId — measured live 2026-08-25: a root-level tile carries this, not its own id", () => {
    expect(
      categoryEntitySchema.parse({ ...ROW, rootCategoryId: null })
        .rootCategoryId
    ).toBeNull()
  })

  it("defaults position to 0 when absent", () => {
    const { position, ...withoutPosition } = ROW

    expect(categoryEntitySchema.parse(withoutPosition).position).toBe(0)
  })

  it("degrades an unusable image to null rather than failing the tile", () => {
    const oversized = "x".repeat(5000)

    expect(
      categoryEntitySchema.parse({ ...ROW, image: oversized }).image
    ).toBeNull()
  })

  it("rejects a tile with no name", () => {
    expect(() =>
      categoryEntitySchema.parse({ ...ROW, name: undefined })
    ).toThrow()
  })
})

describe("categoriesPayloadSchema", () => {
  it("reads the tile list out of the paginated envelope — measured live, 2026-08-25", () => {
    const parsed = categoriesPayloadSchema.parse({
      data: [
        {
          id: "category-1",
          parentId: null,
          rootCategoryId: "category-1",
          name: { en: "Tacos" },
          image: null,
          position: 0
        }
      ],
      total: 1,
      page: 0,
      limit: 20
    })

    expect(parsed).toHaveLength(1)
  })

  it("rejects a bare array — the real payload always carries pagination alongside data", () => {
    expect(() => categoriesPayloadSchema.parse([])).toThrow()
  })
})
