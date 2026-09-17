import type {
  PaidSubscriptionPlan,
  SubscriptionManualPaymentMethodKey,
  SubscriptionPlan
} from "@/constants"

export type { PaidSubscriptionPlan, SubscriptionPlan } from "@/constants"

export type SubscriptionStatusFilter = "active" | "expired" | "trial"

export type PaymentClaimStatus = "pending" | "approved" | "rejected"

export type PaymentClaimReviewAction = "approve" | "reject"

export interface SubscriptionTenant {
  id: string
  name: Record<string, string> | null
  email?: string | null
}

/**
 * Tenant subscription row returned by auth and super-admin APIs.
 * Dates are ISO-8601 strings on the wire.
 */
export interface Subscription {
  id: string
  tenantId: string
  startDate: string
  expireAt: string
  amount: string | null
  isActive: boolean
  isFreeTrial: boolean | null
  plan?: SubscriptionPlan
  paidAt: string | null
  createdAt: string
  updatedAt: string
  tenant?: SubscriptionTenant | null
}

/** Tenant-admin list/me-admin alias for {@link Subscription}. */
export type TenantSubscription = Subscription

export interface SubscriptionsListParams {
  page?: number
  limit?: number
  tenantId?: string
  search?: string
  status?: SubscriptionStatusFilter
  isActive?: boolean
  isFreeTrial?: boolean
  plan?: SubscriptionPlan
  createdAtFrom?: string
  createdAtTo?: string
}

export interface SubscriptionsListResponse {
  success: boolean
  data: {
    items: Subscription[]
    total: number
    page: number
    limit: number
  }
}

export interface TenantSubscriptionsListParams {
  page?: number
  limit?: number
}

export interface TenantSubscriptionsListResponse {
  data: Subscription[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface SubscriptionDetailResponse {
  success: boolean
  data: Subscription
  message?: string
}

export interface SubscriptionCreateBody {
  tenantId: string
  startDate: string
  expireAt: string
  amount?: number
  paidAt?: string | null
  isFreeTrial?: boolean
  activate?: boolean
  plan: SubscriptionPlan
}

export interface SubscriptionUpdateBody {
  startDate?: string
  expireAt?: string
  amount?: number
  isActive?: boolean
  paidAt?: string | null
  notes?: string
  plan?: SubscriptionPlan
}

export interface SubscriptionDeleteResponse {
  success: boolean
  message?: string
}

export interface SubscriptionOverviewStats {
  active: number
  expired: number
  trial: number
  revenue: string
  pendingClaims: number
  expiringSoon: number
}

export interface SubscriptionOverviewStatsResponse {
  success: boolean
  data: SubscriptionOverviewStats
}

export interface PaymentClaimTenant {
  id: string
  name: Record<string, string> | null
  country: string | null
}

export interface PaymentClaimReviewer {
  id: string
  name: string | null
}

/**
 * Manual payment claim returned by me-admin and super-admin APIs.
 * Dates are ISO-8601 strings on the wire.
 */
export interface SubscriptionPaymentClaim {
  id: string
  tenantId?: string
  submittedBy?: string
  subscriptionDays: number
  plan?: SubscriptionPlan
  amount: string
  paymentMethodKey: string
  institutionName: string | null
  paymentScreenshotUrl: string
  status: PaymentClaimStatus
  /** Plain string, JSON string of locale map, or object map from API */
  rejectionReason: string | Record<string, string> | null
  reviewedAt?: string | null
  reviewedBy?: string | null
  createdAt: string
  updatedAt: string
  tenant?: PaymentClaimTenant | null
  reviewer?: PaymentClaimReviewer | null
}

/** Tenant-admin me-admin alias for {@link SubscriptionPaymentClaim}. */
export type PaymentClaim = SubscriptionPaymentClaim

export interface PaymentClaimsListParams {
  page?: number
  limit?: number
  status?: PaymentClaimStatus
  tenantId?: string
  institutionName?: string
}

export interface PaymentClaimsListResponse {
  success: boolean
  data: {
    items: SubscriptionPaymentClaim[]
    total: number
    page: number
    limit: number
  }
}

export interface PaymentClaimReviewBody {
  action: PaymentClaimReviewAction
  notes?: string
}

export interface PaymentClaimReviewResponse {
  success: boolean
  data: SubscriptionPaymentClaim
  message?: string
}

export interface PaymentClaimBulkApproveBody {
  claimIds: string[]
}

export interface PaymentClaimCreateBody {
  plan: PaidSubscriptionPlan
  subscriptionDays: number
  amount: number
  paymentMethod: SubscriptionManualPaymentMethodKey
  paymentScreenshotUrl: string
}

export interface PaymentClaimCreateResponse {
  success: boolean
  data: {
    claimId: string
    status: PaymentClaimStatus
    createdAt: string
  }
  message?: string
}
