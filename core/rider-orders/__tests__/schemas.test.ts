import { describe, expect, test } from "bun:test"
import {
  failRiderOrderDeliveryBodySchema,
  riderOrderActionBodySchema,
  updateEstimatedDeliveryTimeBodySchema
} from "../schemas"

describe("riderOrderActionBodySchema", () => {
  test("accepts a bare accept action", () => {
    expect(riderOrderActionBodySchema.parse({ action: "accept" })).toEqual({
      action: "accept"
    })
  })

  test("rejects an unknown action", () => {
    expect(() =>
      riderOrderActionBodySchema.parse({ action: "deliver" })
    ).toThrow()
  })
})

describe("failRiderOrderDeliveryBodySchema", () => {
  test("requires a known failure reason and contact flag", () => {
    expect(
      failRiderOrderDeliveryBodySchema.parse({
        failureReason: "WRONG_ADDRESS",
        contactAttempted: true
      })
    ).toEqual({
      failureReason: "WRONG_ADDRESS",
      contactAttempted: true
    })
    expect(() =>
      failRiderOrderDeliveryBodySchema.parse({
        failureReason: "NOPE",
        contactAttempted: true
      })
    ).toThrow()
  })
})

describe("updateEstimatedDeliveryTimeBodySchema", () => {
  test("requires a positive integer minute count", () => {
    expect(
      updateEstimatedDeliveryTimeBodySchema.parse({ minutes: 12 })
    ).toEqual({ minutes: 12 })
    expect(() =>
      updateEstimatedDeliveryTimeBodySchema.parse({ minutes: 0 })
    ).toThrow()
    expect(() =>
      updateEstimatedDeliveryTimeBodySchema.parse({ minutes: 1.5 })
    ).toThrow()
  })
})
