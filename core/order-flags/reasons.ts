import {
  CUSTOMER_FLAG_REASONS,
  RIDER_FLAG_REASONS,
  TENANT_FLAG_REASONS,
  type CustomerFlagReason,
  type RiderFlagReason,
  type TenantFlagReason
} from "@/constants"

/** Tenant reasons that do not apply when reporting a customer. */
const NOT_FOR_CUSTOMER = [
  "rider_issue"
] as const satisfies readonly TenantFlagReason[]

/** Tenant reasons that do not apply when reporting a rider. */
const NOT_FOR_RIDER = [
  "suspected_fraud",
  "false_information"
] as const satisfies readonly TenantFlagReason[]

/** Customer reasons that do not apply when reporting a restaurant. */
const NOT_FOR_TENANT_WHEN_CUSTOMER_REPORTS = [
  "rider_issue"
] as const satisfies readonly CustomerFlagReason[]

/** Customer reasons that do not apply when reporting a rider. */
const NOT_FOR_RIDER_WHEN_CUSTOMER_REPORTS = [
  "incorrect_item",
  "missing_item",
  "quality_issue",
  "damaged_item",
  "wrong_order"
] as const satisfies readonly CustomerFlagReason[]

/** Rider reasons that do not apply when reporting a customer. */
const NOT_FOR_CUSTOMER_WHEN_RIDER_REPORTS = [
  "tenant_delay",
  "wrong_handover"
] as const satisfies readonly RiderFlagReason[]

/** Rider reasons that do not apply when reporting a restaurant. */
const NOT_FOR_TENANT_WHEN_RIDER_REPORTS = [
  "customer_unavailable",
  "unsafe_location",
  "incorrect_address",
  "customer_abusive"
] as const satisfies readonly RiderFlagReason[]

/**
 * Tenant-reporter reason codes valid for each reported party.
 * Built from shared-constants `TENANT_FLAG_REASONS`.
 */
export const TENANT_REASONS_BY_REPORTED_PARTY = {
  customer: TENANT_FLAG_REASONS.filter(
    (code) => !(NOT_FOR_CUSTOMER as readonly string[]).includes(code)
  ),
  rider: TENANT_FLAG_REASONS.filter(
    (code) => !(NOT_FOR_RIDER as readonly string[]).includes(code)
  )
} as const

export type TenantReportableParty =
  keyof typeof TENANT_REASONS_BY_REPORTED_PARTY

/**
 * Customer-reporter reason codes valid for each reported party.
 * Built from shared-constants `CUSTOMER_FLAG_REASONS`.
 */
export const CUSTOMER_REASONS_BY_REPORTED_PARTY = {
  tenant: CUSTOMER_FLAG_REASONS.filter(
    (code) =>
      !(NOT_FOR_TENANT_WHEN_CUSTOMER_REPORTS as readonly string[]).includes(
        code
      )
  ),
  rider: CUSTOMER_FLAG_REASONS.filter(
    (code) =>
      !(NOT_FOR_RIDER_WHEN_CUSTOMER_REPORTS as readonly string[]).includes(code)
  )
} as const

export type CustomerReportableParty =
  keyof typeof CUSTOMER_REASONS_BY_REPORTED_PARTY

/**
 * Rider-reporter reason codes valid for each reported party.
 * Built from shared-constants `RIDER_FLAG_REASONS`.
 */
export const RIDER_REASONS_BY_REPORTED_PARTY = {
  customer: RIDER_FLAG_REASONS.filter(
    (code) =>
      !(NOT_FOR_CUSTOMER_WHEN_RIDER_REPORTS as readonly string[]).includes(code)
  ),
  tenant: RIDER_FLAG_REASONS.filter(
    (code) =>
      !(NOT_FOR_TENANT_WHEN_RIDER_REPORTS as readonly string[]).includes(code)
  )
} as const

export type RiderReportableParty = keyof typeof RIDER_REASONS_BY_REPORTED_PARTY

/**
 * Returns whether `party` is a tenant-reportable party (`customer` | `rider`).
 * @param party - Party value from eligibility or form state
 * @returns True when `party` is a key of `TENANT_REASONS_BY_REPORTED_PARTY`
 */
export function isTenantReportableParty(
  party: unknown
): party is TenantReportableParty {
  return (
    typeof party === "string" &&
    Object.hasOwn(TENANT_REASONS_BY_REPORTED_PARTY, party)
  )
}

/**
 * Returns whether `party` is a customer-reportable party (`tenant` | `rider`).
 * @param party - Party value from eligibility or form state
 * @returns True when `party` is a key of `CUSTOMER_REASONS_BY_REPORTED_PARTY`
 */
export function isCustomerReportableParty(
  party: unknown
): party is CustomerReportableParty {
  return (
    typeof party === "string" &&
    Object.hasOwn(CUSTOMER_REASONS_BY_REPORTED_PARTY, party)
  )
}

/**
 * Returns whether `party` is a rider-reportable party (`customer` | `tenant`).
 * @param party - Party value from eligibility or form state
 * @returns True when `party` is a key of `RIDER_REASONS_BY_REPORTED_PARTY`
 */
export function isRiderReportableParty(
  party: unknown
): party is RiderReportableParty {
  return (
    typeof party === "string" &&
    Object.hasOwn(RIDER_REASONS_BY_REPORTED_PARTY, party)
  )
}

/**
 * Filters API eligibility reason codes to those allowed for a tenant reporting a party.
 * @param apiReasons - Reason codes from flag-eligibility
 * @param party - Selected reported party (`customer` | `rider`)
 * @returns Reason codes valid for the party (empty if party is unsupported)
 * @example
 * filterTenantReasonsForParty(["rider_issue", "other"], "rider")
 * // → ["rider_issue", "other"]
 */
export function filterTenantReasonsForParty(
  apiReasons: readonly string[],
  party: string
): string[] {
  if (!isTenantReportableParty(party)) {
    return []
  }
  const allowed = new Set<string>(TENANT_REASONS_BY_REPORTED_PARTY[party])
  return apiReasons.filter((code) => allowed.has(code))
}

/**
 * Filters API eligibility reason codes to those allowed for a customer reporting a party.
 * @param apiReasons - Reason codes from flag-eligibility
 * @param party - Selected reported party (`tenant` | `rider`)
 * @returns Reason codes valid for the party (empty if party is unsupported)
 * @example
 * filterCustomerReasonsForParty(["rider_issue", "other"], "rider")
 * // → ["rider_issue", "other"]
 */
export function filterCustomerReasonsForParty(
  apiReasons: readonly string[],
  party: string
): string[] {
  if (!isCustomerReportableParty(party)) {
    return []
  }
  const allowed = new Set<string>(CUSTOMER_REASONS_BY_REPORTED_PARTY[party])
  return apiReasons.filter((code) => allowed.has(code))
}

/**
 * Filters API eligibility reason codes to those allowed for a rider reporting a party.
 * @param apiReasons - Reason codes from flag-eligibility
 * @param party - Selected reported party (`customer` | `tenant`)
 * @returns Reason codes valid for the party (empty if party is unsupported)
 * @example
 * filterRiderReasonsForParty(["tenant_delay", "other"], "tenant")
 * // → ["tenant_delay", "other"]
 */
export function filterRiderReasonsForParty(
  apiReasons: readonly string[],
  party: string
): string[] {
  if (!isRiderReportableParty(party)) {
    return []
  }
  const allowed = new Set<string>(RIDER_REASONS_BY_REPORTED_PARTY[party])
  return apiReasons.filter((code) => allowed.has(code))
}
