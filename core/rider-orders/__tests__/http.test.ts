import { describe, expect, test } from "bun:test"
import { createRiderOrdersHttp } from "../http"

describe("createRiderOrdersHttp", () => {
  test("forwards GET search params to the app client", async () => {
    const gets: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const http = createRiderOrdersHttp({
      get: (path, options) => {
        gets.push({ path, searchParams: options?.searchParams })
        return {
          json: async <TResponse>() => ({ ok: true }) as TResponse
        }
      },
      post: () => {
        throw new Error("post unused")
      },
      patch: () => {
        throw new Error("patch unused")
      }
    })

    await http.get("riders/orders", { page: "0", status: "all" })

    expect(gets).toEqual([
      {
        path: "riders/orders",
        searchParams: { page: "0", status: "all" }
      }
    ])
  })

  test("forwards POST and PATCH json to the app client", async () => {
    const posts: Array<{ path: string; json: object }> = []
    const patches: Array<{ path: string; json: object }> = []
    const http = createRiderOrdersHttp({
      get: () => {
        throw new Error("get unused")
      },
      post: (path, options) => {
        posts.push({ path, json: options.json })
        return {
          json: async <TResponse>() => ({ id: "o1" }) as TResponse
        }
      },
      patch: (path, options) => {
        patches.push({ path, json: options.json })
        return {
          json: async <TResponse>() => ({ order: { id: "o1" } }) as TResponse
        }
      }
    })

    await http.post("riders/orders/o1/action", { action: "accept" })
    await http.patch("orders/o1/estimated-delivery-time", { minutes: 15 })

    expect(posts).toEqual([
      { path: "riders/orders/o1/action", json: { action: "accept" } }
    ])
    expect(patches).toEqual([
      { path: "orders/o1/estimated-delivery-time", json: { minutes: 15 } }
    ])
  })
})
