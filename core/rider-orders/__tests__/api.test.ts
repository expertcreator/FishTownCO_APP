import { describe, expect, test } from "bun:test"
import {
  failRiderOrderDelivery,
  getRiderActiveOrder,
  getRiderOrderDetails,
  listRiderOrders,
  submitRiderOrderAction,
  updateRiderEstimatedDeliveryTime
} from "../api"
import { RIDER_ORDERS_API } from "../constants"
import type { RiderOrdersHttp } from "../http"

function mockHttp(impl: {
  get?: (
    path: string,
    searchParams?: Record<string, string>
  ) => Promise<unknown>
  post?: (path: string, json: object) => Promise<unknown>
  patch?: (path: string, json: object) => Promise<unknown>
}): RiderOrdersHttp {
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
    patch: async <TResponse, TBody extends object>(
      path: string,
      json: TBody
    ) => {
      if (!impl.patch) {
        throw new Error("patch unused")
      }
      return (await impl.patch(path, json)) as TResponse
    }
  }
}

describe("listRiderOrders", () => {
  test("GETs the list path with default search params", async () => {
    const calls: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const http = mockHttp({
      get: (path, searchParams) => {
        calls.push({ path, searchParams })
        return Promise.resolve({ items: [], total: 0, page: 0, limit: 20 })
      }
    })

    await listRiderOrders(http)

    expect(calls).toEqual([
      {
        path: RIDER_ORDERS_API.list,
        searchParams: { page: "0", limit: "20", status: "all" }
      }
    ])
  })
})

describe("getRiderOrderDetails", () => {
  test("GETs the encoded details path", async () => {
    const paths: string[] = []
    const http = mockHttp({
      get: (path) => {
        paths.push(path)
        return Promise.resolve({
          id: "o1",
          orderNumber: "1",
          customerName: "A"
        })
      }
    })

    await getRiderOrderDetails(http, "o1")
    expect(paths).toEqual([RIDER_ORDERS_API.details("o1")])
  })
})

describe("getRiderActiveOrder", () => {
  test("GETs the active path", async () => {
    const paths: string[] = []
    const http = mockHttp({
      get: (path) => {
        paths.push(path)
        return Promise.resolve(null)
      }
    })

    await getRiderActiveOrder(http)
    expect(paths).toEqual([RIDER_ORDERS_API.active])
  })
})

describe("submitRiderOrderAction", () => {
  test("POSTs the action body and unwraps a wrapped order", async () => {
    const calls: Array<{ path: string; json: object }> = []
    const http = mockHttp({
      post: (path, json) => {
        calls.push({ path, json })
        return Promise.resolve({ data: { id: "o1", orderNumber: "9" } })
      }
    })

    const result = await submitRiderOrderAction(http, {
      orderId: "o1",
      action: "pickup"
    })

    expect(calls).toEqual([
      { path: RIDER_ORDERS_API.action("o1"), json: { action: "pickup" } }
    ])
    expect(result).toEqual({ success: true, id: "o1", orderNumber: "9" })
  })
})

describe("failRiderOrderDelivery", () => {
  test("POSTs the fail body", async () => {
    const calls: Array<{ path: string; json: object }> = []
    const http = mockHttp({
      post: (path, json) => {
        calls.push({ path, json })
        return Promise.resolve({ success: true })
      }
    })

    await failRiderOrderDelivery(http, {
      orderId: "o1",
      failureReason: "VEHICLE_ISSUE",
      contactAttempted: true
    })

    expect(calls).toEqual([
      {
        path: RIDER_ORDERS_API.fail("o1"),
        json: { failureReason: "VEHICLE_ISSUE", contactAttempted: true }
      }
    ])
  })
})

describe("updateRiderEstimatedDeliveryTime", () => {
  test("PATCHes minutes and unwraps an order object", async () => {
    const calls: Array<{ path: string; json: object }> = []
    const http = mockHttp({
      patch: (path, json) => {
        calls.push({ path, json })
        return Promise.resolve({ order: { id: "o1" } })
      }
    })

    const result = await updateRiderEstimatedDeliveryTime(http, {
      orderId: "o1",
      minutes: 18
    })

    expect(calls).toEqual([
      {
        path: RIDER_ORDERS_API.estimatedDeliveryTime("o1"),
        json: { minutes: 18 }
      }
    ])
    expect(result.success).toBe(true)
  })
})
