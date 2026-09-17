import { describe, expect, it } from "vitest"
import {
  type BranchPricingInput,
  buildBranchPricingConfig,
  resolveBranchPricing
} from "../branch-pricing"
import type { TenantDeliveryChargeRule } from "../delivery-rule"

const RULE: TenantDeliveryChargeRule = {
  country: "PK",
  defaultDeliveryFee: 50,
  deliveryFeePerKm: 20,
  distanceThresholdKm: 2,
  freeDeliveryDistanceKm: 0,
  freeDeliveryThreshold: 800,
  freeDeliveryThresholdEnabled: false,
  maxFreeDeliveryDistanceKm: 10,
  platformFee: 30,
  riderSharePercentage: 80,
  taxRateCard: 0.05,
  taxRateCash: 0.05
}

const BRANCH = { latitude: 31.5, longitude: 74.35 }
/** 6 km due north — see `delivery-rule.test.ts` for why the meridian. */
const SIX_KM_NORTH = { latitude: 31.553_959_296_355_124, longitude: 74.35 }

const DELIVERY: BranchPricingInput = {
  capturedDeliveryFee: 70,
  capturedTaxRate: undefined,
  hasFreeDelivery: false,
  isPickup: false,
  subtotal: 1000
}

describe("resolveBranchPricing — which fee wins", () => {
  it("uses the rule's fee over the captured flat one once both pins are present", () => {
    const resolved = resolveBranchPricing(DELIVERY, {
      branchCoordinates: BRANCH,
      deliveryAddressCoords: SIX_KM_NORTH,
      rule: RULE
    })

    expect(resolved.deliveryFeeConfig.deliveryFee).toBeCloseTo(130, 6)
    expect(resolved.useExplicitDeliveryFee).toBe(true)
  })

  it.each([
    [
      "no address pin",
      { branchCoordinates: BRANCH, deliveryAddressCoords: null }
    ],
    [
      "no branch pin",
      { branchCoordinates: null, deliveryAddressCoords: SIX_KM_NORTH }
    ],
    ["neither pin", { branchCoordinates: null, deliveryAddressCoords: null }]
  ])("keeps the captured flat fee with %s — THE SANCTIONED DEVIATION", (_label, pins) => {
    // Mobile would hand back `rule.defaultDeliveryFee` (50) here. Without a
    // distance that is not a measurement, and the branch's own 70 is the more
    // truthful number — see the module docblock.
    const resolved = resolveBranchPricing(DELIVERY, { ...pins, rule: RULE })

    expect(resolved.deliveryFeeConfig).toEqual({ deliveryFee: 70 })
    expect(resolved.deliveryFeeConfig.deliveryFee).not.toBe(
      RULE.defaultDeliveryFee
    )
  })

  it("leaves the fee unset when a rule cannot measure and nothing was captured", () => {
    // What `cartPricing` turns into its second `null` — never an omitted
    // `deliveryFee` reaching the engine's country fallback.
    expect(
      resolveBranchPricing(
        { ...DELIVERY, capturedDeliveryFee: undefined },
        { branchCoordinates: BRANCH, deliveryAddressCoords: null, rule: RULE }
      ).deliveryFeeConfig
    ).toEqual({})
  })

  it("uses the captured flat fee when no rule was captured", () => {
    const resolved = resolveBranchPricing(DELIVERY, {
      branchCoordinates: null,
      deliveryAddressCoords: null
    })

    expect(resolved.deliveryFeeConfig).toEqual({ deliveryFee: 70 })
    expect(resolved.taxRate).toBeUndefined()
  })

  it("zeroes the fee for a pickup order, rule or not", () => {
    const resolved = resolveBranchPricing(
      { ...DELIVERY, isPickup: true },
      {
        branchCoordinates: BRANCH,
        deliveryAddressCoords: SIX_KM_NORTH,
        rule: RULE
      }
    )

    expect(resolved.deliveryFeeConfig).toEqual({ deliveryFee: 0 })
    expect(resolved.isPickup).toBe(true)
    expect(resolved.branchHasFreeDelivery).toBe(false)
  })

  it("zeroes the fee when the branch itself grants free delivery", () => {
    const resolved = resolveBranchPricing(
      { ...DELIVERY, hasFreeDelivery: true },
      { branchCoordinates: BRANCH, deliveryAddressCoords: null, rule: RULE }
    )

    expect(resolved.deliveryFeeConfig).toEqual({ deliveryFee: 0 })
    expect(resolved.branchHasFreeDelivery).toBe(true)
  })

  it("leaves the fee UNSET when nothing was captured at all", () => {
    // The one shape `cartPricing` never produces — it answers `null` first —
    // and the reason it has to: an empty config sends the engine to its
    // country-default distance fallback.
    const resolved = resolveBranchPricing(
      { ...DELIVERY, capturedDeliveryFee: undefined },
      { branchCoordinates: null, deliveryAddressCoords: null }
    )

    expect(resolved.deliveryFeeConfig).toEqual({})
    expect(resolved.useExplicitDeliveryFee).toBe(false)
  })

  it("ignores an unusable captured fee", () => {
    const resolved = resolveBranchPricing(
      { ...DELIVERY, capturedDeliveryFee: Number.NaN },
      { branchCoordinates: null, deliveryAddressCoords: null }
    )

    expect(resolved.deliveryFeeConfig).toEqual({})
  })
})

describe("resolveBranchPricing — which tax rate wins", () => {
  it("prefers the rule's cash rate", () => {
    expect(
      resolveBranchPricing(
        { ...DELIVERY, capturedTaxRate: 0.17 },
        { branchCoordinates: BRANCH, deliveryAddressCoords: null, rule: RULE }
      ).taxRate
    ).toBe(0.05)
  })

  it("falls back to a captured rate, and to nothing at all", () => {
    expect(
      resolveBranchPricing(
        { ...DELIVERY, capturedTaxRate: 0.17 },
        { branchCoordinates: null, deliveryAddressCoords: null }
      ).taxRate
    ).toBe(0.17)
    expect(
      resolveBranchPricing(
        { ...DELIVERY, capturedTaxRate: Number.NaN },
        { branchCoordinates: null, deliveryAddressCoords: null }
      ).taxRate
    ).toBeUndefined()
  })

  it("ignores an unusable rate on the rule", () => {
    expect(
      resolveBranchPricing(DELIVERY, {
        branchCoordinates: null,
        deliveryAddressCoords: null,
        rule: { ...RULE, taxRateCash: Number.NaN }
      }).taxRate
    ).toBeUndefined()
  })
})

describe("buildBranchPricingConfig", () => {
  const resolved = resolveBranchPricing(DELIVERY, {
    branchCoordinates: BRANCH,
    deliveryAddressCoords: SIX_KM_NORTH,
    rule: RULE
  })

  it("passes the resolved rate through and never a tip", () => {
    const config = buildBranchPricingConfig({
      addTaxEnabled: true,
      cartCountry: "PK",
      checkoutPaymentMethod: "cash",
      resolved,
      selectedAddress: null
    })

    expect(config).toMatchObject({
      addTaxEnabled: true,
      country: "PK",
      taxRate: 0.05,
      tip: 0
    })
    expect(config.deliveryFee).toBeCloseTo(130, 6)
  })

  it("falls back to the payment method when the branch published no rate", () => {
    const config = buildBranchPricingConfig({
      addTaxEnabled: false,
      cartCountry: "PK",
      checkoutPaymentMethod: "card",
      resolved: resolveBranchPricing(DELIVERY, {
        branchCoordinates: null,
        deliveryAddressCoords: null
      }),
      selectedAddress: null
    })

    expect(config).toMatchObject({ paymentMethod: "card" })
    expect("taxRate" in config).toBe(false)
  })

  it("withholds the address whenever an explicit fee already resolved", () => {
    // THE PICKUP ROW OF THE MATRIX: the engine must never be handed coordinates
    // it could derive a second, contradictory fee from.
    const pickup = resolveBranchPricing(
      { ...DELIVERY, isPickup: true },
      { branchCoordinates: BRANCH, deliveryAddressCoords: null, rule: RULE }
    )

    expect(
      buildBranchPricingConfig({
        addTaxEnabled: true,
        cartCountry: "PK",
        checkoutPaymentMethod: "cash",
        resolved: pickup,
        selectedAddress: SIX_KM_NORTH
      }).deliveryAddress
    ).toBeUndefined()
  })

  it("hands the address over only when no explicit fee resolved", () => {
    const unresolved = resolveBranchPricing(
      { ...DELIVERY, capturedDeliveryFee: undefined },
      { branchCoordinates: null, deliveryAddressCoords: null }
    )

    expect(
      buildBranchPricingConfig({
        addTaxEnabled: false,
        cartCountry: "PK",
        checkoutPaymentMethod: "cash",
        resolved: unresolved,
        selectedAddress: SIX_KM_NORTH
      }).deliveryAddress
    ).toEqual(SIX_KM_NORTH)
    expect(
      buildBranchPricingConfig({
        addTaxEnabled: false,
        cartCountry: undefined,
        checkoutPaymentMethod: "cash",
        resolved: unresolved,
        selectedAddress: null
      }).deliveryAddress
    ).toBeUndefined()
  })
})
