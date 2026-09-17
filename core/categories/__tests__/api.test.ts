import { describe, expect, test } from "bun:test"
import {
  buildCategoryRequestsSearchParams,
  buildTenantCategoriesSearchParams,
  createCategoryFromRequest,
  createCategoryRequest,
  createGlobalCategory,
  createLocalCategory,
  getCategoryDeletionPreview,
  listCategoryRequests,
  listTenantCategories,
  nextTenantCategoriesPage
} from "../api"
import {
  CATEGORIES_API,
  CATEGORY_REQUESTS_PAGE_SIZE,
  TENANT_CATEGORIES_PAGE_SIZE
} from "../constants"
import type { CategoriesHttp } from "../http"
import type { CategoryWriteBody } from "../types"

function mockHttp(impl: {
  get?: (
    path: string,
    searchParams?: Record<string, string>
  ) => Promise<unknown>
  post?: (path: string, json: object) => Promise<unknown>
}): CategoriesHttp {
  return {
    get: async <TResponse>(
      path: string,
      searchParams?: Record<string, string>
    ) => {
      if (!impl.get) throw new Error("get unused")
      return (await impl.get(path, searchParams)) as TResponse
    },
    post: async <TResponse, TBody extends object>(
      path: string,
      json: TBody
    ) => {
      if (!impl.post) throw new Error("post unused")
      return (await impl.post(path, json)) as TResponse
    }
  }
}

const writeBody: CategoryWriteBody = {
  name: { en: "Sushi" },
  description: { en: "Japanese" },
  image: "https://cdn.example.test/sushi.png"
}

describe("buildTenantCategoriesSearchParams", () => {
  test("defaults page and limit and omits blank filters", () => {
    expect(buildTenantCategoriesSearchParams()).toEqual({
      page: "0",
      limit: String(TENANT_CATEGORIES_PAGE_SIZE)
    })
    expect(
      buildTenantCategoriesSearchParams({
        page: 2,
        limit: 10,
        branchId: "  b1  ",
        search: " taco ",
        sort: "name",
        filters: "scope:global"
      })
    ).toEqual({
      page: "2",
      limit: "10",
      branchId: "b1",
      search: "taco",
      sort: "name",
      filters: "scope:global"
    })
  })
})

describe("buildCategoryRequestsSearchParams", () => {
  test("defaults page and limit and omits blank search", () => {
    expect(buildCategoryRequestsSearchParams()).toEqual({
      page: "0",
      limit: String(CATEGORY_REQUESTS_PAGE_SIZE)
    })
    expect(
      buildCategoryRequestsSearchParams({
        page: 1,
        limit: 10,
        search: " sushi "
      })
    ).toEqual({
      page: "1",
      limit: "10",
      search: "sushi"
    })
  })
})

describe("nextTenantCategoriesPage", () => {
  test("returns the next zero-based page until the list is loaded", () => {
    expect(nextTenantCategoriesPage(20, 45)).toBe(1)
    expect(nextTenantCategoriesPage(45, 45)).toBeUndefined()
  })
})

describe("listTenantCategories", () => {
  test("GETs categories/tenant with serialized params", async () => {
    const calls: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const http = mockHttp({
      get: (path, searchParams) => {
        calls.push({ path, searchParams })
        return Promise.resolve({ data: [{ id: "c1" }], total: 1 })
      }
    })

    const page = await listTenantCategories(http, {
      branchId: "b1",
      page: 0,
      limit: 20
    })

    expect(calls).toEqual([
      {
        path: CATEGORIES_API.tenant,
        searchParams: { page: "0", limit: "20", branchId: "b1" }
      }
    ])
    expect(page.total).toBe(1)
    expect(page.data[0]?.id).toBe("c1")
  })
})

describe("createLocalCategory", () => {
  test("POSTs categories/local", async () => {
    const calls: Array<{ path: string; json: object }> = []
    const http = mockHttp({
      post: (path, json) => {
        calls.push({ path, json })
        return Promise.resolve({ id: "c1", ...writeBody })
      }
    })

    const created = await createLocalCategory(http, writeBody)

    expect(calls).toEqual([{ path: CATEGORIES_API.local, json: writeBody }])
    expect(created.id).toBe("c1")
  })
})

describe("createGlobalCategory", () => {
  test("POSTs categories", async () => {
    const calls: Array<{ path: string; json: object }> = []
    const http = mockHttp({
      post: (path, json) => {
        calls.push({ path, json })
        return Promise.resolve({ id: "c1", ...writeBody })
      }
    })

    await createGlobalCategory(http, writeBody)

    expect(calls).toEqual([{ path: CATEGORIES_API.list, json: writeBody }])
  })
})

describe("createCategoryRequest", () => {
  test("POSTs requests with type category", async () => {
    const body = {
      title: { en: "Sushi" },
      image: writeBody.image,
      type: "category" as const
    }
    const calls: Array<{ path: string; json: object }> = []
    const http = mockHttp({
      post: (path, json) => {
        calls.push({ path, json })
        return Promise.resolve({ id: "r1", ...body })
      }
    })

    const created = await createCategoryRequest(http, body)

    expect(calls).toEqual([{ path: CATEGORIES_API.requests, json: body }])
    expect(created.id).toBe("r1")
  })
})

describe("listCategoryRequests", () => {
  test("GETs category-requests with serialized params", async () => {
    const calls: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const http = mockHttp({
      get: (path, searchParams) => {
        calls.push({ path, searchParams })
        return Promise.resolve({ data: [], total: 0 })
      }
    })

    await listCategoryRequests(http, { page: 0, limit: 20, search: "sushi" })

    expect(calls).toEqual([
      {
        path: CATEGORIES_API.categoryRequests,
        searchParams: { page: "0", limit: "20", search: "sushi" }
      }
    ])
  })
})

describe("createCategoryFromRequest", () => {
  test("POSTs category-requests/:id/create with the form body", async () => {
    const calls: Array<{ path: string; json: object }> = []
    const http = mockHttp({
      post: (path, json) => {
        calls.push({ path, json })
        return Promise.resolve({ id: "c1", ...writeBody })
      }
    })

    await createCategoryFromRequest(http, "req-1", writeBody)

    expect(calls).toEqual([
      {
        path: CATEGORIES_API.createFromRequest("req-1"),
        json: writeBody
      }
    ])
  })
})

describe("getCategoryDeletionPreview", () => {
  test("GETs categories/:id/deletion-preview", async () => {
    const calls: Array<{
      path: string
      searchParams?: Record<string, string>
    }> = []
    const preview = {
      success: true,
      data: {
        canDelete: true,
        reasonCode: null,
        productCount: 4,
        subcategoryCount: 1,
        fallbackCategoryName: { en: "Other" }
      }
    }
    const http = mockHttp({
      get: (path, searchParams) => {
        calls.push({ path, searchParams })
        return Promise.resolve(preview)
      }
    })

    const response = await getCategoryDeletionPreview(http, "cat-1")

    expect(calls).toEqual([
      { path: CATEGORIES_API.deletionPreview("cat-1"), searchParams: undefined }
    ])
    expect(response.data.productCount).toBe(4)
  })

  test("throws when categoryId is blank", () => {
    const http = mockHttp({})
    expect(() => getCategoryDeletionPreview(http, "  ")).toThrow(
      "Category ID is required"
    )
  })
})
