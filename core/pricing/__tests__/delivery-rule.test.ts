import { describe, expect, it } from "vitest"
import {
  deliveryFeeFromTenantChargeRule,
  haversineKm,
  isEligibleForFreeDelivery,
  type TenantDeliveryChargeRule,
  tenantDeliveryChargeRuleSchema
} from "../delivery-rule"

/**
 * The wire row, exactly as `mapRowToResponse` builds it — every member the
 * service sends, and no member it does not.
 */
const WIRE_ROW = {
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

/** The parsed rule the fee functions take. */
const RULE: TenantDeliveryChargeRule =
  tenantDeliveryChargeRuleSchema.parse(WIRE_ROW)

/** Gujranwala-ish branch pin. */
const BRANCH = { latitude: 31.5, longitude: 74.35 }

/**
 * A pin exactly 6 km due north of {@link BRANCH}.
 *
 * Due north on purpose: along a meridian the haversine reduces to `R × Δlat`,
 * so the distance is arithmetic rather than a number copied out of a previous
 * run — which is what lets the fee below be asserted as a whole rupee figure.
 */
const SIX_KM_NORTH = { latitude: 31.553_959_296_355_124, longitude: 74.35 }

describe("tenantDeliveryChargeRuleSchema", () => {
  it("parses the measured wire row and strips what the cart must not carry", () => {
    expect(RULE.defaultDeliveryFee).toBe(50)
    expect(RULE.taxRateCash).toBe(0.05)
    // Identity and timestamps are not members of the parsed rule: it is
    // persisted into the guest cart, and nothing here reads them. `country` IS
    // kept — the endpoint returns one row per configured country and the
    // transport has to pick.
    expect(Object.keys(RULE).sort()).toEqual([
      "country",
      "defaultDeliveryFee",
      "deliveryFeePerKm",
      "distanceThresholdKm",
      "freeDeliveryDistanceKm",
      "freeDeliveryThreshold",
      "freeDeliveryThresholdEnabled",
      "maxFreeDeliveryDistanceKm",
      "platformFee",
      "riderSharePercentage",
      "taxRateCard",
      "taxRateCash"
    ])
  })

  it("accepts a null threshold and an absent max distance", () => {
    const parsed = tenantDeliveryChargeRuleSchema.parse({
      ...WIRE_ROW,
      distanceThresholdKm: null
    })

    expect(parsed.distanceThresholdKm).toBeNull()
    // The service never sends it — see the module docblock — so the schema must
    // not require it.
    expect(parsed.maxDeliveryDistanceKm).toBeUndefined()
  })

  it.each([
    ["a 500% tax rate", { taxRateCash: 5 }],
    ["a negative base fee", { defaultDeliveryFee: -1000 }],
    ["an absurd per-km rate", { deliveryFeePerKm: 1e300 }],
    ["a negative free threshold", { freeDeliveryThreshold: -1 }],
    ["a negative radius", { maxFreeDeliveryDistanceKm: -5 }],
    ["a rider share above 100", { riderSharePercentage: 101 }],
    ["a missing country", { country: "" }]
  ])("rejects %s at the wire boundary", (_label, patch) => {
    // Rejecting degrades the cart to the branch's captured flat fee, which
    // UNDERSTATES. Accepting would quote the visitor an unpayable number.
    expect(
      tenantDeliveryChargeRuleSchema.safeParse({ ...WIRE_ROW, ...patch })
        .success
    ).toBe(false)
  })

  it("keeps the country so a multi-country tenant can be disambiguated", () => {
    expect(RULE.country).toBe("PK")
  })

  it("rejects a row missing a load-bearing number", () => {
    expect(
      tenantDeliveryChargeRuleSchema.safeParse({
        ...WIRE_ROW,
        defaultDeliveryFee: undefined
      }).success
    ).toBe(false)
  })
})

describe("haversineKm", () => {
  it("is zero for one point against itself", () => {
    expect(
      haversineKm(
        BRANCH.latitude,
        BRANCH.longitude,
        BRANCH.latitude,
        BRANCH.longitude
      )
    ).toBe(0)
  })

  it("measures the meridian pair at 6 km", () => {
    expect(
      haversineKm(
        BRANCH.latitude,
        BRANCH.longitude,
        SIX_KM_NORTH.latitude,
        SIX_KM_NORTH.longitude
      )
    ).toBeCloseTo(6, 9)
  })
})

describe("isEligibleForFreeDelivery", () => {
  const ENABLED = {
    freeDeliveryDistanceKm: 0,
    freeDeliveryThreshold: 800,
    freeDeliveryThresholdEnabled: true,
    maxFreeDeliveryDistanceKm: 10
  }

  it("is false whenever the flag is off", () => {
    expect(
      isEligibleForFreeDelivery(2000, 3, {
        ...ENABLED,
        freeDeliveryThresholdEnabled: false
      })
    ).toBe(false)
    expect(isEligibleForFreeDelivery(2000, 3, {})).toBe(false)
  })

  it("is false without a usable distance — MISSING EITHER COORD IS THIS CASE", () => {
    expect(isEligibleForFreeDelivery(2000, null, ENABLED)).toBe(false)
    expect(isEligibleForFreeDelivery(2000, undefined, ENABLED)).toBe(false)
    expect(isEligibleForFreeDelivery(2000, Number.NaN, ENABLED)).toBe(false)
    expect(isEligibleForFreeDelivery(2000, -1, ENABLED)).toBe(false)
  })

  it("is false without a positive outer radius, or beyond it", () => {
    expect(
      isEligibleForFreeDelivery(2000, 3, {
        ...ENABLED,
        maxFreeDeliveryDistanceKm: 0
      })
    ).toBe(false)
    expect(
      isEligibleForFreeDelivery(2000, 3, {
        ...ENABLED,
        maxFreeDeliveryDistanceKm: Number.NaN
      })
    ).toBe(false)
    expect(isEligibleForFreeDelivery(2000, 11, ENABLED)).toBe(false)
  })

  it("is true inside the inner radius with no order threshold to meet", () => {
    expect(
      isEligibleForFreeDelivery(1, 2, { ...ENABLED, freeDeliveryDistanceKm: 3 })
    ).toBe(true)
  })

  it("falls back to the order threshold between the two radii", () => {
    expect(isEligibleForFreeDelivery(800, 6, ENABLED)).toBe(true)
    expect(isEligibleForFreeDelivery(799, 6, ENABLED)).toBe(false)
  })

  it("reads every absent radius and threshold as zero", () => {
    // No outer radius at all: nothing is inside it, so nothing is free.
    expect(
      isEligibleForFreeDelivery(2000, 3, { freeDeliveryThresholdEnabled: true })
    ).toBe(false)
    // An outer radius but no inner one and no order threshold: inside the
    // radius everything qualifies, because "at least zero" is every subtotal.
    expect(
      isEligibleForFreeDelivery(0, 6, {
        freeDeliveryThresholdEnabled: true,
        maxFreeDeliveryDistanceKm: 10
      })
    ).toBe(true)
  })

  it("is false when either amount is not a number", () => {
    expect(
      isEligibleForFreeDelivery(2000, 6, {
        ...ENABLED,
        freeDeliveryThreshold: Number.NaN
      })
    ).toBe(false)
    expect(isEligibleForFreeDelivery(Number.NaN, 6, ENABLED)).toBe(false)
  })
})

describe("deliveryFeeFromTenantChargeRule", () => {
  it("charges the base plus the billable distance — THE MATRIX'S 6 km ROW", () => {
    // 50 + max(0, 6 - 2) × 20 = 130.
    expect(
      deliveryFeeFromTenantChargeRule(1000, RULE, BRANCH, SIX_KM_NORTH)
    ).toBeCloseTo(130, 6)
  })

  it("falls back to the default fee when no distance can be measured", () => {
    expect(deliveryFeeFromTenantChargeRule(1000, RULE, BRANCH, null)).toBe(50)
    expect(
      deliveryFeeFromTenantChargeRule(1000, RULE, null, SIX_KM_NORTH)
    ).toBe(50)
    // Both pins present and finite, but the arithmetic between them is not —
    // the `Number.isFinite(distance)` guard, not the missing-pin one.
    expect(
      deliveryFeeFromTenantChargeRule(
        1000,
        RULE,
        { latitude: -1e308, longitude: 74.35 },
        { latitude: 1e308, longitude: 74.35 }
      )
    ).toBe(50)
    expect(
      deliveryFeeFromTenantChargeRule(
        1000,
        RULE,
        { latitude: Number.NaN, longitude: 74.35 },
        SIX_KM_NORTH
      )
    ).toBe(50)
  })

  it("answers zero when the free-delivery rules qualify", () => {
    const free: TenantDeliveryChargeRule = {
      ...RULE,
      freeDeliveryThresholdEnabled: true
    }

    expect(
      deliveryFeeFromTenantChargeRule(1000, free, BRANCH, SIX_KM_NORTH)
    ).toBe(0)
  })

  it("floors a non-finite default fee at zero rather than propagating it", () => {
    expect(
      deliveryFeeFromTenantChargeRule(
        1000,
        { ...RULE, defaultDeliveryFee: Number.NaN },
        BRANCH,
        null
      )
    ).toBe(0)
    expect(
      deliveryFeeFromTenantChargeRule(
        1000,
        { ...RULE, defaultDeliveryFee: -10 },
        BRANCH,
        null
      )
    ).toBe(0)
  })

  it("reads an absent threshold as UNLIMITED, not as zero", () => {
    // The whole distance is inside the base fee, so no per-km surcharge at all.
    expect(
      deliveryFeeFromTenantChargeRule(
        1000,
        { ...RULE, distanceThresholdKm: null },
        BRANCH,
        SIX_KM_NORTH
      )
    ).toBe(50)
    expect(
      deliveryFeeFromTenantChargeRule(
        1000,
        { ...RULE, distanceThresholdKm: undefined },
        BRANCH,
        SIX_KM_NORTH
      )
    ).toBe(50)
  })

  it("reads an unusable threshold as zero, charging the whole distance", () => {
    expect(
      deliveryFeeFromTenantChargeRule(
        1000,
        { ...RULE, distanceThresholdKm: -5 },
        BRANCH,
        SIX_KM_NORTH
      )
    ).toBeCloseTo(50 + 6 * 20, 6)
  })

  it("treats an unusable per-km rate as zero", () => {
    expect(
      deliveryFeeFromTenantChargeRule(
        1000,
        { ...RULE, deliveryFeePerKm: Number.NaN },
        BRANCH,
        SIX_KM_NORTH
      )
    ).toBe(50)
  })

  it("falls back to the default fee when the arithmetic overflows", () => {
    expect(
      deliveryFeeFromTenantChargeRule(
        1000,
        { ...RULE, deliveryFeePerKm: 1e308 },
        BRANCH,
        SIX_KM_NORTH
      )
    ).toBe(50)
  })

  it("returns the default fee beyond the max radius — the inert guard, copied as written", () => {
    // `maxDeliveryDistanceKm` is never sent by the service (module docblock), so
    // this branch is unreachable in production. It is copied verbatim and
    // covered here rather than "fixed".
    expect(
      deliveryFeeFromTenantChargeRule(
        1000,
        { ...RULE, maxDeliveryDistanceKm: 3 },
        BRANCH,
        SIX_KM_NORTH
      )
    ).toBe(50)
    // A non-positive max means NO limit, so the distance is charged.
    expect(
      deliveryFeeFromTenantChargeRule(
        1000,
        { ...RULE, maxDeliveryDistanceKm: 0 },
        BRANCH,
        SIX_KM_NORTH
      )
    ).toBeCloseTo(130, 6)
  })
})
