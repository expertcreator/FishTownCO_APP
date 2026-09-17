import { describe, expect, test } from "bun:test"
import { createCategoriesHttp } from "../http"

describe("createCategoriesHttp", () => {
  test("forwards GET search params to the app client", async () => {
    const gets: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const http = createCategoriesHttp({
      get: (path, options) => {
        gets.push({ path, searchParams: options?.searchParams })
        return {
          json: async <TResponse>() => ({ ok: true }) as TResponse
        }
      },
      post: () => {
        throw new Error("post unused")
      }
    })

    await http.get("categories/tenant", { branchId: "b1", page: "0" })

    expect(gets).toEqual([
      {
        path: "categories/tenant",
        searchParams: { branchId: "b1", page: "0" }
      }
    ])
  })

  test("forwards POST json to the app client", async () => {
    const posts: Array<{ path: string; json: object }> = []
    const http = createCategoriesHttp({
      get: () => {
        throw new Error("get unused")
      },
      post: (path, options) => {
        posts.push({ path, json: options.json })
        return {
          json: async <TResponse>() => ({ id: "c1" }) as TResponse
        }
      }
    })

    await http.post("categories", { name: { en: "Sushi" } })

    expect(posts).toEqual([
      { path: "categories", json: { name: { en: "Sushi" } } }
    ])
  })
})
