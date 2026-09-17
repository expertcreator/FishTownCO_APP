import { describe, expect, test } from "bun:test"
import {
  bookRiderShift,
  checkInRiderShift,
  getRiderNextShift,
  listAvailableRiderShifts
} from "../api"
import { RIDER_SHIFTS_API } from "../constants"
import type { RiderShiftsHttp } from "../http"

function mockHttp(impl: {
  get?: (
    path: string,
    searchParams?: Record<string, string>
  ) => Promise<unknown>
  post?: (path: string, json: object) => Promise<unknown>
  delete?: (path: string, json?: object) => Promise<unknown>
}): RiderShiftsHttp {
  return {
    get: async <TResponse>(
      path: string,
      searchParams?: Record<string, string>
    ) => {
      if (!impl.get) {
        throw new Error("get unused")
      }
      return (await impl.get(path, searchParams)) as TResponse
    },
    post: async <TResponse, TBody extends object>(
      path: string,
      json: TBody
    ) => {
      if (!impl.post) {
        throw new Error("post unused")
      }
      return (await impl.post(path, json)) as TResponse
    },
    delete: async <TResponse>(path: string, json?: object) => {
      if (!impl.delete) {
        throw new Error("delete unused")
      }
      return (await impl.delete(path, json)) as TResponse
    }
  }
}

describe("getRiderNextShift", () => {
  test("GETs next-shift with lang", async () => {
    const calls: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const http = mockHttp({
      get: (path, searchParams) => {
        calls.push({ path, searchParams })
        return Promise.resolve({ success: true, data: [] })
      }
    })

    await getRiderNextShift(http, { lang: "en" })

    expect(calls).toEqual([
      { path: RIDER_SHIFTS_API.nextShift, searchParams: { lang: "en" } }
    ])
  })
})

describe("listAvailableRiderShifts", () => {
  test("GETs available-shifts with string params", async () => {
    const calls: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const http = mockHttp({
      get: (path, searchParams) => {
        calls.push({ path, searchParams })
        return Promise.resolve({
          success: true,
          data: { items: [], total: 0, page: 0, limit: 20, totalPages: 0 }
        })
      }
    })

    await listAvailableRiderShifts(http, {
      date: "2026-09-09",
      latitude: 32.16,
      longitude: 74.18,
      radiusKm: 30
    })

    expect(calls[0]?.path).toBe(RIDER_SHIFTS_API.availableShifts)
    expect(calls[0]?.searchParams).toMatchObject({
      date: "2026-09-09",
      latitude: "32.16",
      radiusKm: "30",
      page: "0"
    })
  })
})

describe("bookRiderShift", () => {
  test("POSTs the book body and unwraps data", async () => {
    const posts: Array<{ path: string; json: object }> = []
    const http = mockHttp({
      post: (path, json) => {
        posts.push({ path, json })
        return Promise.resolve({
          success: true,
          data: { bookingId: "b1", status: "BOOKED" }
        })
      }
    })

    const result = await bookRiderShift(http, { shiftSlotId: "s1" })

    expect(posts).toEqual([
      { path: RIDER_SHIFTS_API.bookShift, json: { shiftSlotId: "s1" } }
    ])
    expect(result).toEqual({
      success: true,
      bookingId: "b1",
      status: "BOOKED"
    })
  })
})

describe("checkInRiderShift", () => {
  test("POSTs check-in GPS", async () => {
    const posts: Array<{ path: string; json: object }> = []
    const http = mockHttp({
      post: (path, json) => {
        posts.push({ path, json })
        return Promise.resolve({ success: true })
      }
    })

    await checkInRiderShift(http, {
      bookingId: "b1",
      latitude: 32.16,
      longitude: 74.18
    })

    expect(posts).toEqual([
      {
        path: RIDER_SHIFTS_API.checkin,
        json: { bookingId: "b1", latitude: 32.16, longitude: 74.18 }
      }
    ])
  })
})
