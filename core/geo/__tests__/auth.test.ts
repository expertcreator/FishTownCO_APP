import { describe, expect, test } from "bun:test"
import { authorizationGeoAuth, geoAuthHeaders, publicGeoAuth } from "../auth"

describe("authorizationGeoAuth", () => {
  test("builds the authorization token option", () => {
    expect(authorizationGeoAuth("session-token")).toEqual({
      type: "authorization",
      token: "session-token"
    })
  })
})

describe("publicGeoAuth", () => {
  test("builds the public API key option", () => {
    expect(publicGeoAuth("pk_live")).toEqual({
      type: "publicApiKey",
      key: "pk_live"
    })
  })
})

describe("geoAuthHeaders", () => {
  test("sends Authorization Bearer for the token option", () => {
    expect(geoAuthHeaders(authorizationGeoAuth("abc"))).toEqual({
      Authorization: "Bearer abc"
    })
  })

  test("keeps an existing Bearer prefix on the token", () => {
    expect(geoAuthHeaders(authorizationGeoAuth("Bearer already"))).toEqual({
      Authorization: "Bearer already"
    })
    expect(geoAuthHeaders(authorizationGeoAuth("bearer already"))).toEqual({
      Authorization: "bearer already"
    })
  })

  test("sends x-public-api-key for the public key option", () => {
    expect(geoAuthHeaders(publicGeoAuth("pk_live"))).toEqual({
      "x-public-api-key": "pk_live"
    })
  })

  test("throws when the token or key is empty after trim", () => {
    expect(() => geoAuthHeaders(authorizationGeoAuth("   "))).toThrow(
      "Geo authorization token is required"
    )
    expect(() => geoAuthHeaders(publicGeoAuth(""))).toThrow(
      "Geo public API key is required"
    )
  })
})
