import { describe, expect, test } from "vitest"
import { createLocationHttp } from "../http"

describe("createLocationHttp", () => {
  test("GETs Photon with search params and no User-Agent", async () => {
    const calls: Array<{
      url: string
      headers?: Record<string, string>
    }> = []
    const http = createLocationHttp({
      fetch: async (url, init) => {
        calls.push({ url, headers: init?.headers })
        return {
          ok: true,
          status: 200,
          json: async () => ({ features: [] })
        }
      }
    })

    const body = await http.get<{ features: unknown[] }>("reverse", {
      searchParams: { lat: "31.52", lon: "74.35", lang: "en" }
    })

    expect(body).toEqual({ features: [] })
    expect(calls).toHaveLength(1)
    const first = calls[0]
    if (!first) {
      throw new Error("expected a fetch call")
    }
    expect(first.url).toBe(
      "https://photon.komoot.io/reverse?lat=31.52&lon=74.35&lang=en"
    )
    // The User-Agent was a Nominatim policy artefact and is a forbidden header
    // in a browser anyway. Its absence is the assertion.
    expect(first.headers?.["User-Agent"]).toBeUndefined()
  })

  test("resolves the search path against the origin, not the current path", async () => {
    const calls: string[] = []
    const http = createLocationHttp({
      fetch: async (url) => {
        calls.push(url)
        return { ok: true, status: 200, json: async () => ({}) }
      }
    })

    await http.get("api", { searchParams: { q: "Model Town" } })

    expect(calls[0]).toBe("https://photon.komoot.io/api?q=Model+Town")
  })

  test("throws when Photon is not OK", async () => {
    const http = createLocationHttp({
      fetch: async () => ({
        ok: false,
        status: 429,
        json: async () => ({})
      })
    })
    await expect(http.get("reverse")).rejects.toThrow(
      "Photon request failed (429)"
    )
  })
})
