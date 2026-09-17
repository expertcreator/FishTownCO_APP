/**
 * Minimum tree shape used to flatten and filter category catalogs.
 */
export interface CategoryTreeNode {
  id: string
  subcategories?: CategoryTreeNode[]
}

/**
 * Query fields for GET /categories/tenant.
 */
export interface TenantCategoriesListParams {
  page?: number
  limit?: number
  branchId?: string
  search?: string
  sort?: string
  filters?: string
}

/**
 * One category row from GET /categories/tenant.
 */
export interface TenantCategory extends CategoryTreeNode {
  tenantId: string | null
  parentId: string | null
  rootCategoryId?: string | null
  scope: "global" | "tenant-local"
  isGlobal: boolean
  name: Record<string, string>
  description: Record<string, string>
  isProtected: boolean
  image: string
  status: string
  createdAt: string
  updatedAt: string
  subcategories?: TenantCategory[]
}

/**
 * Why a category cannot be deleted.
 */
export type CategoryDeletionReasonCode =
  | "PROTECTED_CATEGORY"
  | "OTHER_CATEGORY_NOT_FOUND"

/**
 * GET /categories/:id/deletion-preview payload.
 */
export interface CategoryDeletionPreview {
  canDelete: boolean
  reasonCode: CategoryDeletionReasonCode | null
  productCount: number
  subcategoryCount: number
  fallbackCategoryName: Record<string, string> | null
}

/**
 * Wrapped GET /categories/:id/deletion-preview body.
 */
export interface CategoryDeletionPreviewResponse {
  success: boolean
  data: CategoryDeletionPreview
}

/**
 * Paginated GET /categories/tenant body.
 */
export interface TenantCategoriesResponse {
  data: TenantCategory[]
  total: number
  page?: number
  limit?: number
  totalPages?: number
}

/**
 * Body for creating a global or tenant-local category.
 */
export interface CategoryWriteBody {
  name: Record<string, string>
  description: Record<string, string>
  image: string
  parentId?: string | null
}

/**
 * Body for POST /requests with `type: "category"`.
 */
export interface CategoryRequestCreateBody {
  title: Record<string, string>
  description?: Record<string, string>
  image: string
  type: "category"
}

/**
 * Tenant that submitted a category request, when still linked.
 */
export interface CategoryRequestTenant {
  id: string
  name: Record<string, string>
}

/**
 * One row from GET /category-requests.
 */
export interface CategoryRequest {
  id: string
  title: Record<string, string>
  description: Record<string, string> | null
  type: "category"
  image: string
  tenantId: string | null
  tenant: CategoryRequestTenant | null
  createdAt: string
  updatedAt: string
}

/**
 * Query fields for GET /category-requests.
 */
export interface CategoryRequestsListParams {
  page?: number
  limit?: number
  search?: string
}

/**
 * Paginated GET /category-requests body.
 */
export interface CategoryRequestsListResponse {
  data: CategoryRequest[]
  total: number
}
