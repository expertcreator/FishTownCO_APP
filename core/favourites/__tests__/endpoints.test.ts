import { describe, expect, it } from "vitest"
import { FAVOURITES_ENDPOINTS } from "../endpoints"

describe("FAVOURITES_ENDPOINTS", () => {
  it.each([
    ["list", "GET", "favorites"],
    ["toggle", "POST", "favorites/toggle"]
  ] as const)("%s is %s %s", (name, method, path) => {
    const endpoint = FAVOURITES_ENDPOINTS[name]

    expect(endpoint.method).toBe(method)
    expect(endpoint.path()).toBe(path)
  })

  it("carries NO leading slash and NO gateway prefix on either path", () => {
    // The `discovery/api/v1` segment is config and belongs to
    // `discoveryServiceUrl`; a leading slash here would resolve against the
    // host root and drop it.
    for (const endpoint of Object.values(FAVOURITES_ENDPOINTS)) {
      expect(endpoint.path().startsWith("/")).toBe(false)
      expect(endpoint.path()).not.toContain("discovery/")
      expect(endpoint.path()).not.toContain("api/v1")
    }
  })

  it("spells the wire in US English, which is the contract", () => {
    // `favourites` on either path is a 404. The British spelling stops at our
    // own identifiers.
    for (const endpoint of Object.values(FAVOURITES_ENDPOINTS)) {
      expect(endpoint.path()).not.toContain("favourite")
    }
  })

  it("attaches a response schema to both", () => {
    expect(FAVOURITES_ENDPOINTS.list.response.safeParse({}).success).toBe(false)
    expect(FAVOURITES_ENDPOINTS.toggle.response.safeParse({}).success).toBe(
      false
    )
    expect(
      FAVOURITES_ENDPOINTS.toggle.response.safeParse({
        data: { isFavorite: true },
        success: true
      }).success
    ).toBe(true)
    expect(
      FAVOURITES_ENDPOINTS.list.response.safeParse({
        data: { items: [], limit: 100, page: 0, total: 0 },
        success: true
      }).success
    ).toBe(true)
  })
})
