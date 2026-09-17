import { describe, expect, test } from "bun:test"
import { createPosOrdersHttp } from "../http"

describe("createPosOrdersHttp", () => {
  test("forwards GET search params as a query string or object", async () => {
    const gets: Array<{
      path: string
      searchParams?: string | Record<string, string>
    }> = []
    const client = {
      get: (
        path: string,
        options?: { searchParams?: string | Record<string, string> }
      ) => {
        gets.push({ path, searchParams: options?.searchParams })
        return {
          json: async <TResponse>() => ({ ok: true }) as TResponse
        }
      },
      post: () => {
        throw new Error("unused")
      },
      put: () => {
        throw new Error("unused")
      },
      patch: () => {
        throw new Error("unused")
      }
    }
    const http = createPosOrdersHttp(client)

    await http.get("orders/admin", "page=0&limit=20")
    await http.get("orders/admin", { page: "1" })

    expect(gets).toEqual([
      { path: "orders/admin", searchParams: "page=0&limit=20" },
      { path: "orders/admin", searchParams: { page: "1" } }
    ])
  })
})
