import { describe, expect, test } from "bun:test"
import type { GeoCityListResponse } from "../types"
import {
  buildGeoAreaAtPointSearchParams,
  buildGeoAreaListSearchParams,
  buildGeoAreaServicesSearchParams,
  buildGeoCityAreasSearchParams,
  buildGeoCityListSearchParams,
  buildGeoListSearchParams,
  collectGeoListPages,
  listGeoAreaServices,
  listGeoAreas,
  listGeoAreasByCity,
  listGeoCities,
  nextGeoListPage,
  remainingGeoListPages,
  resolveGeoAreaAtPoint
} from "../api"
import { GEO_API, GEO_DEFAULT_PAGE, GEO_LIST_PAGE_SIZE } from "../constants"
import type { GeoHttp } from "../http"

function mockHttp(impl: {
  get?: (
    path: string,
    searchParams?: Record<string, string>
  ) => Promise<unknown>
}): GeoHttp {
  return {
    get: async <TResponse>(
      path: string,
      searchParams?: Record<string, string>
    ) => {
      if (!impl.get) {
        throw new Error("get unused")
      }
      return (await impl.get(path, searchParams)) as TResponse
    }
  }
}

describe("buildGeoListSearchParams", () => {
  test("defaults page and limit and omits blank filters", () => {
    expect(buildGeoListSearchParams()).toEqual({
      page: String(GEO_DEFAULT_PAGE),
      limit: String(GEO_LIST_PAGE_SIZE)
    })
    expect(
      buildGeoListSearchParams({
        page: 2,
        limit: 20,
        search: " lahore ",
        sort: "slug"
      })
    ).toEqual({
      page: "2",
      limit: "20",
      search: "lahore",
      sort: "slug"
    })
  })
})

describe("buildGeoCityListSearchParams", () => {
  test("serializes city list filters", () => {
    expect(buildGeoCityListSearchParams({ page: 1, limit: 10 })).toEqual({
      page: "1",
      limit: "10"
    })
  })
})

describe("buildGeoAreaListSearchParams", () => {
  test("adds cityId when present", () => {
    expect(buildGeoAreaListSearchParams()).toEqual({
      page: String(GEO_DEFAULT_PAGE),
      limit: String(GEO_LIST_PAGE_SIZE)
    })
    expect(
      buildGeoAreaListSearchParams({ cityId: "  city-1  ", page: 0, limit: 50 })
    ).toEqual({
      page: "0",
      limit: "50",
      cityId: "city-1"
    })
  })
})

describe("buildGeoCityAreasSearchParams", () => {
  test("omits services unless it is true", () => {
    expect(buildGeoCityAreasSearchParams()).toEqual({
      page: String(GEO_DEFAULT_PAGE),
      limit: String(GEO_LIST_PAGE_SIZE)
    })
    expect(buildGeoCityAreasSearchParams({ services: false })).toEqual({
      page: String(GEO_DEFAULT_PAGE),
      limit: String(GEO_LIST_PAGE_SIZE)
    })
    expect(
      buildGeoCityAreasSearchParams({
        page: 0,
        limit: 20,
        services: true
      })
    ).toEqual({
      page: "0",
      limit: "20",
      services: "true"
    })
  })
})

describe("buildGeoAreaServicesSearchParams", () => {
  test("serializes list filters", () => {
    expect(buildGeoAreaServicesSearchParams({ page: 1, limit: 20 })).toEqual({
      page: "1",
      limit: "20"
    })
  })
})

describe("buildGeoAreaAtPointSearchParams", () => {
  test("serializes the point and optional fallback", () => {
    expect(
      buildGeoAreaAtPointSearchParams({
        latitude: 32.1,
        longitude: 74.2
      })
    ).toEqual({
      latitude: "32.1",
      longitude: "74.2"
    })
    expect(
      buildGeoAreaAtPointSearchParams({
        latitude: 32.1,
        longitude: 74.2,
        fallbackMaxKm: 20
      })
    ).toEqual({
      latitude: "32.1",
      longitude: "74.2",
      fallbackMaxKm: "20"
    })
  })

  test("throws when latitude or longitude is not finite", () => {
    expect(() =>
      buildGeoAreaAtPointSearchParams({
        latitude: Number.NaN,
        longitude: 74.2
      })
    ).toThrow("Geo at-point latitude and longitude must be finite")
    expect(() =>
      buildGeoAreaAtPointSearchParams({
        latitude: 32.1,
        longitude: Number.POSITIVE_INFINITY
      })
    ).toThrow("Geo at-point latitude and longitude must be finite")
  })
})

describe("listGeoCities", () => {
  test("GETs geo-cities with serialized params", async () => {
    const calls: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    // A pass-through test: the helper forwards whatever the transport returns,
    // so a stub item is enough and the assertion only needs the response type.
    const body = {
      success: true,
      data: { items: [{ id: "c1" }], total: 1, page: 0, limit: 100 }
    } as GeoCityListResponse
    const http = mockHttp({
      get: (path, searchParams) => {
        calls.push({ path, searchParams })
        return Promise.resolve(body)
      }
    })

    const response = await listGeoCities(http, { page: 0, limit: 100 })

    expect(calls).toEqual([
      {
        path: GEO_API.cities,
        searchParams: { page: "0", limit: "100" }
      }
    ])
    expect(response).toEqual(body)
  })
})

describe("listGeoAreas", () => {
  test("GETs geo-areas with optional cityId", async () => {
    const calls: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const body = {
      success: true,
      data: { items: [], total: 0, page: 0, limit: 100 }
    }
    const http = mockHttp({
      get: (path, searchParams) => {
        calls.push({ path, searchParams })
        return Promise.resolve(body)
      }
    })

    await listGeoAreas(http, { cityId: "city-1" })

    expect(calls).toEqual([
      {
        path: GEO_API.areas,
        searchParams: {
          page: "0",
          limit: "100",
          cityId: "city-1"
        }
      }
    ])
  })
})

describe("listGeoAreasByCity", () => {
  test("GETs geo-cities/:id/areas", async () => {
    const calls: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const body = {
      success: true,
      data: { items: [{ id: "a1" }], total: 1, page: 0, limit: 100 }
    }
    const http = mockHttp({
      get: (path, searchParams) => {
        calls.push({ path, searchParams })
        return Promise.resolve(body)
      }
    })

    const response = await listGeoAreasByCity(http, { cityId: "city 1" })

    expect(calls).toEqual([
      {
        path: GEO_API.cityAreas("city 1"),
        searchParams: { page: "0", limit: "100" }
      }
    ])
    expect(response.data.items[0]?.id).toBe("a1")
  })

  test("throws when cityId is blank", () => {
    const http = mockHttp({})
    expect(() => listGeoAreasByCity(http, { cityId: "  " })).toThrow(
      "Geo city id is required"
    )
  })

  test("sends services=true only when requested", async () => {
    const calls: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const http = mockHttp({
      get: (path, searchParams) => {
        calls.push({ path, searchParams })
        return Promise.resolve({
          success: true,
          data: { items: [], total: 0, page: 0, limit: 20 }
        })
      }
    })

    await listGeoAreasByCity(http, {
      cityId: "city-1",
      page: 0,
      limit: 20,
      services: true
    })

    expect(calls).toEqual([
      {
        path: GEO_API.cityAreas("city-1"),
        searchParams: { page: "0", limit: "20", services: "true" }
      }
    ])
  })
})

describe("listGeoAreaServices", () => {
  test("GETs geo-areas/:id/services", async () => {
    const calls: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const body = {
      success: true,
      data: {
        items: [{ id: "s1", slug: "grocery" }],
        total: 1,
        page: 0,
        limit: 100
      }
    }
    const http = mockHttp({
      get: (path, searchParams) => {
        calls.push({ path, searchParams })
        return Promise.resolve(body)
      }
    })

    const response = await listGeoAreaServices(http, { areaId: "area 1" })

    expect(calls).toEqual([
      {
        path: GEO_API.areaServices("area 1"),
        searchParams: { page: "0", limit: "100" }
      }
    ])
    expect(response.data.items[0]?.id).toBe("s1")
  })

  test("throws when areaId is blank", () => {
    const http = mockHttp({})
    expect(() => listGeoAreaServices(http, { areaId: "  " })).toThrow(
      "Geo area id is required"
    )
  })
})

describe("resolveGeoAreaAtPoint", () => {
  test("GETs geo-areas/at-point", async () => {
    const calls: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const body = { success: true, data: { id: "a1", distanceKm: 0 } }
    const http = mockHttp({
      get: (path, searchParams) => {
        calls.push({ path, searchParams })
        return Promise.resolve(body)
      }
    })

    const response = await resolveGeoAreaAtPoint(http, {
      latitude: 32.102_014,
      longitude: 74.208_89,
      fallbackMaxKm: 20
    })

    expect(calls).toEqual([
      {
        path: GEO_API.areaAtPoint,
        searchParams: {
          latitude: "32.102014",
          longitude: "74.20889",
          fallbackMaxKm: "20"
        }
      }
    ])
    expect(response.data?.id).toBe("a1")
  })
})

describe("nextGeoListPage", () => {
  test("returns the next page until every item is loaded", () => {
    expect(nextGeoListPage(100, 240, 100)).toBe(1)
    expect(nextGeoListPage(200, 240, 100)).toBe(2)
    expect(nextGeoListPage(240, 240, 100)).toBeUndefined()
    expect(nextGeoListPage(0, 0, 100)).toBeUndefined()
  })
})

describe("remainingGeoListPages", () => {
  test("lists page indexes after the first page", () => {
    expect(remainingGeoListPages(100, 100)).toEqual([])
    expect(remainingGeoListPages(240, 100)).toEqual([1, 2])
    expect(remainingGeoListPages(0, 100)).toEqual([])
  })
})

describe("collectGeoListPages", () => {
  test("loads later pages in parallel and concatenates items", async () => {
    const pages = [0, 1, 2]
    const fetched: number[] = []
    const combined = await collectGeoListPages((page) => {
      fetched.push(page)
      return Promise.resolve({
        items: [`p${page}`],
        total: 3,
        page,
        limit: 1
      })
    })

    expect(fetched[0]).toBe(0)
    expect(pages.slice(1).every((page) => fetched.includes(page))).toBe(true)
    expect(combined.items).toEqual(["p0", "p1", "p2"])
    expect(combined.total).toBe(3)
  })
})
