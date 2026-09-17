import { describe, expect, test } from "bun:test"
import {
  buildPaymentClaimsSearchParams,
  buildSubscriptionsSearchParams,
  buildTenantSubscriptionsSearchParams,
  bulkApprovePaymentClaims,
  createSubscription,
  createSubscriptionPaymentClaim,
  deleteSubscription,
  getSubscription,
  getSubscriptionOverviewStats,
  listPaymentClaims,
  listSubscriptions,
  listTenantSubscriptions,
  reviewPaymentClaim,
  updateSubscription
} from "../api"
import { SUBSCRIPTIONS_API } from "../constants"
import type { SubscriptionsHttp, SubscriptionsSearchParams } from "../http"

function mockHttp(overrides: Partial<SubscriptionsHttp> = {}): {
  http: SubscriptionsHttp
  calls: {
    get: Array<{ path: string; searchParams?: SubscriptionsSearchParams }>
    post: Array<{ path: string; json: object }>
    put: Array<{ path: string; json: object }>
    patch: Array<{ path: string; json: object }>
    delete: string[]
  }
} {
  const calls = {
    get: [] as Array<{
      path: string
      searchParams?: SubscriptionsSearchParams
    }>,
    post: [] as Array<{ path: string; json: object }>,
    put: [] as Array<{ path: string; json: object }>,
    patch: [] as Array<{ path: string; json: object }>,
    delete: [] as string[]
  }

  const http: SubscriptionsHttp = {
    get: async <TResponse>(
      path: string,
      searchParams?: SubscriptionsSearchParams
    ) => {
      calls.get.push({ path, searchParams })
      return { ok: true } as TResponse
    },
    post: async <TResponse, TBody extends object>(
      path: string,
      json: TBody
    ) => {
      calls.post.push({ path, json })
      return { ok: true } as TResponse
    },
    put: async <TResponse, TBody extends object>(path: string, json: TBody) => {
      calls.put.push({ path, json })
      return { ok: true } as TResponse
    },
    patch: async <TResponse, TBody extends object>(
      path: string,
      json: TBody
    ) => {
      calls.patch.push({ path, json })
      return { ok: true } as TResponse
    },
    delete: async <TResponse>(path: string) => {
      calls.delete.push(path)
      return { success: true } as TResponse
    },
    ...overrides
  }

  return { http, calls }
}

describe("search param builders", () => {
  test("stringifies defined subscription filters and drops empties", () => {
    expect(
      buildSubscriptionsSearchParams({
        page: 0,
        limit: 20,
        tenantId: "t1",
        search: "",
        status: "active",
        isActive: false,
        plan: "lite"
      })
    ).toEqual({
      page: "0",
      limit: "20",
      tenantId: "t1",
      status: "active",
      isActive: "false",
      plan: "lite"
    })
  })

  test("builds tenant list and claim list params", () => {
    expect(
      buildTenantSubscriptionsSearchParams({ page: 1, limit: 10 })
    ).toEqual({
      page: "1",
      limit: "10"
    })
    expect(
      buildPaymentClaimsSearchParams({
        status: "pending",
        institutionName: "Meezan Bank"
      })
    ).toEqual({
      status: "pending",
      institutionName: "Meezan Bank"
    })
  })
})

describe("subscription API helpers", () => {
  test("lists, reads, writes, and deletes subscriptions", async () => {
    const { http, calls } = mockHttp()

    await listSubscriptions(http, { page: 0, limit: 20, plan: "pro" })
    await listTenantSubscriptions(http, { page: 0, limit: 20 })
    await getSubscription(http, "s1")
    await createSubscription(http, {
      tenantId: "t1",
      startDate: "2026-01-01",
      expireAt: "2026-02-01",
      plan: "lite"
    })
    await updateSubscription(http, "s1", { isActive: false })
    await deleteSubscription(http, "s1")
    await getSubscriptionOverviewStats(http)

    expect(calls.get[0]).toEqual({
      path: SUBSCRIPTIONS_API.list,
      searchParams: { page: "0", limit: "20", plan: "pro" }
    })
    expect(calls.get[1]).toEqual({
      path: SUBSCRIPTIONS_API.list,
      searchParams: { page: "0", limit: "20" }
    })
    expect(calls.get[2]).toEqual({
      path: SUBSCRIPTIONS_API.byId("s1"),
      searchParams: undefined
    })
    expect(calls.post[0]?.path).toBe(SUBSCRIPTIONS_API.list)
    expect(calls.patch[0]).toEqual({
      path: SUBSCRIPTIONS_API.byId("s1"),
      json: { isActive: false }
    })
    expect(calls.delete).toEqual([SUBSCRIPTIONS_API.byId("s1")])
    expect(calls.get[3]).toEqual({
      path: SUBSCRIPTIONS_API.overviewStats,
      searchParams: undefined
    })
  })

  test("lists, reviews, bulk-approves, and creates payment claims", async () => {
    const { http, calls } = mockHttp()

    await listPaymentClaims(http, { status: "pending", page: 0 })
    await reviewPaymentClaim(http, "c1", { action: "approve" })
    await bulkApprovePaymentClaims(http, { claimIds: ["c1"] })
    await createSubscriptionPaymentClaim(http, {
      plan: "lite",
      subscriptionDays: 30,
      amount: 2010,
      paymentMethod: "bank_transfer",
      paymentScreenshotUrl: "https://cdn.example/receipt.png"
    })

    expect(calls.get[0]).toEqual({
      path: SUBSCRIPTIONS_API.paymentClaims,
      searchParams: { status: "pending", page: "0" }
    })
    expect(calls.put[0]).toEqual({
      path: SUBSCRIPTIONS_API.reviewPaymentClaim("c1"),
      json: { action: "approve" }
    })
    expect(calls.post[0]).toEqual({
      path: SUBSCRIPTIONS_API.bulkApprovePaymentClaims,
      json: { claimIds: ["c1"] }
    })
    expect(calls.post[1]?.path).toBe(SUBSCRIPTIONS_API.tenantPaymentClaims)
  })
})
