import { afterEach, describe, expect, test } from "vitest"
import {
  assertGeoCoordinates,
  buildPhotonReverseSearchParams,
  buildPhotonSearchSearchParams,
  composeLabel,
  parsePhotonFeature,
  parsePhotonFeatures,
  reverseGeocode,
  searchAddresses
} from "../api"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

function mockFetch(payload: unknown, calls: string[] = []) {
  globalThis.fetch = (async (url: string) => {
    calls.push(String(url))
    return {
      ok: true,
      status: 200,
      json: async () => payload
    }
  }) as typeof fetch
}

function feature(
  properties: Record<string, string>,
  coordinates: readonly number[] = [74.35, 31.52]
) {
  return { geometry: { coordinates }, properties }
}

describe("photon params", () => {
  test("builds reverse params in Photon's lat/lon spelling", () => {
    expect(buildPhotonReverseSearchParams({ lat: 31.52, lng: 74.35 })).toEqual({
      lat: "31.52",
      lon: "74.35",
      lang: "en"
    })
  })

  test("search params trim, cap and always restrict to Pakistan", () => {
    expect(
      buildPhotonSearchSearchParams({
        query: "  Model Town  ",
        language: "ur",
        limit: 3
      })
    ).toEqual({
      q: "Model Town",
      lang: "ur",
      limit: "3",
      countrycode: "pk"
    })
  })

  test("sends no location bias — the shared search box cannot carry one", () => {
    const params = buildPhotonSearchSearchParams({ query: "Street 3" })
    expect(params.lat).toBeUndefined()
    expect(params.lon).toBeUndefined()
    expect(params.location_bias_scale).toBeUndefined()
  })
})

describe("composeLabel", () => {
  test("joins present parts and drops empties", () => {
    expect(composeLabel(["221", undefined, "  ", "Street 3"])).toBe(
      "221, Street 3"
    )
  })

  test("drops case-insensitive repeats", () => {
    expect(composeLabel(["Dua Cafe", "dua cafe", "Street 3"])).toBe(
      "Dua Cafe, Street 3"
    )
  })

  test("answers an empty string when nothing is usable", () => {
    expect(composeLabel([undefined, "", "   "])).toBe("")
  })
})

describe("parsePhotonFeature", () => {
  test("reads GeoJSON [lon, lat] without transposing", () => {
    // The guard for the whole swap: Photon answers [longitude, latitude],
    // Nominatim answered lat/lon strings. A transposition parses cleanly and
    // silently points at the wrong hemisphere — 74.35N/31.52E is Kazakhstan.
    const parsed = parsePhotonFeature(feature({ city: "Lahore" }))

    expect(parsed?.coordinates).toEqual({ lat: 31.52, lng: 74.35 })
  })

  test("composes a label from house number, street, district and city", () => {
    const parsed = parsePhotonFeature(
      feature({
        housenumber: "221",
        street: "Street 3",
        district: "Magnoliya Park",
        city: "Gujranwala",
        state: "Punjab"
      })
    )

    expect(parsed?.label).toBe(
      "221, Street 3, Magnoliya Park, Gujranwala, Punjab"
    )
    expect(parsed?.houseNumber).toBe("221")
    expect(parsed?.street).toBe("Street 3")
  })

  test("falls back to county when Photon names no city", () => {
    const parsed = parsePhotonFeature(
      feature({ county: "Gujranwala District" })
    )

    expect(parsed?.city).toBe("Gujranwala District")
  })

  test("leaves city undefined when neither is present", () => {
    // This absence is what reveals the "we're missing your suburb" field.
    const parsed = parsePhotonFeature(feature({ street: "Street 3" }))

    expect(parsed?.city).toBeUndefined()
  })

  test("keeps the requested point when an override is given", () => {
    const parsed = parsePhotonFeature(feature({ city: "Lahore" }), {
      lat: 32.1,
      lng: 74.2
    })

    expect(parsed?.coordinates).toEqual({ lat: 32.1, lng: 74.2 })
  })

  test("answers null for a feature with no usable point", () => {
    expect(parsePhotonFeature({ properties: { city: "Lahore" } })).toBeNull()
    expect(
      parsePhotonFeature(feature({}, ["x" as unknown as number]))
    ).toBeNull()
  })

  test("survives a feature with no properties at all", () => {
    const parsed = parsePhotonFeature({
      geometry: { coordinates: [74.35, 31.52] }
    })

    expect(parsed?.label).toBe("")
    expect(parsed?.coordinates).toEqual({ lat: 31.52, lng: 74.35 })
  })
})

describe("parsePhotonFeatures", () => {
  test("drops unusable rows and keeps the rest", () => {
    const parsed = parsePhotonFeatures({
      features: [
        feature({ city: "Lahore" }),
        { properties: { city: "Nowhere" } },
        feature({ city: "Gujranwala" }, [74.2, 32.1])
      ]
    })

    expect(parsed).toHaveLength(2)
    expect(parsed[1]?.coordinates).toEqual({ lat: 32.1, lng: 74.2 })
  })

  test("answers an empty list for an empty envelope", () => {
    expect(parsePhotonFeatures({})).toEqual([])
  })
})

describe("assertGeoCoordinates", () => {
  test("rejects non-finite values", () => {
    expect(() => assertGeoCoordinates({ lat: Number.NaN, lng: 1 })).toThrow(
      "Invalid coordinates"
    )
    expect(() =>
      assertGeoCoordinates({ lat: 1, lng: Number.POSITIVE_INFINITY })
    ).toThrow("Invalid coordinates")
  })
})

describe("reverseGeocode", () => {
  test("hits /reverse and keeps the requested coordinates", async () => {
    const calls: string[] = []
    mockFetch(
      { features: [feature({ city: "Gujranwala" }, [74.9, 31.9])] },
      calls
    )

    const result = await reverseGeocode({ lat: 32.102_014, lng: 74.208_89 })

    expect(calls[0]).toContain("https://photon.komoot.io/reverse?")
    expect(calls[0]).toContain("lat=32.102014")
    // Photon answered a point a street away; the pin the visitor placed wins.
    expect(result.coordinates).toEqual({ lat: 32.102_014, lng: 74.208_89 })
    expect(result.city).toBe("Gujranwala")
  })

  test("answers an empty label when nothing is mapped near the pin", async () => {
    mockFetch({ features: [] })

    const result = await reverseGeocode({ lat: 32.1, lng: 74.2 })

    expect(result).toEqual({ label: "", coordinates: { lat: 32.1, lng: 74.2 } })
  })

  test("rejects invalid coordinates before reaching the network", async () => {
    globalThis.fetch = (() => {
      throw new Error("must not be called")
    }) as unknown as typeof fetch

    await expect(
      reverseGeocode({ lat: Number.NaN, lng: 74.2 })
    ).rejects.toThrow("Invalid coordinates")
  })
})

describe("searchAddresses", () => {
  test("hits /api with the query and returns parsed hits", async () => {
    const calls: string[] = []
    mockFetch({ features: [feature({ name: "Magnoliya Park" })] }, calls)

    const results = await searchAddresses({ query: "Magnoliya" })

    expect(calls[0]).toContain("https://photon.komoot.io/api?")
    expect(calls[0]).toContain("countrycode=pk")
    expect(results[0]?.label).toBe("Magnoliya Park")
  })

  test("answers an empty list for a blank query without calling out", async () => {
    globalThis.fetch = (() => {
      throw new Error("must not be called")
    }) as unknown as typeof fetch

    expect(await searchAddresses({ query: "   " })).toEqual([])
  })

  test("propagates a Photon outage to the caller", async () => {
    globalThis.fetch = (async () => ({
      ok: false,
      status: 503,
      json: async () => ({})
    })) as unknown as typeof fetch

    await expect(searchAddresses({ query: "Lahore" })).rejects.toThrow(
      "Photon request failed (503)"
    )
  })
})
