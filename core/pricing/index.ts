/**
 * `@/core/pricing` — the shared money-math fixture table, plus the config the
 * engine is driven with.
 *
 * The pricing engine itself is still `calculatePricing` in `@/constants`, the
 * package all 5 backends pin, and it stays there so the server and both clients
 * agree by construction rather than by convention. `pricing-fixtures.ts` is the
 * table that proves they still do.
 *
 * What `mw-4-2` added is the layer **above** the engine and below the screen:
 * the tenant delivery-charge rule, the fee it produces, the branch resolution
 * that decides which fee wins, and the minimum-order gate. None of it is
 * arithmetic the engine already owns — it is the config assembly that used to
 * live only inside mobile's cart screen.
 *
 * `http.ts` / `api.ts` are still absent on purpose: this domain owns no
 * transport. `endpoints.ts` defines the one public read; the app's
 * `CatalogTransport` implementation performs it.
 */

export {
  type BranchPricingConfig,
  buildBranchPricingConfig,
  type BranchPricingInput,
  type BranchPricingOptions,
  type BranchPricingResolution,
  type BuildBranchPricingConfigParams,
  resolveBranchPricing
} from "./branch-pricing"
export {
  deliveryFeeFromTenantChargeRule,
  type FreeDeliveryEligibilityInput,
  haversineKm,
  isEligibleForFreeDelivery,
  type TenantDeliveryChargeRule,
  tenantDeliveryChargeRuleSchema
} from "./delivery-rule"
export { PRICING_ENDPOINTS } from "./endpoints"
export { type MinimumOrderGate, minimumOrderGate } from "./minimum-order"
export {
  COMPOSED_PRICE_FIXTURE_NAMES,
  findPricingFixture,
  PRICING_FIXTURES,
  SINGLE_ITEM_FIXTURE_NAME
} from "./pricing-fixtures"
export type {
  PricingFixture,
  PricingFixtureExpectation
} from "./pricing-fixtures"
