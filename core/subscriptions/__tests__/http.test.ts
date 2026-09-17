import { describe, expect, test } from "bun:test"
import { createSubscriptionsHttp } from "../http"

describe("createSubscriptionsHttp", () => {
  test("forwards GET search params and JSON verbs", async () => {
    const gets: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const posts: Array<{ path: string; json: object }> = []
    const puts: Array<{ path: string; json: object }> = []
    const patches: Array<{ path: string; json: object }> = []
    const deletes: string[] = []

    const http = createSubscriptionsHttp({
      get: (path, options) => {
        gets.push({ path, searchParams: options?.searchParams })
        return {
          json: async <TResponse>() => ({ ok: true }) as TResponse
        }
      },
      post: (path, options) => {
        posts.push({ path, json: options.json })
        return {
          json: async <TResponse>() => ({ created: true }) as TResponse
        }
      },
      put: (path, options) => {
        puts.push({ path, json: options.json })
        return {
          json: async <TResponse>() => ({ reviewed: true }) as TResponse
        }
      },
      patch: (path, options) => {
        patches.push({ path, json: options.json })
        return {
          json: async <TResponse>() => ({ updated: true }) as TResponse
        }
      },
      delete: (path) => {
        deletes.push(path)
        return {
          json: async <TResponse>() => ({ success: true }) as TResponse
        }
      }
    })

    await http.get("subscriptions", { page: "0" })
    await http.post("subscriptions", { tenantId: "t1" })
    await http.put("subscription-payment-claims/c1/review", {
      action: "approve"
    })
    await http.patch("subscriptions/s1", { isActive: false })
    const deleted = await http.delete<{ success: boolean }>("subscriptions/s1")

    expect(gets).toEqual([
      { path: "subscriptions", searchParams: { page: "0" } }
    ])
    expect(posts).toEqual([{ path: "subscriptions", json: { tenantId: "t1" } }])
    expect(puts).toEqual([
      {
        path: "subscription-payment-claims/c1/review",
        json: { action: "approve" }
      }
    ])
    expect(patches).toEqual([
      { path: "subscriptions/s1", json: { isActive: false } }
    ])
    expect(deletes).toEqual(["subscriptions/s1"])
    expect(deleted).toEqual({ success: true })
  })
})
