import { describe, expect, it } from "vitest"
import {
  FAVOURITE_TYPES,
  MAX_FAVOURITES_LIMIT,
  parseFavouritesListQuery,
  parseFavouritesListResponse,
  parseFavouritesPageBody,
  parseFavouriteTogglePayload,
  parseFavouriteToggleResponse
} from "../schemas"

/** The upstream's tenant projection — far wider than the card renders. */
const BACKEND_TENANT = {
  address: "Trust Plaza, GT Road",
  commissionRate: "12.5",
  coordinates: { lat: 32.16, lng: 74.18 },
  coverPicture: "https://cdn.test.invalid/cover.jpg",
  deliveryRadiusKm: 8,
  id: "tenant-1",
  isFavorite: true,
  minimumOrderValue: "500.00",
  name: { ar: "مطعم", en: "Chattha Chargha", ur: "Chattha Chargha" },
  rating: "4.5",
  restaurantPicture: "https://cdn.test.invalid/mark.jpg",
  reviewsCount: 42,
  slug: "chattha-chargha",
  tenantStatus: "active"
}

/** The upstream's product projection, likewise. */
const BACKEND_PRODUCT = {
  branch: { ...BACKEND_TENANT, id: "branch-9" },
  branchId: "branch-9",
  categoryId: "cat-1",
  createdAt: "2026-09-01T00:00:00Z",
  description: { en: "Half chargha" },
  id: "product-1",
  images: ["https://cdn.test.invalid/dish.jpg"],
  isFavorite: true,
  isProductInventory: true,
  menuSlugs: ["lunch"],
  name: { en: "Chargha Half" },
  price: "690.00",
  sku: "CH-1",
  stock: 12,
  tenantId: "tenant-1"
}

/**
 * One favourite row as the service assembles it.
 * @param id - The favourite row's own id
 * @param overrides - Fields to replace on the row
 * @returns The row
 */
function favouriteRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    createdAt: "2026-09-01T00:00:00Z",
    id,
    productId: null,
    tenant: BACKEND_TENANT,
    tenantId: "tenant-1",
    type: "tenant",
    updatedAt: "2026-09-01T00:00:00Z",
    userId: "user-9",
    ...overrides
  }
}

/**
 * Wraps rows in the upstream's list envelope.
 * @param items - The rows
 * @param extra - Paging fields to state
 * @returns The envelope
 */
function listEnvelope(items: unknown[], extra: Record<string, unknown> = {}) {
  return {
    data: { items, limit: 20, page: 0, total: 2, ...extra },
    success: true
  }
}

describe("FAVOURITE_TYPES", () => {
  it("is the backend's enum, US spelling, in a stable order", () => {
    expect(FAVOURITE_TYPES).toEqual(["product", "tenant"])
    expect(MAX_FAVOURITES_LIMIT).toBe(100)
  })
})

describe("parseFavouriteTogglePayload", () => {
  it.each([
    ["a tenant body", { tenantId: "t1", type: "tenant" }],
    ["a product body", { productId: "p1", type: "product" }]
  ])("accepts %s", (_name, body) => {
    const parsed = parseFavouriteTogglePayload(body)

    expect(parsed.ok).toBe(true)
    expect(parsed.ok && parsed.payload).toEqual(body)
  })

  it.each([
    ["a tenant body with no tenantId", { type: "tenant" }],
    ["a product body with no productId", { type: "product" }],
    [
      "a tenant body carrying only a productId",
      { productId: "p1", type: "tenant" }
    ],
    ["an unknown type", { tenantId: "t1", type: "restaurant" }],
    ["an empty id", { tenantId: "", type: "tenant" }],
    ["no body at all", null],
    ["an array", []],
    ["a string", "tenant"]
  ])("refuses %s", (_name, body) => {
    const parsed = parseFavouriteTogglePayload(body)

    expect(parsed.ok).toBe(false)
    expect(parsed.ok === false && parsed.fields.length).toBeGreaterThan(0)
  })

  it("names the offending field rather than answering an opaque failure", () => {
    const parsed = parseFavouriteTogglePayload({ tenantId: "", type: "tenant" })

    expect(parsed.ok === false && parsed.fields).toEqual(["tenantId"])
  })

  it("strips every key the body does not name", () => {
    // A caller must not be able to smuggle a column upstream on this proxy's
    // bearer token.
    const parsed = parseFavouriteTogglePayload({
      tenantId: "t1",
      type: "tenant",
      userId: "someone-else"
    })

    expect(parsed.ok && parsed.payload).toEqual({
      tenantId: "t1",
      type: "tenant"
    })
  })
})

describe("parseFavouritesListQuery", () => {
  it("passes a sane query through untouched", () => {
    expect(
      parseFavouritesListQuery({ limit: "20", page: "2", type: "product" })
    ).toEqual({ limit: 20, page: 2, type: "product" })
  })

  it.each([
    ["over the upstream cap", { limit: "1000" }, MAX_FAVOURITES_LIMIT],
    ["zero", { limit: "0" }, MAX_FAVOURITES_LIMIT],
    ["negative", { limit: "-5" }, MAX_FAVOURITES_LIMIT],
    ["not a number", { limit: "all" }, MAX_FAVOURITES_LIMIT],
    ["fractional", { limit: "10.5" }, MAX_FAVOURITES_LIMIT]
  ])("clamps a limit that is %s", (_name, query, expected) => {
    // Forwarded verbatim, `?limit=1000` earns a VALIDATION_ERROR 400 that the
    // proxy reduces to `unavailable` — the visitor is told the service is down
    // and a proxy failure is logged that never happened.
    expect(parseFavouritesListQuery(query).limit).toBe(expected)
  })

  it.each([
    ["negative", { page: "-1" }],
    ["not a number", { page: "next" }],
    ["absent", {}]
  ])("floors a page that is %s at zero", (_name, query) => {
    expect(parseFavouritesListQuery(query).page).toBe(0)
  })

  it("drops a type the upstream enum does not know", () => {
    expect(parseFavouritesListQuery({ type: "voucher" }).type).toBeUndefined()
  })

  it("has no lat/lng to clamp, and must not grow one", () => {
    // With them the upstream replaces `total` with the post-filter page length,
    // and `total` is what hydration pages against.
    expect(Object.keys(parseFavouritesListQuery({})).sort()).toEqual([
      "limit",
      "page",
      "type"
    ])
  })
})

describe("parseFavouriteToggleResponse", () => {
  it.each([
    [
      "the upstream envelope",
      { data: { isFavorite: true }, success: true },
      "data" as const,
      true
    ],
    [
      "the proxy envelope",
      { favourite: { isFavorite: false } },
      "favourite" as const,
      false
    ]
  ])("reads %s", (_name, body, key, expected) => {
    expect(parseFavouriteToggleResponse(body, key)).toEqual({
      isFavorite: expected
    })
  })

  it("drops the `code` the contract carries and nothing renders", () => {
    expect(
      parseFavouriteToggleResponse(
        { data: { code: "ADD_TO_FAVORITE", isFavorite: true }, success: true },
        "data"
      )
    ).toEqual({ isFavorite: true })
  })

  it.each([
    ["a null body", null],
    ["a string body", "ok"],
    ["the wrong key", { favourite: { isFavorite: true } }],
    ["a non-boolean isFavorite", { data: { isFavorite: "yes" } }],
    [
      "an error envelope with no success field",
      { code: "UNAUTHORIZED", statusCode: 401 }
    ]
  ])("answers null for %s", (_name, body) => {
    expect(parseFavouriteToggleResponse(body, "data")).toBeNull()
  })
})

describe("parseFavouritesListResponse", () => {
  it("narrows a tenant row to the fields the card renders", () => {
    const page = parseFavouritesListResponse(
      listEnvelope([favouriteRow("f1")]),
      "data"
    )

    expect(page?.items).toEqual([
      {
        branchName: null,
        entityId: "tenant-1",
        id: "f1",
        imageUrl: "https://cdn.test.invalid/mark.jpg",
        name: { en: "Chattha Chargha", ur: "Chattha Chargha" },
        price: null,
        slug: "chattha-chargha",
        type: "tenant"
      }
    ])
  })

  it("keeps NONE of the upstream's wider projection", () => {
    const page = parseFavouritesListResponse(
      listEnvelope([favouriteRow("f1")]),
      "data"
    )
    const serialised = JSON.stringify(page)

    for (const leaked of [
      "commissionRate",
      "coordinates",
      "deliveryRadiusKm",
      "minimumOrderValue",
      "userId",
      "tenantStatus"
    ]) {
      expect(serialised).not.toContain(leaked)
    }
  })

  it("narrows a product row, including its branch name and decimal price", () => {
    const page = parseFavouritesListResponse(
      listEnvelope([
        favouriteRow("f2", {
          product: BACKEND_PRODUCT,
          productId: "product-1",
          tenant: undefined,
          tenantId: null,
          type: "product"
        })
      ]),
      "data"
    )

    expect(page?.items[0]).toEqual({
      branchName: { en: "Chattha Chargha", ur: "Chattha Chargha" },
      entityId: "product-1",
      id: "f2",
      imageUrl: "https://cdn.test.invalid/dish.jpg",
      name: { en: "Chargha Half" },
      price: 690,
      // The BRANCH's slug, not the product's: the upstream's favourites product
      // projection selects no product slug, and the row links to the restaurant
      // page that sells the dish.
      slug: "chattha-chargha",
      type: "product"
    })
  })

  it.each([
    [
      "a tenant row whose tenant failed the visibility filter",
      { tenant: undefined }
    ],
    ["a tenant row whose tenant is null", { tenant: null }],
    [
      "a product row whose product failed it",
      { product: undefined, tenant: undefined, type: "product" }
    ],
    ["a row with no id", { id: "" }],
    ["a row with an unknown type", { type: "voucher" }]
  ])("drops %s but keeps the page", (_name, overrides) => {
    const page = parseFavouritesListResponse(
      listEnvelope([favouriteRow("f1", overrides), favouriteRow("f2")]),
      "data"
    )

    expect(page?.items.map((row) => row.id)).toEqual(["f2"])
    // The dropped row still counts as received, so has-more stays honest.
    expect(page?.receivedCount).toBe(2)
  })

  it.each([
    ["null", null],
    ["an empty object", {}],
    ["blank English", { en: "  " }],
    ["a key the locale enum does not know", { fr: "Poulet" }],
    ["a number", 7],
    ["an array", []]
  ])("DEGRADES a name that is %s to null instead of dropping the customer's row", (_name, name) => {
    // `src/core/catalog` drops a nameless record on purpose — a blank row in
    // a public listing of thousands. This page is nothing BUT records the
    // customer saved, so a favourite that vanishes because one jsonb column
    // is `{}` is a favourite they are told they never made.
    const page = parseFavouritesListResponse(
      listEnvelope([
        favouriteRow("f1", { tenant: { ...BACKEND_TENANT, name } })
      ]),
      "data"
    )

    expect(page?.items).toHaveLength(1)
    expect(page?.items[0]?.name).toBeNull()
    expect(page?.items[0]?.entityId).toBe("tenant-1")
    expect(page?.dropReasons).toEqual([])
  })

  it("degrades an unusable BRANCH name the same way, keeping the dish", () => {
    const page = parseFavouritesListResponse(
      listEnvelope([
        favouriteRow("f2", {
          product: { ...BACKEND_PRODUCT, branch: { name: 7 } },
          tenant: undefined,
          type: "product"
        })
      ]),
      "data"
    )

    expect(page?.items).toHaveLength(1)
    expect(page?.items[0]?.branchName).toBeNull()
  })

  it.each([
    ["tenant:absent", { tenant: undefined }],
    [
      "product:absent",
      { product: undefined, tenant: undefined, type: "product" }
    ],
    ["id", { id: "" }],
    ["type", { type: "voucher" }]
  ])("reports %s as the reason a row was dropped", (reason, overrides) => {
    // A withdrawn record and a malformed one used to be indistinguishable, so a
    // customer's favourites disappearing left nothing to look at anywhere.
    const page = parseFavouritesListResponse(
      listEnvelope([favouriteRow("f1", overrides)]),
      "data"
    )

    expect(page?.dropReasons).toEqual([reason])
  })

  it("reports PATHS only — never a value out of the customer's own data", () => {
    const page = parseFavouritesListResponse(
      listEnvelope([
        favouriteRow("f1", {
          tenant: { ...BACKEND_TENANT, id: "" },
          tenantId: "secret-tenant"
        })
      ]),
      "data"
    )
    const serialised = JSON.stringify(page?.dropReasons)

    expect(serialised).toContain("tenant.id")
    expect(serialised).not.toContain("secret-tenant")
    expect(serialised).not.toContain("Chattha")
  })

  it("answers NO reasons for a healthy page, which is what makes silence readable", () => {
    // An empty page with no reasons means the upstream returned no rows, so the
    // fault is upstream of this parse.
    const page = parseFavouritesListResponse(listEnvelope([]), "data")

    expect(page?.dropReasons).toEqual([])
    expect(page?.receivedCount).toBe(0)
  })

  it("keeps only the first occurrence of a repeated favourite id", () => {
    const page = parseFavouritesListResponse(
      listEnvelope([favouriteRow("f1"), favouriteRow("f1")]),
      "data"
    )

    expect(page?.items).toHaveLength(1)
    expect(page?.receivedCount).toBe(2)
    expect(page?.dropReasons).toEqual(["id:duplicate"])
  })

  it("reads the proxy's own `page` key as well as the upstream's `data`", () => {
    const page = parseFavouritesListResponse(
      { page: { items: [favouriteRow("f1")], limit: 10 } },
      "page"
    )

    expect(page?.items).toHaveLength(1)
    expect(page?.limit).toBe(10)
    expect(page?.total).toBeNull()
  })

  it.each([
    ["a malformed envelope", { data: { items: "nope" } }],
    ["a missing page", { success: true }],
    ["a null body", null],
    ["a string body", "items"],
    ["an error envelope", { code: "UNAUTHORIZED", statusCode: 401 }]
  ])("answers null for %s", (_name, body) => {
    expect(parseFavouritesListResponse(body, "data")).toBeNull()
  })

  it("tolerates an unusable row shape entirely", () => {
    const page = parseFavouritesListResponse(
      listEnvelope([null, 7, "row", [], favouriteRow("f1")]),
      "data"
    )

    expect(page?.items.map((row) => row.id)).toEqual(["f1"])
    expect(page?.receivedCount).toBe(5)
  })

  it("reports absent paging numbers as null rather than guessing", () => {
    const page = parseFavouritesListResponse({ data: { items: [] } }, "data")

    expect(page).toEqual({
      dropReasons: [],
      items: [],
      limit: null,
      receivedCount: 0,
      total: null
    })
  })

  it.each([
    ["a blank string", ""],
    ["whitespace", "   "],
    ["not a number", "not a price"],
    ["null", null]
  ])("reports a price that is %s as absent, never as zero", (_name, price) => {
    // `Number("")` is `0` and `0` is finite, so a blank price column rendered
    // as "Rs 0" — a dish the customer would read as free.
    const page = parseFavouritesListResponse(
      listEnvelope([
        favouriteRow("fp", {
          product: { ...BACKEND_PRODUCT, price },
          tenant: undefined,
          type: "product"
        })
      ]),
      "data"
    )

    expect(page?.items[0]?.price).toBeNull()
  })

  it("keeps a genuine zero price, which is not the same as a blank one", () => {
    const page = parseFavouritesListResponse(
      listEnvelope([
        favouriteRow("fz", {
          product: { ...BACKEND_PRODUCT, price: "0.00" },
          tenant: undefined,
          type: "product"
        })
      ]),
      "data"
    )

    expect(page?.items[0]?.price).toBe(0)
  })

  it("degrades an unusable product price and image instead of dropping the dish", () => {
    const page = parseFavouritesListResponse(
      listEnvelope([
        favouriteRow("f3", {
          product: {
            ...BACKEND_PRODUCT,
            images: [null, 12],
            price: "not a price"
          },
          tenant: undefined,
          type: "product"
        })
      ]),
      "data"
    )

    expect(page?.items[0]?.price).toBeNull()
    expect(page?.items[0]?.imageUrl).toBeNull()
  })

  it("falls back to the cover when a restaurant has no mark", () => {
    const page = parseFavouritesListResponse(
      listEnvelope([
        favouriteRow("f4", {
          tenant: { ...BACKEND_TENANT, restaurantPicture: null }
        })
      ]),
      "data"
    )

    expect(page?.items[0]?.imageUrl).toBe("https://cdn.test.invalid/cover.jpg")
  })

  it("keeps a dish whose branch the projection omitted", () => {
    const page = parseFavouritesListResponse(
      listEnvelope([
        favouriteRow("f5", {
          product: { ...BACKEND_PRODUCT, branch: undefined },
          tenant: undefined,
          type: "product"
        })
      ]),
      "data"
    )

    expect(page?.items[0]?.branchName).toBeNull()
    expect(page?.items[0]?.name).toEqual({ en: "Chargha Half" })
  })
})

describe("parseFavouritesPageBody", () => {
  /** The proxy's own answer: rows ALREADY narrowed to `FavouriteRow`. */
  const proxyBody = {
    page: {
      dropReasons: [],
      items: [
        {
          branchName: null,
          entityId: "28269cd8",
          id: "2e354633",
          imageUrl: "https://fishtownco.itoasis.co/a.png",
          name: { en: "alif kitchen", ur: "alif kitchen" },
          price: null,
          type: "tenant"
        },
        {
          branchName: { en: "fastfood - Main Branch" },
          entityId: "979a4cd7",
          id: "659a50b6",
          imageUrl: "https://fishtownco.itoasis.co/b.jpg",
          name: { en: "Patty burger" },
          price: 200,
          type: "product"
        }
      ],
      limit: 20,
      receivedCount: 5,
      total: 5
    }
  }

  it("keeps rows the proxy already narrowed", () => {
    // The bug: re-running the UPSTREAM narrowing over these dropped every row
    // as `tenant:absent`, so a page of five favourites rendered as "we could
    // not show your favourites".
    const page = parseFavouritesPageBody(proxyBody)

    expect(page?.items.map((row) => row.entityId)).toEqual([
      "28269cd8",
      "979a4cd7"
    ])
    expect(page?.dropReasons).toEqual([])
  })

  it("keeps the upstream's pre-narrowing count for has-more", () => {
    expect(parseFavouritesPageBody(proxyBody)?.receivedCount).toBe(5)
  })

  it("answers null when the body carries no page", () => {
    expect(parseFavouritesPageBody({ data: { items: [] } })).toBeNull()
  })
})
