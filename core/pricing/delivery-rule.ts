/**
 * The tenant delivery-charge rule, and the fee it produces.
 *
 * **Copied verbatim from mobile** (`mw-4-2`, the copy-not-move rule in
 * `BOUNDARIES.md` §4): `haversineKm`, `resolveDistanceKm`,
 * `isEligibleForFreeDelivery` and `deliveryFeeFromTenantChargeRule` are
 * token-for-token `mobile-tenant-app/features/home/utils/deliveryFeeFromRule.ts`
 * and `.../freeDeliveryEligibility.ts`. Only the import specifiers and the rule
 * type changed — the rule type is now inferred from the zod schema below rather
 * than from mobile's hand-written `TenantDeliveryChargeRule`. Do not "improve" a
 * fallback chain or a `Number.isFinite` guard here; the point of the copy is
 * that web and mobile quote the same fee.
 *
 * **`maxDeliveryDistanceKm` is inert on purpose.** Mobile's type declares it,
 * but the string appears nowhere in `business-discovery-backend`, so the
 * endpoint never sends it and the guard below never fires. It is optional in the
 * schema and the guard is copied as written.
 */

import { NUMBER_LIMITS } from "@/constants"
import { z } from "zod"
// The coordinate pair is `@/core/catalog`'s, by exact path rather than through
// its barrel: one pin shape across the whole package, already bounded by
// `NUMBER_LIMITS`, so an out-of-range latitude cannot reach `haversineKm` and
// come back as a real distance and a real per-km fee.
import type { Coordinates } from "../catalog/schemas"

/** Mean Earth radius, mobile's constant. */
const EARTH_RADIUS_KM = 6371

/**
 * Wire bounds. **Every money and rate member is bounded, and the direction of a
 * rejection is the point**: a rule that fails to parse degrades the cart to the
 * branch's captured flat fee, which understates. An unbounded member does the
 * opposite — `taxRateCash: 5` is a 500% tax and `deliveryFeePerKm: 1e300` an
 * unpayable fee, both quoted to a visitor as if they were real.
 */
const MONEY = z
  .number()
  .min(NUMBER_LIMITS.PRICE_MIN)
  .max(NUMBER_LIMITS.PRICE_MAX)
/** A rate is a decimal fraction (`0.05` = 5%), so 1 is the whole order. */
const TAX_RATE = z.number().min(0).max(1)
/** Radii and thresholds are non-negative kilometres. */
const DISTANCE_KM = z.number().min(0)
/** `riderSharePercentage` is a percentage, unlike the tax rates. */
const PERCENTAGE_MAX = 100

/**
 * One row of `GET discovery/api/v1/tenants/{id}/delivery-charges`.
 *
 * Mirrors the service's own `mapRowToResponse`
 * (`deliveryChargesConfigService.ts:36-62`) rather than mobile's wider type: the
 * identity and timestamp members are dropped because nothing here reads them and
 * this object is persisted into the guest cart. Resolution (tenant row when
 * `own_rider` → platform row → country default) and the `ADD_TAX` marketplace
 * flag are applied server-side, so what arrives is already the effective rule.
 *
 * `maxDeliveryDistanceKm` is declared optional and is never sent — see the
 * module docblock.
 * @example tenantDeliveryChargeRuleSchema.parse(row).taxRateCash // -> 0.05
 */
export const tenantDeliveryChargeRuleSchema = z.object({
  /**
   * The country this row configures. The endpoint returns ONE ROW PER
   * CONFIGURED COUNTRY (`listForTenant` returns them all), so without this a
   * multi-country tenant's rule is whichever row the backend happened to order
   * first. Kept for the transport to select on.
   */
  country: z.string().min(1),
  defaultDeliveryFee: MONEY,
  deliveryFeePerKm: MONEY,
  /** Km included in the base fee before per-km applies; `null` / omitted = unlimited. */
  distanceThresholdKm: DISTANCE_KM.nullish(),
  /** Inner free-delivery radius (km): free within it, no order threshold needed. */
  freeDeliveryDistanceKm: DISTANCE_KM.optional(),
  freeDeliveryThreshold: MONEY,
  freeDeliveryThresholdEnabled: z.boolean(),
  /** Max delivery radius (km). Values ≤ 0 mean no limit. Never sent — see the docblock. */
  maxDeliveryDistanceKm: DISTANCE_KM.optional(),
  /** Outer free-delivery radius (km): beyond it free delivery is skipped. */
  maxFreeDeliveryDistanceKm: DISTANCE_KM.optional(),
  platformFee: MONEY,
  riderSharePercentage: z.number().min(0).max(PERCENTAGE_MAX),
  taxRateCard: TAX_RATE,
  taxRateCash: TAX_RATE
})

/** One effective delivery-charge rule, as the public endpoint returns it. */
export type TenantDeliveryChargeRule = z.infer<
  typeof tenantDeliveryChargeRuleSchema
>

/**
 * Great-circle distance between two points, in kilometres.
 * @param lat1 - First point's latitude
 * @param lon1 - First point's longitude
 * @param lat2 - Second point's latitude
 * @param lon2 - Second point's longitude
 * @returns The distance in km
 * @example haversineKm(31.5, 74.35, 31.5, 74.35) // -> 0
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

/**
 * Distance between a branch and a delivery address, or `null` when either point
 * is missing or unusable.
 * @param branchCoordinates - The branch pin
 * @param deliveryAddress - The chosen address pin
 * @returns The distance in km, or `null`
 */
function resolveDistanceKm(
  branchCoordinates?: Coordinates | null,
  deliveryAddress?: Coordinates | null
): number | null {
  if (!(deliveryAddress && branchCoordinates)) {
    return null
  }

  const branchLat = branchCoordinates.latitude
  const branchLon = branchCoordinates.longitude
  const deliveryLat = deliveryAddress.latitude
  const deliveryLon = deliveryAddress.longitude

  if (
    !(
      Number.isFinite(branchLat) &&
      Number.isFinite(branchLon) &&
      Number.isFinite(deliveryLat) &&
      Number.isFinite(deliveryLon)
    )
  ) {
    return null
  }

  const distance = haversineKm(branchLat, branchLon, deliveryLat, deliveryLon)

  if (!Number.isFinite(distance) || distance < 0) {
    return null
  }

  return distance
}

/**
 * Shared free-delivery eligibility for tenant delivery-charge rules and
 * country fee config.
 *
 * Rules (in order):
 * 1. `freeDeliveryThresholdEnabled` must be true.
 * 2. Customer must be within `maxFreeDeliveryDistanceKm`.
 * 3. If within `freeDeliveryDistanceKm` → free delivery.
 * 4. Else if within max and subtotal meets `freeDeliveryThreshold` → free delivery.
 */
export interface FreeDeliveryEligibilityInput {
  freeDeliveryThresholdEnabled?: boolean
  freeDeliveryThreshold?: number
  freeDeliveryDistanceKm?: number
  maxFreeDeliveryDistanceKm?: number
}

/**
 * Whether this order qualifies for free delivery under the rule.
 * @param subtotal - The branch subtotal
 * @param distanceKm - Branch-to-address distance, or `null` when unknown
 * @param rule - The free-delivery members of the rule
 * @returns `true` when delivery is free
 * @example isEligibleForFreeDelivery(2000, 3, rule) // -> true
 */
export function isEligibleForFreeDelivery(
  subtotal: number,
  distanceKm: number | null | undefined,
  rule: FreeDeliveryEligibilityInput
): boolean {
  if (rule.freeDeliveryThresholdEnabled !== true) {
    return false
  }

  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm < 0) {
    return false
  }

  const maxFreeKm = Number(rule.maxFreeDeliveryDistanceKm ?? 0)
  if (
    !(Number.isFinite(maxFreeKm) && maxFreeKm > 0) ||
    distanceKm > maxFreeKm
  ) {
    return false
  }

  const freeDistanceKm = Number(rule.freeDeliveryDistanceKm ?? 0)
  if (
    Number.isFinite(freeDistanceKm) &&
    freeDistanceKm > 0 &&
    distanceKm <= freeDistanceKm
  ) {
    return true
  }

  const threshold = Number(rule.freeDeliveryThreshold ?? 0)
  return (
    Number.isFinite(threshold) &&
    Number.isFinite(subtotal) &&
    subtotal >= threshold
  )
}

/**
 * Delivery fee using only `GET tenants/:id/delivery-charges` row fields (no app constants).
 * - Free delivery when enabled and distance/threshold rules qualify.
 * - Missing branch or customer coords → `defaultDeliveryFee`.
 * - Distance beyond `maxDeliveryDistanceKm` (when positive) → `defaultDeliveryFee` (same as legacy catch).
 * - Otherwise: `defaultDeliveryFee + max(0, distanceKm - thresholdKm) * deliveryFeePerKm`.
 *   `distanceThresholdKm`: when a finite number ≥ 0, only distance beyond it is charged at `deliveryFeePerKm`.
 *   When **`null` or omitted**, threshold is treated as **unlimited** (no extra distance charge; fee stays `defaultDeliveryFee`).
 * @param subtotal - The branch subtotal
 * @param rule - The effective delivery-charge rule
 * @param branchCoordinates - The branch pin, or `null`
 * @param deliveryAddress - The chosen address pin, or `null`
 * @returns The delivery fee
 * @example deliveryFeeFromTenantChargeRule(1000, rule, branch, address) // -> 130
 */
export function deliveryFeeFromTenantChargeRule(
  subtotal: number,
  rule: TenantDeliveryChargeRule,
  branchCoordinates?: Coordinates | null,
  deliveryAddress?: Coordinates | null
): number {
  const distance = resolveDistanceKm(branchCoordinates, deliveryAddress)
  if (
    isEligibleForFreeDelivery(subtotal, distance, {
      freeDeliveryDistanceKm: rule.freeDeliveryDistanceKm,
      freeDeliveryThreshold: rule.freeDeliveryThreshold,
      freeDeliveryThresholdEnabled: rule.freeDeliveryThresholdEnabled,
      maxFreeDeliveryDistanceKm: rule.maxFreeDeliveryDistanceKm
    })
  ) {
    return 0
  }

  const baseDefault = Number.isFinite(rule.defaultDeliveryFee)
    ? Math.max(0, rule.defaultDeliveryFee)
    : 0

  if (distance == null) {
    return baseDefault
  }

  const maxKm = rule.maxDeliveryDistanceKm
  if (
    typeof maxKm === "number" &&
    Number.isFinite(maxKm) &&
    maxKm > 0 &&
    distance > maxKm
  ) {
    return baseDefault
  }

  const thresholdRaw = rule.distanceThresholdKm
  let thresholdKm: number
  if (thresholdRaw === null || thresholdRaw === undefined) {
    thresholdKm = Number.POSITIVE_INFINITY
  } else if (
    typeof thresholdRaw === "number" &&
    Number.isFinite(thresholdRaw) &&
    thresholdRaw >= 0
  ) {
    thresholdKm = thresholdRaw
  } else {
    thresholdKm = 0
  }

  const perKm = Number.isFinite(rule.deliveryFeePerKm)
    ? rule.deliveryFeePerKm
    : 0
  const billableKm = Math.max(0, distance - thresholdKm)
  const fee = baseDefault + billableKm * perKm
  return Number.isFinite(fee) ? Math.max(0, fee) : baseDefault
}

/**
 * Re-exported so `cart/` and the overlay reach one pin type by one path.
 * `@/core/catalog`'s `coordinatesSchema` owns its bounds; nothing here restates
 * them.
 */
export type { Coordinates }
