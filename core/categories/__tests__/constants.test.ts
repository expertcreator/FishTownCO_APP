import { describe, expect, test } from "bun:test"
import {
  CATEGORIES_API,
  CATEGORY_REQUESTS_PAGE_SIZE,
  TENANT_CATEGORIES_PAGE_SIZE
} from "../constants"

describe("categories constants", () => {
  test("points at catalog, write, and request paths", () => {
    expect(CATEGORIES_API.tenant).toBe("categories/tenant")
    expect(CATEGORIES_API.list).toBe("categories")
    expect(CATEGORIES_API.local).toBe("categories/local")
    expect(CATEGORIES_API.requests).toBe("requests")
    expect(CATEGORIES_API.categoryRequests).toBe("category-requests")
    expect(CATEGORIES_API.createFromRequest("abc def")).toBe(
      "category-requests/abc%20def/create"
    )
    expect(CATEGORIES_API.deletionPreview("abc def")).toBe(
      "categories/abc%20def/deletion-preview"
    )
    expect(TENANT_CATEGORIES_PAGE_SIZE).toBe(20)
    expect(CATEGORY_REQUESTS_PAGE_SIZE).toBe(20)
  })
})
