import { describe, expect, test } from "bun:test"
import { getDaypartMenusByBranch, updateDaypartMenus } from "../api"
import { DAYPART_MENUS_API } from "../constants"
import type { DaypartMenusHttp } from "../http"
import type { DaypartMenu } from "../types"

const menus: DaypartMenu[] = [
  { slug: "morning", startTime: "08:00", endTime: "10:00", usable: true },
  { slug: "noon", startTime: "10:00", endTime: "16:00", usable: true },
  { slug: "evening", startTime: "16:00", endTime: "19:00", usable: true },
  { slug: "dinner", startTime: "19:00", endTime: "00:00", usable: true }
]

function mockHttp(impl: {
  get?: (path: string) => Promise<unknown>
  put?: (path: string, json: object) => Promise<unknown>
}): DaypartMenusHttp {
  return {
    get: async <TResponse>(path: string) => {
      if (!impl.get) {
        throw new Error("get unused")
      }
      return (await impl.get(path)) as TResponse
    },
    put: async <TResponse, TBody extends object>(path: string, json: TBody) => {
      if (!impl.put) {
        throw new Error("put unused")
      }
      return (await impl.put(path, json)) as TResponse
    }
  }
}

describe("getDaypartMenusByBranch", () => {
  test("GETs the branch path and parses four menus", async () => {
    const paths: string[] = []
    const http = mockHttp({
      get: (path) => {
        paths.push(path)
        return Promise.resolve({ data: menus })
      }
    })

    const result = await getDaypartMenusByBranch(http, "abc")

    expect(paths).toEqual([DAYPART_MENUS_API.byBranch("abc")])
    expect(result.data).toHaveLength(4)
    expect(result.data[0]?.slug).toBe("morning")
  })
})

describe("updateDaypartMenus", () => {
  test("PUTs the four locked times and rejects a name field", async () => {
    const calls: Array<{ path: string; json: object }> = []
    const http = mockHttp({
      put: (path, json) => {
        calls.push({ path, json })
        return Promise.resolve({ data: menus })
      }
    })
    const payload = {
      menus: menus.map(({ slug, startTime, endTime }) => ({
        slug,
        startTime,
        endTime
      }))
    }

    const result = await updateDaypartMenus(http, "abc", payload)

    expect(calls).toEqual([
      { path: DAYPART_MENUS_API.byBranch("abc"), json: payload }
    ])
    expect(result.data).toHaveLength(4)
    await expect(
      updateDaypartMenus(http, "abc", {
        menus: [
          {
            slug: "morning",
            startTime: "08:00",
            endTime: "10:00",
            name: "Breakfast"
          }
        ]
      } as never)
    ).rejects.toThrow()
  })
})
