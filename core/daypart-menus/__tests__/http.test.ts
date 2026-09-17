import { describe, expect, test } from "bun:test"
import { createDaypartMenusHttp } from "../http"

describe("createDaypartMenusHttp", () => {
  test("forwards GET and PUT to the ky-shaped client", async () => {
    const gets: string[] = []
    const puts: Array<{ path: string; json: object }> = []
    const http = createDaypartMenusHttp({
      get: (path) => {
        gets.push(path)
        return { json: async <TResponse>() => ({ ok: true }) as TResponse }
      },
      put: (path, options) => {
        puts.push({ path, json: options.json })
        return { json: async <TResponse>() => ({ ok: true }) as TResponse }
      }
    })

    await http.get("daypart-menus/branch/abc")
    await http.put("daypart-menus/branch/abc", { menus: [] })

    expect(gets).toEqual(["daypart-menus/branch/abc"])
    expect(puts).toEqual([
      { path: "daypart-menus/branch/abc", json: { menus: [] } }
    ])
  })
})
