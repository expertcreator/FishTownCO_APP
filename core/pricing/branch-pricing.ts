/**
 * How one branch's delivery fee and tax rate resolve into a `calculatePricing`
 * config.
 *
 * **Copied verbatim from mobile** (`mw-4-2`): `resolveBranchPricing` is
 * `resolveBranchPricingFromDeliveryApi`
 * (`mobile-tenant-app/features/cart/screens/ViewCartDetailScreen.tsx:238-330`)
 * and `buildBranchPricingConfig` is `buildCalculatePricingOptionsForBranch`
 * (`:343-377`). Only the import specifiers and the input type changed: mobile
 * passes a `CartItem[]` and derives the branch facts from `branchItems[0]`,
 * while web hands in one restaurant's cart (`cart/carts.ts` keeps one
 * `CartState` per restaurant) and supplies those facts directly.
 *
 * **The branch-id comparison collapses with that retyping, and nothing else
 * does.** Mobile's `matchesApi` guards a cart that can hold several branches
 * against a rule fetched for only one of them; web captures the rule *from* the
 * branch the cart belongs to, so "the rule is for this branch" is true whenever
 * a rule is present at all.
 *
 * **Two fee formulas exist and both are kept.** `calculatePricing`'s country
 * fallback charges `max(0, distance − threshold) × perKm` with no base; the rule
 * path charges `defaultDeliveryFee + max(0, distance − threshold) × perKm`.
 * Whichever resolves first wins, exactly as mobile does it.
 *
 * **KEEP — the one sanctioned deviation from the verbatim copy.** `useApiFee`
 * additionally requires BOTH coordinate pins. Mobile lets the rule win the
 * moment it is present, so with no address chosen the fee becomes
 * `rule.defaultDeliveryFee`; on this marketplace that is measurably worse than
 * the branch's own published fee. With no address there is no distance to
 * measure, so the rule's default is not more truthful than the captured flat
 * fee — and `COUNTRY_FEE_CONFIG.PK.defaultDeliveryFee` is `0`, so a live cart
 * page that had been quoting Rs 99 would silently drop to the country default
 * with nothing failing (fixtures answer `null` for the rule, so no test would
 * catch it). Human ruling, `mw-4-2` spec change log. Nothing else in this
 * module may drift from mobile.
 */

import type { AvailableCountry, PaymentMethod } from "@/constants"
import type { Coordinates } from "../catalog/schemas"
import {
  deliveryFeeFromTenantChargeRule,
  type TenantDeliveryChargeRule
} from "./delivery-rule"

/** What one branch contributes to its own fee and tax resolution. */
export interface BranchPricingInput {
  /** Σ of the branch's line totals, before any fee. */
  readonly subtotal: number
  /** Whether this order is collected rather than delivered. */
  readonly isPickup: boolean
  /** Whether the branch itself grants free delivery on these lines. */
  readonly hasFreeDelivery: boolean
  /** The flat fee captured at add time, or `undefined` when none was. */
  readonly capturedDeliveryFee?: number
  /** The tax rate captured at add time, or `undefined` when none was. */
  readonly capturedTaxRate?: number
}

/** The coordinates and rule a fee resolution is measured against. */
export interface BranchPricingOptions {
  /** The effective delivery-charge rule, or `undefined` when none was captured. */
  readonly rule?: TenantDeliveryChargeRule
  /** The branch pin, or `null`. */
  readonly branchCoordinates?: Coordinates | null
  /** The chosen address pin, or `null` while no address is chosen. */
  readonly deliveryAddressCoords?: Coordinates | null
}

/** What {@link resolveBranchPricing} decided, as `buildBranchPricingConfig` takes it. */
export interface BranchPricingResolution {
  readonly deliveryFeeConfig: { readonly deliveryFee?: number }
  readonly taxRate: number | undefined
  readonly isPickup: boolean
  readonly branchHasFreeDelivery: boolean
  readonly useExplicitDeliveryFee: boolean
}

/**
 * Prefer delivery-charges API + `deliveryFeeFromTenantChargeRule` when the
 * captured rule is present; fall back to the captured flat fee.
 * @param branch - The branch's own subtotal, mode and captures
 * @param opts - The rule and the two coordinate pins
 * @returns The fee config, tax rate and the flags the config builder reads
 * @example resolveBranchPricing(branch, opts).deliveryFeeConfig // -> { deliveryFee: 130 }
 */
export function resolveBranchPricing(
  branch: BranchPricingInput,
  opts: BranchPricingOptions
): BranchPricingResolution {
  const isPickup = branch.isPickup
  const branchHasFreeDelivery = !isPickup && branch.hasFreeDelivery

  const matchesApi = opts.rule != null

  const groupSubtotal = branch.subtotal

  const apiFeeComputed =
    matchesApi && opts.rule
      ? deliveryFeeFromTenantChargeRule(
          groupSubtotal,
          opts.rule,
          opts.branchCoordinates ?? null,
          opts.deliveryAddressCoords ?? null
        )
      : undefined

  const useApiFee =
    !(isPickup || branchHasFreeDelivery) &&
    matchesApi &&
    opts.rule != null &&
    // THE DEVIATION (see the module docblock). Without both pins the rule can
    // only answer with its own default, which is not a measurement.
    opts.branchCoordinates != null &&
    opts.deliveryAddressCoords != null &&
    typeof apiFeeComputed === "number" &&
    Number.isFinite(apiFeeComputed)

  const cartFee = branch.capturedDeliveryFee
  const useCartFee =
    !(isPickup || branchHasFreeDelivery) &&
    typeof cartFee === "number" &&
    Number.isFinite(cartFee)

  let deliveryFeeConfig: { deliveryFee?: number }
  if (isPickup) {
    deliveryFeeConfig = { deliveryFee: 0 }
  } else if (branchHasFreeDelivery) {
    deliveryFeeConfig = { deliveryFee: 0 }
  } else if (useApiFee) {
    deliveryFeeConfig = { deliveryFee: apiFeeComputed }
  } else if (useCartFee) {
    deliveryFeeConfig = { deliveryFee: cartFee }
  } else {
    deliveryFeeConfig = {}
  }

  const useExplicitDeliveryFee =
    isPickup || branchHasFreeDelivery || useApiFee || useCartFee

  let taxRate: number | undefined
  if (
    matchesApi &&
    typeof opts.rule?.taxRateCash === "number" &&
    Number.isFinite(opts.rule.taxRateCash)
  ) {
    taxRate = opts.rule.taxRateCash
  } else {
    const tr = branch.capturedTaxRate
    taxRate = typeof tr === "number" && Number.isFinite(tr) ? tr : undefined
  }

  return {
    branchHasFreeDelivery,
    deliveryFeeConfig,
    isPickup,
    taxRate,
    useExplicitDeliveryFee
  }
}

/** What {@link buildBranchPricingConfig} takes. */
export interface BuildBranchPricingConfigParams {
  readonly resolved: BranchPricingResolution
  readonly cartCountry: AvailableCountry | string | undefined
  readonly selectedAddress: Coordinates | null
  readonly checkoutPaymentMethod: PaymentMethod
  readonly addTaxEnabled: boolean
}

/**
 * The `calculatePricing` config one branch resolves to — a structural subset of
 * `PricingCalculationConfig`, spelled out so the shape is a declared contract
 * rather than whatever the conditional spreads below happen to produce.
 */
export interface BranchPricingConfig {
  readonly country: AvailableCountry | string | undefined
  readonly addTaxEnabled: boolean
  /** Set when the branch published a rate; mutually exclusive with `paymentMethod`. */
  readonly taxRate?: number
  /** Set when it did not, so the engine falls back to the country table. */
  readonly paymentMethod?: PaymentMethod
  /** Absent when no fee resolved — which `cartPricing` refuses to send onward. */
  readonly deliveryFee?: number
  readonly deliveryAddress: Coordinates | undefined
  readonly tip: number
}

/**
 * Shared options for `calculatePricing`.
 *
 * Mobile keeps this aligned by hand with a second, parallel call site in
 * `handlePlaceOrder` — the fragility its three `AC4` comments guard. Web has one
 * call site, so there is nothing to keep aligned.
 * @param params - The resolution, the country, the address, the payment method and the tax gate
 * @returns The `calculatePricing` config for this branch
 * @example buildBranchPricingConfig(params).tip // -> 0
 */
export function buildBranchPricingConfig({
  resolved,
  cartCountry,
  selectedAddress,
  checkoutPaymentMethod,
  addTaxEnabled
}: BuildBranchPricingConfigParams): BranchPricingConfig {
  const taxConfig =
    resolved.taxRate !== undefined
      ? { taxRate: resolved.taxRate }
      : { paymentMethod: checkoutPaymentMethod }

  return {
    country: cartCountry,
    addTaxEnabled,
    ...taxConfig,
    ...resolved.deliveryFeeConfig,
    deliveryAddress:
      !(
        resolved.isPickup ||
        resolved.branchHasFreeDelivery ||
        resolved.useExplicitDeliveryFee
      ) &&
      selectedAddress?.latitude != null &&
      selectedAddress?.longitude != null
        ? {
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude
          }
        : undefined,
    tip: 0
  }
}
