import { describe, expect, test } from "bun:test"
import {
  buildFailRiderOrderDeliveryBody,
  buildRiderOrderActionBody,
  buildUpdateEstimatedDeliveryTimeBody,
  unwrapEstimatedDeliveryTimeResponse,
  unwrapRiderOrderMutationResponse
} from "../payloads"

describe("buildRiderOrderActionBody", () => {
  test("sends only action for accept", () => {
    expect(
      buildRiderOrderActionBody({ orderId: "o1", action: "accept" })
    ).toEqual({ action: "accept" })
  })

  test("includes proof images only on dropoff", () => {
    expect(
      buildRiderOrderActionBody({
        orderId: "o1",
        action: "dropoff",
        deliveryProofImage: "https://cdn/drop.jpg",
        paymentProofImage: "https://cdn/cash.jpg",
        failureReason: "WRONG_ADDRESS"
      })
    ).toEqual({
      action: "dropoff",
      deliveryProofImage: "https://cdn/drop.jpg",
      paymentProofImage: "https://cdn/cash.jpg"
    })
  })

  test("includes fail fields only on failed", () => {
    expect(
      buildRiderOrderActionBody({
        orderId: "o1",
        action: "failed",
        contactAttempted: true,
        failureReason: "WRONG_ADDRESS",
        deliveryProofImage: "https://cdn/drop.jpg"
      })
    ).toEqual({
      action: "failed",
      contactAttempted: true,
      failureReason: "WRONG_ADDRESS"
    })
  })
})

describe("buildFailRiderOrderDeliveryBody", () => {
  test("strips orderId", () => {
    expect(
      buildFailRiderOrderDeliveryBody({
        orderId: "o1",
        failureReason: "CUSTOMER_UNREACHABLE",
        contactAttempted: false
      })
    ).toEqual({
      failureReason: "CUSTOMER_UNREACHABLE",
      contactAttempted: false
    })
  })
})

describe("buildUpdateEstimatedDeliveryTimeBody", () => {
  test("sends minutes only", () => {
    expect(
      buildUpdateEstimatedDeliveryTimeBody({ orderId: "o1", minutes: 20 })
    ).toEqual({ minutes: 20 })
  })
})

describe("unwrapRiderOrderMutationResponse", () => {
  test("marks wrapped order data as success", () => {
    expect(
      unwrapRiderOrderMutationResponse({
        data: { id: "o1", orderNumber: "42" }
      })
    ).toEqual({
      success: true,
      id: "o1",
      orderNumber: "42"
    })
  })

  test("marks a flat order as success", () => {
    expect(
      unwrapRiderOrderMutationResponse({ id: "o1", deliveryStatus: "assigned" })
    ).toEqual({
      success: true,
      id: "o1",
      deliveryStatus: "assigned"
    })
  })
})

describe("unwrapEstimatedDeliveryTimeResponse", () => {
  test("marks a wrapped order object as success", () => {
    expect(
      unwrapEstimatedDeliveryTimeResponse({
        data: { order: { id: "o1" } }
      })
    ).toEqual({
      success: true,
      order: { id: "o1" }
    })
  })
})
