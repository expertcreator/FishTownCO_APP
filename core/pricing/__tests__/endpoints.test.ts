import { describe, expect, it } from "vitest"
import { PRICING_ENDPOINTS } from "../endpoints"

const ROW = {
  country: "PK",
  createdAt: "2026-08-30T00:00:00.000Z",
  defaultDeliveryFee: 50,
  deliveryFeePerKm: 20,
  distanceThresholdKm: 2,
  freeDeliveryDistanceKm: 0,
  freeDeliveryThreshold: 800,
  freeDeliveryThresholdEnabled: false,
  id: "rule-1",
  maxFreeDeliveryDistanceKm: 10,
  platformFee: 30,
  riderSharePercentage: 80,
  taxRateCard: 0.05,
  taxRateCash: 0.05,
  tenantId: "tenant-1",
  updatedAt: "2026-08-30T00:00:00.000Z"
}

describe("PRICING_ENDPOINTS.tenantDeliveryCharges", () => {
  it("builds a relative path with no leading slash", () => {
    expect(PRICING_ENDPOINTS.tenantDeliveryCharges.method).toBe("GET")
    expect(PRICING_ENDPOINTS.tenantDeliveryCharges.path("tenant-1")).toBe(
      "tenants/tenant-1/delivery-charges"
    )
  })

  it("encodes the tenant id rather than interpolating it raw", () => {
    expect(PRICING_ENDPOINTS.tenantDeliveryCharges.path("a/../b")).toBe(
      "tenants/a%2F..%2Fb/delivery-charges"
    )
  })

  it("parses the service's envelope of rows", () => {
    const parsed = PRICING_ENDPOINTS.tenantDeliveryCharges.response.parse({
      data: [ROW],
      success: true
    })

    expect(parsed.data?.[0]?.defaultDeliveryFee).toBe(50)
    expect(parsed.data).toHaveLength(1)
  })

  it("accepts an empty list and a null body as absence, not as failure", () => {
    expect(
      PRICING_ENDPOINTS.tenantDeliveryCharges.response.parse({
        data: [],
        success: true
      }).data
    ).toEqual([])
    expect(
      PRICING_ENDPOINTS.tenantDeliveryCharges.response.parse({ data: null })
        .data
    ).toBeNull()
  })

  it("fails the parse on a body that is not the envelope", () => {
    expect(
      PRICING_ENDPOINTS.tenantDeliveryCharges.response.safeParse({
        data: [{ ...ROW, taxRateCash: "0.05" }]
      }).success
    ).toBe(false)
  })
})
