import { describe, expect, test } from "bun:test"
import {
  buildAcceptPreparingStatusPatch,
  buildProcessOrderBody,
  needsAcceptPreparingFollowUp,
  needsMarketplaceAcceptReject,
  ORDERS_PROCESS_API,
  parseProcessedOrder,
  processOrderAction
} from "../process"

describe("needsMarketplaceAcceptReject", () => {
  test("is true only for pending marketplace tickets", () => {
    expect(
      needsMarketplaceAcceptReject({
        isOnlineOrder: true,
        orderStatus: "pending"
      })
    ).toBe(true)
    expect(
      needsMarketplaceAcceptReject({
        isOnlineOrder: true,
        orderStatus: "Pending"
      })
    ).toBe(true)
    expect(
      needsMarketplaceAcceptReject({
        isOnlineOrder: false,
        orderStatus: "pending"
      })
    ).toBe(false)
    expect(
      needsMarketplaceAcceptReject({
        isOnlineOrder: true,
        orderStatus: "confirmed"
      })
    ).toBe(false)
  })
})

describe("ORDERS_PROCESS_API", () => {
  test("encodes process and status paths", () => {
    expect(ORDERS_PROCESS_API.process("a/b")).toBe("orders/a%2Fb/process")
    expect(ORDERS_PROCESS_API.status("x")).toBe("orders/x/status")
  })
})

describe("buildProcessOrderBody", () => {
  test("keeps accept options and reject reason", () => {
    expect(
      buildProcessOrderBody({
        action: "accept",
        estimatedPreparationMinutes: 20,
        excludeDeliveryFee: true
      })
    ).toEqual({
      action: "accept",
      estimatedPreparationMinutes: 20,
      excludeDeliveryFee: true
    })
    expect(
      buildProcessOrderBody({ action: "reject", reason: "too_busy" })
    ).toEqual({ action: "reject", reason: "too_busy" })
  })
})

describe("parseProcessedOrder / preparing follow-up", () => {
  test("reads nested order and decides preparing patch", () => {
    expect(
      parseProcessedOrder(
        { order: { id: "1", orderStatus: "confirmed", paymentStatus: "paid" } },
        "fallback"
      )
    ).toEqual({
      id: "1",
      orderStatus: "confirmed",
      paymentStatus: "paid"
    })
    expect(needsAcceptPreparingFollowUp("confirmed")).toBe(true)
    expect(needsAcceptPreparingFollowUp("preparing")).toBe(false)
    expect(
      buildAcceptPreparingStatusPatch({
        paymentStatus: "paid",
        estimatedPreparationMinutes: 15
      })
    ).toEqual({
      new_status: "preparing",
      payment_status: "paid",
      estimated_preparation_minutes: 15
    })
  })
})

describe("processOrderAction", () => {
  test("reject posts once", async () => {
    const calls: { method: string; path: string; body: unknown }[] = []
    const http = {
      post: <T, B extends object>(path: string, json: B) => {
        calls.push({ method: "post", path, body: json })
        return Promise.resolve({ ok: true } as T)
      },
      patch: <T, B extends object>(path: string, json: B) => {
        calls.push({ method: "patch", path, body: json })
        return Promise.resolve({} as T)
      }
    }
    const result = await processOrderAction(http, {
      orderId: "o1",
      action: "reject",
      reason: "closed"
    })
    expect(calls).toEqual([
      {
        method: "post",
        path: "orders/o1/process",
        body: { action: "reject", reason: "closed" }
      }
    ])
    expect(result).toEqual({ id: "o1" })
  })

  test("accept patches to preparing when process left confirmed", async () => {
    const calls: { method: string; path: string; body: unknown }[] = []
    const http = {
      post: <T, B extends object>(path: string, json: B) => {
        calls.push({ method: "post", path, body: json })
        return Promise.resolve({
          id: "o1",
          orderStatus: "confirmed",
          paymentStatus: "paid"
        } as T)
      },
      patch: <T, B extends object>(path: string, json: B) => {
        calls.push({ method: "patch", path, body: json })
        return Promise.resolve({
          id: "o1",
          orderStatus: "preparing",
          paymentStatus: "paid"
        } as T)
      }
    }
    const result = await processOrderAction(http, {
      orderId: "o1",
      action: "accept",
      estimatedPreparationMinutes: 20,
      estimatedDeliveryMinutes: 30
    })
    expect(calls).toHaveLength(2)
    expect(calls[1]).toEqual({
      method: "patch",
      path: "orders/o1/status",
      body: {
        new_status: "preparing",
        payment_status: "paid",
        estimated_preparation_minutes: 20,
        estimated_delivery_minutes: 30
      }
    })
    expect(result).toEqual({
      id: "o1",
      orderStatus: "preparing",
      paymentStatus: "paid"
    })
  })
})
