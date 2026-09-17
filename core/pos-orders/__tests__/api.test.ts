import { describe, expect, test } from "bun:test"
import { getPosOrder, listAdminOrders } from "../api"
import { POS_ORDERS_API } from "../constants"
import type { PosOrdersHttp, PosOrdersSearchParams } from "../http"

function mockHttp(
  getImpl: (
    path: string,
    searchParams?: PosOrdersSearchParams
  ) => Promise<unknown>
): PosOrdersHttp {
  return {
    get: async <TResponse>(
      path: string,
      searchParams?: PosOrdersSearchParams
    ) => (await getImpl(path, searchParams)) as TResponse,
    post: () => Promise.reject(new Error("post unused")),
    put: () => Promise.reject(new Error("put unused")),
    patch: () => Promise.reject(new Error("patch unused"))
  }
}

describe("listAdminOrders", () => {
  test("GETs orders/admin with the serialized list filters", async () => {
    const calls: Array<{
      path: string
      searchParams?: string | Record<string, string>
    }> = []
    const http = mockHttp((path, searchParams) => {
      calls.push({ path, searchParams })
      return Promise.resolve({ data: [{ id: "o1" }], total: 1 })
    })

    const page = await listAdminOrders<{
      data: { id: string }[]
      total: number
    }>(http, "page=0&limit=20&search=12")

    expect(calls).toEqual([
      { path: POS_ORDERS_API.admin, searchParams: "page=0&limit=20&search=12" }
    ])
    expect(page.total).toBe(1)
    expect(page.data[0]?.id).toBe("o1")
  })

  test("omits search params when the caller passes none", async () => {
    const calls: Array<string | undefined> = []
    const http = mockHttp((_path, searchParams) => {
      calls.push(typeof searchParams)
      return Promise.resolve({ data: [], total: 0 })
    })

    await listAdminOrders(http)

    expect(calls).toEqual(["undefined"])
  })
})

describe("getPosOrder", () => {
  test("GETs orders/:id", async () => {
    const paths: string[] = []
    const http = mockHttp((path) => {
      paths.push(path)
      return Promise.resolve({ id: "abc" })
    })

    const order = await getPosOrder<{ id: string }>(http, "abc")

    expect(paths).toEqual([POS_ORDERS_API.byId("abc")])
    expect(order.id).toBe("abc")
  })
})
