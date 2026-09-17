import { FEATURE_FLAG_KEYS } from "./feature-flags"

const LITE_FEATURES = [
  FEATURE_FLAG_KEYS.POS_MANAGEMENT,
  FEATURE_FLAG_KEYS.ORDER_MANAGEMENT,
  FEATURE_FLAG_KEYS.PRODUCT_MANAGEMENT,
  FEATURE_FLAG_KEYS.SETTINGS_MANAGEMENT,
  FEATURE_FLAG_KEYS.CUSTOMER_ANALYTICS,
  FEATURE_FLAG_KEYS.TENANT_MANAGEMENT,
  FEATURE_FLAG_KEYS.CASH_DRAWERS,
  FEATURE_FLAG_KEYS.TENANT_LOCAL_CATEGORIES
] as const

const STANDARD_FEATURES = [
  ...LITE_FEATURES,
  FEATURE_FLAG_KEYS.TABLE_MANAGEMENT,
  FEATURE_FLAG_KEYS.SHIFT_MANAGEMENT,
  FEATURE_FLAG_KEYS.ROLE_MANAGEMENT,
  FEATURE_FLAG_KEYS.STAFF_MANAGEMENT
] as const

const PRO_FEATURES = [
  ...STANDARD_FEATURES,
  FEATURE_FLAG_KEYS.KDS_MANAGEMENT,
  FEATURE_FLAG_KEYS.BATCH_MANAGEMENT,
  FEATURE_FLAG_KEYS.GROWTH_DASHBOARD,
  FEATURE_FLAG_KEYS.RAW_MATERIAL_MANAGEMENT,
  FEATURE_FLAG_KEYS.SUPPLIER_MANAGEMENT,
  FEATURE_FLAG_KEYS.PURCHASE_ORDER_MANAGEMENT,
  FEATURE_FLAG_KEYS.BRANCH_MANAGEMENT
] as const

export const SUBSCRIPTION_PLANS = {
  trial: {
    name: "Trial",
    dailyRate: 0,
    features: LITE_FEATURES
  },
  lite: {
    name: "Lite",
    dailyRate: 67,
    features: LITE_FEATURES
  },
  standard: {
    name: "Standard",
    dailyRate: 150,
    features: STANDARD_FEATURES
  },
  pro: {
    name: "Pro",
    dailyRate: 250,
    features: PRO_FEATURES
  }
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS
export type PaidSubscriptionPlan = Exclude<SubscriptionPlan, "trial">

export const SUBSCRIPTION_PLAN_CODES = [
  "trial",
  "lite",
  "standard",
  "pro"
] as const satisfies readonly SubscriptionPlan[]

export const PAID_SUBSCRIPTION_PLANS = [
  "lite",
  "standard",
  "pro"
] as const satisfies readonly PaidSubscriptionPlan[]

export const MARKETPLACE_FEATURE_FLAGS = [
  FEATURE_FLAG_KEYS.TENANT_ZONE_CONFIG,
  FEATURE_FLAG_KEYS.PLATFORM_FEE_SETTLEMENT,
  FEATURE_FLAG_KEYS.TENANT_PAYOUT_SETTLEMENT,
  FEATURE_FLAG_KEYS.MANUAL_CONFIRMATION_PAYMENT,
  FEATURE_FLAG_KEYS.VOUCHER,
  FEATURE_FLAG_KEYS.PRICING_SETTINGS_MANAGEMENT,
  FEATURE_FLAG_KEYS.BRANCH_MANAGEMENT
] as const

/** Plan apply never writes these. Platform infra and channel identity stay as-is. */
export const PLAN_APPLY_NEVER_TOUCH_FLAGS = [
  FEATURE_FLAG_KEYS.FORCE_UPDATE,
  FEATURE_FLAG_KEYS.CRASH_ANALYTICS,
  FEATURE_FLAG_KEYS.EVENT_TAXONOMY,
  FEATURE_FLAG_KEYS.FUNNEL_TRACKING,
  FEATURE_FLAG_KEYS.CAMPAIGN_ATTRIBUTION,
  FEATURE_FLAG_KEYS.AB_TESTING,
  FEATURE_FLAG_KEYS.SELL_ON_POS_ENABLED,
  FEATURE_FLAG_KEYS.SELL_ON_HYBRID_ENABLED
] as const

export const ALL_PLAN_POS_FLAGS = [
  ...new Set<string>(
    SUBSCRIPTION_PLAN_CODES.flatMap((code) => [
      ...SUBSCRIPTION_PLANS[code].features
    ])
  )
] as const

export function isPaidSubscriptionPlan(
  plan: string
): plan is PaidSubscriptionPlan {
  return (PAID_SUBSCRIPTION_PLANS as readonly string[]).includes(plan)
}

export function isSubscriptionPlan(plan: string): plan is SubscriptionPlan {
  return (SUBSCRIPTION_PLAN_CODES as readonly string[]).includes(plan)
}

export function getExpectedSubscriptionClaimAmountForPlan(
  plan: PaidSubscriptionPlan,
  subscriptionDays: number
): number {
  return SUBSCRIPTION_PLANS[plan].dailyRate * subscriptionDays
}

export function resolvePlanFlags(
  planCode: SubscriptionPlan,
  sellOn: "pos" | "hybrid"
): ReadonlySet<string> {
  const plan = new Set<string>(SUBSCRIPTION_PLANS[planCode].features)
  if (sellOn === "hybrid") {
    for (const key of MARKETPLACE_FEATURE_FLAGS) {
      plan.add(key)
    }
  }
  return plan
}
