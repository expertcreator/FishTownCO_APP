import { describe, expect, test } from "bun:test"
import { authorizationGeoAuth, publicGeoAuth } from "../auth"
import { createGeoHttp, GeoRequestError } from "../http"

describe("createGeoHttp", () => {
  test("forwards Authorization headers for the token option", async () => {
    const gets: Array<{
      path: string
      searchParams?: Record<string, string>
      headers?: Record<string, string>
    }> = []
    const http = createGeoHttp(
      {
        get: (path, options) => {
          gets.push({
            path,
            searchParams: options?.searchParams,
            headers: options?.headers
          })
          return {
            json: async <TResponse>() => ({ ok: true }) as TResponse
          }
        }
      },
      { auth: authorizationGeoAuth("session-token") }
    )

    await http.get("geo-cities", { page: "0" })

    expect(gets).toEqual([
      {
        path: "geo-cities",
        searchParams: { page: "0" },
        headers: { Authorization: "Bearer session-token" }
      }
    ])
  })

  test("forwards x-public-api-key for the public key option", async () => {
    const gets: Array<{
      path: string
      headers?: Record<string, string>
    }> = []
    const http = createGeoHttp(
      {
        get: (path, options) => {
          gets.push({ path, headers: options?.headers })
          return {
            json: async <TResponse>() => ({ ok: true }) as TResponse
          }
        }
      },
      { auth: publicGeoAuth("pk_live") }
    )

    await http.get("geo-areas")

    expect(gets).toEqual([
      {
        path: "geo-areas",
        headers: { "x-public-api-key": "pk_live" }
      }
    ])
  })

  test("throws when auth is empty", () => {
    expect(() =>
      createGeoHttp(
        {
          get: () => {
            throw new Error("unused")
          }
        },
        { auth: authorizationGeoAuth(" ") }
      )
    ).toThrow("Geo authorization token is required")
  })
})

describe("GeoRequestError", () => {
  test("stores the upstream status", () => {
    const error = new GeoRequestError(502, "Bad Gateway")
    expect(error.status).toBe(502)
    expect(error.message).toBe("Bad Gateway")
    expect(error.name).toBe("GeoRequestError")
  })
})
