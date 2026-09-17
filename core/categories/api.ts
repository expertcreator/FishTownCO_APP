import {
  CATEGORIES_API,
  CATEGORY_REQUESTS_PAGE_SIZE,
  TENANT_CATEGORIES_PAGE_SIZE
} from "./constants"
import type { CategoriesHttp, CategoriesSearchParams } from "./http"
import type {
  CategoryDeletionPreviewResponse,
  CategoryRequest,
  CategoryRequestCreateBody,
  CategoryRequestsListParams,
  CategoryRequestsListResponse,
  CategoryWriteBody,
  TenantCategoriesListParams,
  TenantCategoriesResponse,
  TenantCategory
} from "./types"

/**
 * Builds query-string fields for GET /categories/tenant.
 * @param args - Branch, search, sort, filters, and page/limit
 * @returns String search params
 */
export function buildTenantCategoriesSearchParams(
  args: TenantCategoriesListParams = {}
): CategoriesSearchParams {
  const branchId = args.branchId?.trim() ?? ""
  const search = args.search?.trim() ?? ""
  const sort = args.sort?.trim() ?? ""
  const filters = args.filters?.trim() ?? ""
  const page = args.page ?? 0
  const limit = args.limit ?? TENANT_CATEGORIES_PAGE_SIZE

  return {
    page: String(page),
    limit: String(limit),
    ...(branchId ? { branchId } : {}),
    ...(search ? { search } : {}),
    ...(sort ? { sort } : {}),
    ...(filters ? { filters } : {})
  }
}

/**
 * Builds query-string fields for GET /category-requests.
 * @param args - Page, limit, and optional search
 * @returns String search params
 */
export function buildCategoryRequestsSearchParams(
  args: CategoryRequestsListParams = {}
): CategoriesSearchParams {
  const search = args.search?.trim() ?? ""
  const page = args.page ?? 0
  const limit = args.limit ?? CATEGORY_REQUESTS_PAGE_SIZE

  return {
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {})
  }
}

/**
 * Next page index for an infinite tenant-category list, or undefined when done.
 * @param loadedCount - Categories already loaded
 * @param total - Total matching categories
 * @param limit - Page size used for the request
 * @returns Zero-based next page, or undefined
 * @example
 * nextTenantCategoriesPage(20, 45, 20)
 * // 1
 */
export function nextTenantCategoriesPage(
  loadedCount: number,
  total: number,
  limit = TENANT_CATEGORIES_PAGE_SIZE
): number | undefined {
  return loadedCount < total ? Math.floor(loadedCount / limit) : undefined
}

/**
 * Lists categories that have this tenant’s active products.
 * @param http - Injected HTTP client
 * @param args - Branch, search, sort, filters, and page/limit
 * @returns GET /categories/tenant 200 body
 */
export function listTenantCategories(
  http: CategoriesHttp,
  args: TenantCategoriesListParams = {}
): Promise<TenantCategoriesResponse> {
  return http.get<TenantCategoriesResponse>(
    CATEGORIES_API.tenant,
    buildTenantCategoriesSearchParams(args)
  )
}

/**
 * Creates a tenant-local category.
 * @param http - Injected HTTP client
 * @param body - Name, description, image, and optional parent
 * @returns POST /categories/local 201 body
 */
export function createLocalCategory(
  http: CategoriesHttp,
  body: CategoryWriteBody
): Promise<TenantCategory> {
  return http.post<TenantCategory, CategoryWriteBody>(
    CATEGORIES_API.local,
    body
  )
}

/**
 * Creates a global category (super-admin).
 * @param http - Injected HTTP client
 * @param body - Name, description, image, and optional parent
 * @returns POST /categories 201 body
 */
export function createGlobalCategory(
  http: CategoriesHttp,
  body: CategoryWriteBody
): Promise<TenantCategory> {
  return http.post<TenantCategory, CategoryWriteBody>(CATEGORIES_API.list, body)
}

/**
 * Submits a tenant category request.
 * @param http - Injected HTTP client
 * @param body - Localized title/description plus required image
 * @returns POST /requests 201 body
 */
export function createCategoryRequest(
  http: CategoriesHttp,
  body: CategoryRequestCreateBody
): Promise<CategoryRequest> {
  return http.post<CategoryRequest, CategoryRequestCreateBody>(
    CATEGORIES_API.requests,
    body
  )
}

/**
 * Lists undeleted tenant category requests (super-admin).
 * @param http - Injected HTTP client
 * @param args - Page, limit, and optional search
 * @returns GET /category-requests 200 body
 */
export function listCategoryRequests(
  http: CategoriesHttp,
  args: CategoryRequestsListParams = {}
): Promise<CategoryRequestsListResponse> {
  return http.get<CategoryRequestsListResponse>(
    CATEGORIES_API.categoryRequests,
    buildCategoryRequestsSearchParams(args)
  )
}

/**
 * Creates a global category from a tenant request, then removes that request.
 * @param http - Injected HTTP client
 * @param requestId - `requests.id` to convert
 * @param body - Category fields from the shared form
 * @returns POST /category-requests/:id/create 201 body
 */
export function createCategoryFromRequest(
  http: CategoriesHttp,
  requestId: string,
  body: CategoryWriteBody
): Promise<TenantCategory> {
  return http.post<TenantCategory, CategoryWriteBody>(
    CATEGORIES_API.createFromRequest(requestId),
    body
  )
}

/**
 * Previews how many products and subcategories a category delete will affect.
 * @param http - Injected HTTP client
 * @param categoryId - `categories.id` to inspect
 * @returns GET /categories/:id/deletion-preview 200 body
 * @throws {Error} If `categoryId` is empty
 */
export function getCategoryDeletionPreview(
  http: CategoriesHttp,
  categoryId: string
): Promise<CategoryDeletionPreviewResponse> {
  if (!categoryId.trim()) {
    throw new Error("Category ID is required")
  }
  return http.get<CategoryDeletionPreviewResponse>(
    CATEGORIES_API.deletionPreview(categoryId)
  )
}
