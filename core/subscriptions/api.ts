import { SUBSCRIPTIONS_API } from "./constants"
import type { SubscriptionsHttp, SubscriptionsSearchParams } from "./http"
import type {
  PaymentClaimBulkApproveBody,
  PaymentClaimCreateBody,
  PaymentClaimCreateResponse,
  PaymentClaimReviewBody,
  PaymentClaimReviewResponse,
  PaymentClaimsListParams,
  PaymentClaimsListResponse,
  SubscriptionCreateBody,
  SubscriptionDeleteResponse,
  SubscriptionDetailResponse,
  SubscriptionOverviewStatsResponse,
  SubscriptionUpdateBody,
  SubscriptionsListParams,
  SubscriptionsListResponse,
  TenantSubscriptionsListParams,
  TenantSubscriptionsListResponse
} from "./types"

function setSearchParam(
  target: SubscriptionsSearchParams,
  key: string,
  value: string | number | boolean | undefined
) {
  if (value === undefined || value === "") {
    return
  }
  target[key] = String(value)
}

/**
 * Builds query-string fields for GET /subscriptions (super-admin).
 * @param params - List filters plus page/limit
 * @returns String search params
 */
export function buildSubscriptionsSearchParams(
  params: SubscriptionsListParams
): SubscriptionsSearchParams {
  const search: SubscriptionsSearchParams = {}
  setSearchParam(search, "page", params.page)
  setSearchParam(search, "limit", params.limit)
  setSearchParam(search, "tenantId", params.tenantId)
  setSearchParam(search, "search", params.search)
  setSearchParam(search, "status", params.status)
  setSearchParam(search, "isActive", params.isActive)
  setSearchParam(search, "isFreeTrial", params.isFreeTrial)
  setSearchParam(search, "plan", params.plan)
  setSearchParam(search, "createdAtFrom", params.createdAtFrom)
  setSearchParam(search, "createdAtTo", params.createdAtTo)
  return search
}

/**
 * Builds query-string fields for GET /subscriptions (tenant admin).
 * @param params - Page and limit
 * @returns String search params
 */
export function buildTenantSubscriptionsSearchParams(
  params: TenantSubscriptionsListParams
): SubscriptionsSearchParams {
  const search: SubscriptionsSearchParams = {}
  setSearchParam(search, "page", params.page)
  setSearchParam(search, "limit", params.limit)
  return search
}

/**
 * Builds query-string fields for GET /subscription-payment-claims.
 * @param params - List filters plus page/limit
 * @returns String search params
 */
export function buildPaymentClaimsSearchParams(
  params: PaymentClaimsListParams
): SubscriptionsSearchParams {
  const search: SubscriptionsSearchParams = {}
  setSearchParam(search, "page", params.page)
  setSearchParam(search, "limit", params.limit)
  setSearchParam(search, "status", params.status)
  setSearchParam(search, "tenantId", params.tenantId)
  setSearchParam(search, "institutionName", params.institutionName)
  return search
}

/**
 * Lists tenant subscriptions for platform admins.
 * @param http - Injected HTTP client
 * @param params - List filters plus page/limit
 * @returns GET /subscriptions 200 body
 */
export function listSubscriptions(
  http: SubscriptionsHttp,
  params: SubscriptionsListParams = {}
): Promise<SubscriptionsListResponse> {
  return http.get<SubscriptionsListResponse>(
    SUBSCRIPTIONS_API.list,
    buildSubscriptionsSearchParams(params)
  )
}

/**
 * Lists subscriptions for the signed-in tenant.
 * @param http - Injected HTTP client
 * @param params - Page and limit
 * @returns GET /subscriptions 200 body
 */
export function listTenantSubscriptions(
  http: SubscriptionsHttp,
  params: TenantSubscriptionsListParams = {}
): Promise<TenantSubscriptionsListResponse> {
  return http.get<TenantSubscriptionsListResponse>(
    SUBSCRIPTIONS_API.list,
    buildTenantSubscriptionsSearchParams(params)
  )
}

/**
 * Loads one subscription by id.
 * @param http - Injected HTTP client
 * @param subscriptionId - Subscription identifier
 * @returns GET /subscriptions/:id 200 body
 */
export function getSubscription(
  http: SubscriptionsHttp,
  subscriptionId: string
): Promise<SubscriptionDetailResponse> {
  return http.get<SubscriptionDetailResponse>(
    SUBSCRIPTIONS_API.byId(subscriptionId)
  )
}

/**
 * Creates a tenant subscription.
 * @param http - Injected HTTP client
 * @param body - Create payload
 * @returns POST /subscriptions 201 body
 */
export function createSubscription(
  http: SubscriptionsHttp,
  body: SubscriptionCreateBody
): Promise<SubscriptionDetailResponse> {
  return http.post<SubscriptionDetailResponse, SubscriptionCreateBody>(
    SUBSCRIPTIONS_API.list,
    body
  )
}

/**
 * Partially updates a subscription.
 * @param http - Injected HTTP client
 * @param subscriptionId - Subscription identifier
 * @param body - Patch payload
 * @returns PATCH /subscriptions/:id 200 body
 */
export function updateSubscription(
  http: SubscriptionsHttp,
  subscriptionId: string,
  body: SubscriptionUpdateBody
): Promise<SubscriptionDetailResponse> {
  return http.patch<SubscriptionDetailResponse, SubscriptionUpdateBody>(
    SUBSCRIPTIONS_API.byId(subscriptionId),
    body
  )
}

/**
 * Soft-deletes a subscription.
 * @param http - Injected HTTP client
 * @param subscriptionId - Subscription identifier
 * @returns DELETE /subscriptions/:id 200 body
 */
export function deleteSubscription(
  http: SubscriptionsHttp,
  subscriptionId: string
): Promise<SubscriptionDeleteResponse> {
  return http.delete<SubscriptionDeleteResponse>(
    SUBSCRIPTIONS_API.byId(subscriptionId)
  )
}

/**
 * Loads platform subscription dashboard totals.
 * @param http - Injected HTTP client
 * @returns GET /subscriptions/overview-stats 200 body
 */
export function getSubscriptionOverviewStats(
  http: SubscriptionsHttp
): Promise<SubscriptionOverviewStatsResponse> {
  return http.get<SubscriptionOverviewStatsResponse>(
    SUBSCRIPTIONS_API.overviewStats
  )
}

/**
 * Lists subscription payment claims for platform admins.
 * @param http - Injected HTTP client
 * @param params - List filters plus page/limit
 * @returns GET /subscription-payment-claims 200 body
 */
export function listPaymentClaims(
  http: SubscriptionsHttp,
  params: PaymentClaimsListParams = {}
): Promise<PaymentClaimsListResponse> {
  return http.get<PaymentClaimsListResponse>(
    SUBSCRIPTIONS_API.paymentClaims,
    buildPaymentClaimsSearchParams(params)
  )
}

/**
 * Approves or rejects a payment claim.
 * @param http - Injected HTTP client
 * @param claimId - Payment-claim identifier
 * @param body - Review action and optional notes
 * @returns PUT /subscription-payment-claims/:id/review 200 body
 */
export function reviewPaymentClaim(
  http: SubscriptionsHttp,
  claimId: string,
  body: PaymentClaimReviewBody
): Promise<PaymentClaimReviewResponse> {
  return http.put<PaymentClaimReviewResponse, PaymentClaimReviewBody>(
    SUBSCRIPTIONS_API.reviewPaymentClaim(claimId),
    body
  )
}

/**
 * Approves many pending payment claims.
 * @param http - Injected HTTP client
 * @param body - Claim ids to approve
 * @returns POST /subscription-payment-claims/bulk-approve 200 body
 */
export function bulkApprovePaymentClaims(
  http: SubscriptionsHttp,
  body: PaymentClaimBulkApproveBody
): Promise<PaymentClaimsListResponse> {
  return http.post<PaymentClaimsListResponse, PaymentClaimBulkApproveBody>(
    SUBSCRIPTIONS_API.bulkApprovePaymentClaims,
    body
  )
}

/**
 * Submits a tenant-admin manual payment claim.
 * @param http - Injected HTTP client
 * @param body - Plan, duration, amount, method, and screenshot
 * @returns POST /subscriptions/payment-claims 201 body
 */
export function createSubscriptionPaymentClaim(
  http: SubscriptionsHttp,
  body: PaymentClaimCreateBody
): Promise<PaymentClaimCreateResponse> {
  return http.post<PaymentClaimCreateResponse, PaymentClaimCreateBody>(
    SUBSCRIPTIONS_API.tenantPaymentClaims,
    body
  )
}
