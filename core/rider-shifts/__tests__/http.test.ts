import { describe, expect, test } from "bun:test"
import { createRiderShiftsHttp } from "../http"

describe("createRiderShiftsHttp", () => {
  test("forwards GET search params to the app client", async () => {
    const gets: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const http = createRiderShiftsHttp({
      get: (path, options) => {
        gets.push({ path, searchParams: options?.searchParams })
        return {
          json: async <TResponse>() =>
            ({ success: true, data: [] }) as TResponse
        }
      },
      post: () => {
        throw new Error("post unused")
      },
      delete: () => {
        throw new Error("delete unused")
      }
    })

    await http.get("rider/next-shift", { lang: "en" })

    expect(gets).toEqual([
      { path: "rider/next-shift", searchParams: { lang: "en" } }
    ])
  })

  test("forwards POST json to the app client", async () => {
    const posts: Array<{ path: string; json: object }> = []
    const http = createRiderShiftsHttp({
      get: () => {
        throw new Error("get unused")
      },
      post: (path, options) => {
        posts.push({ path, json: options.json })
        return {
          json: async <TResponse>() =>
            ({ success: true, bookingId: "b1" }) as TResponse
        }
      },
      delete: () => {
        throw new Error("delete unused")
      }
    })

    await http.post("rider/book-shift", { shiftSlotId: "s1" })

    expect(posts).toEqual([
      { path: "rider/book-shift", json: { shiftSlotId: "s1" } }
    ])
  })

  test("forwards DELETE json to the app client", async () => {
    const deletes: Array<{ path: string; json?: object }> = []
    const http = createRiderShiftsHttp({
      get: () => {
        throw new Error("get unused")
      },
      post: () => {
        throw new Error("post unused")
      },
      delete: (path, options) => {
        deletes.push({ path, json: options?.json })
        return {
          json: async <TResponse>() => ({ success: true }) as TResponse
        }
      }
    })

    await http.delete("rider/book-shift/b1", { cancellationReason: "other" })

    expect(deletes).toEqual([
      {
        path: "rider/book-shift/b1",
        json: { cancellationReason: "other" }
      }
    ])
  })
})
