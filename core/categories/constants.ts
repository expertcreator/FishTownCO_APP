/**
 * Category API paths (no leading slash).
 * @example
 * CATEGORIES_API.tenant
 * // "categories/tenant"
 */
export const CATEGORIES_API = {
  tenant: "categories/tenant",
  list: "categories",
  local: "categories/local",
  requests: "requests",
  categoryRequests: "category-requests",
  /**
   * Builds POST path that creates a global category from one request.
   * @param requestId - `requests.id`
   * @returns Encoded `category-requests/:id/create` path
   * @example
   * CATEGORIES_API.createFromRequest("abc")
   * // "category-requests/abc/create"
   */
  createFromRequest: (requestId: string) =>
    `category-requests/${encodeURIComponent(requestId)}/create`,
  /**
   * Builds GET path that previews category-delete impact.
   * @param categoryId - `categories.id`
   * @returns Encoded `categories/:id/deletion-preview` path
   * @example
   * CATEGORIES_API.deletionPreview("abc")
   * // "categories/abc/deletion-preview"
   */
  deletionPreview: (categoryId: string) =>
    `categories/${encodeURIComponent(categoryId)}/deletion-preview`
} as const

/**
 * Default page size for GET /categories/tenant.
 */
export const TENANT_CATEGORIES_PAGE_SIZE = 20

/**
 * Default page size for GET /category-requests.
 */
export const CATEGORY_REQUESTS_PAGE_SIZE = 20
