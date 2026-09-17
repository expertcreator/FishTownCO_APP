import { z } from "zod"
import {
  CONFIGURABLE_PERMISSIONS,
  type Permission,
  type PermissionGroup
} from "./permissions"

/**
 * Feature flags aligned 1:1 with permission groups so UI/modules can be gated
 * by a stable product-level capability key.
 */
export const FEATURE_FLAG_KEYS = {
  BRANCH_MANAGEMENT: "branch_management",
  CATEGORY_MANAGEMENT: "category_management",
  PRODUCT_MANAGEMENT: "product_management",
  ORDER_MANAGEMENT: "order_management",
  KDS_MANAGEMENT: "kds_management",
  STAFF_MANAGEMENT: "staff_management",
  TABLE_MANAGEMENT: "table_management",
  RAW_MATERIAL_MANAGEMENT: "raw_material_management",
  BUSINESS_HOURS_MANAGEMENT: "business_hours_management",
  BATCH_MANAGEMENT: "batch_management",
  SUPPLIER_MANAGEMENT: "supplier_management",
  PURCHASE_ORDER_MANAGEMENT: "purchase_order_management",
  POS_MANAGEMENT: "pos_management",
  SETTINGS_MANAGEMENT: "settings_management",
  PRICING_SETTINGS_MANAGEMENT: "pricing_settings_management",
  ROLE_MANAGEMENT: "role_management",
  TENANT_MANAGEMENT: "tenant_management",
  SHIFT_MANAGEMENT: "shift_management",
  VOUCHER: "voucher",
  MANUAL_CONFIRMATION_PAYMENT: "manual_confirmation_payment",
  PLATFORM_FEE_SETTLEMENT: "platform_fee_settlement",
  PLATFORM_FEE_CHECKOUT_LINE: "platform_fee_checkout_line",
  ADD_TAX: "add_tax",
  FORCE_UPDATE: "force_update",
  EVENT_TAXONOMY: "event_taxonomy",
  CUSTOMER_ANALYTICS: "customer_analytics",
  FUNNEL_TRACKING: "funnel_tracking",
  CAMPAIGN_ATTRIBUTION: "campaign_attribution",
  AB_TESTING: "ab_testing",
  GROWTH_DASHBOARD: "growth_dashboard",
  CRASH_ANALYTICS: "crash_analytics",
  RESTAURANT_COVERAGE_ZONES: "restaurant_coverage_zones",
  TENANT_LOCAL_CATEGORIES: "tenant_local_categories",
  TENANT_ZONE_CONFIG: "tenant_zone_config",
  TENANT_PAYOUT_SETTLEMENT: "tenant_payout_settlement",
  ACTIVE_SESSIONS: "active_sessions",
  ORDER_FLAGGING: "order_flagging",
  WHATSAPP_ORDER_ACTIONS: "whatsapp_order_actions",
  BARCODE_SCANNING: "barcode_scanning",
  STOCK_TRACKING: "stock_tracking",
  PRODUCT_VARIANTS: "product_variants",
  RETAIL_RECEIPT_TEMPLATE: "retail_receipt_template",
  FBR_POS_INTEGRATION: "fbr_pos_integration",
  LOYALTY_POINTS: "loyalty_points",
  MULTI_GODOWN: "multi_godown",
  QUOTATIONS: "quotations",
  SELL_ON_POS_ENABLED: "sell_on_pos_enabled",
  SELL_ON_HYBRID_ENABLED: "sell_on_hybrid_enabled",
  CASH_DRAWERS: "cash_drawers"
} as const

export const FEATURE_FLAGS = Object.values(FEATURE_FLAG_KEYS) as [
  FeatureFlagKey,
  ...FeatureFlagKey[]
]

export const FEATURE_FLAG_GROUPS = {
  core: FEATURE_FLAGS
} as const

export const FEATURE_CATEGORY_KEYS = {
  CORE: "core",
  TENANT_TYPE: "tenant-type",
  PREMIUM: "premium",
  RESTAURANT_SPECIFIC: "restaurant-specific",
  RETAIL_SPECIFIC: "retail-specific",
  CAFE_SPECIFIC: "cafe-specific",
  SALON_SPECIFIC: "salon-specific",
  UI: "ui",
  ANALYTICS: "analytics",
  PLATFORM: "platform",
  MARKETPLACE: "marketplace"
} as const

export const FEATURE_CATEGORIES = Object.values(FEATURE_CATEGORY_KEYS) as [
  FeatureCategoryKey,
  ...FeatureCategoryKey[]
]

/**  display name, feature key */
export const FEATURE_FLAGS_META: Record<
  PermissionGroup,
  { name: string; key: FeatureFlag; category: FeatureCategory }
> = {
  branches: {
    name: "Branch Management",
    key: FEATURE_FLAG_KEYS.BRANCH_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  categories: {
    name: "Category Management",
    key: FEATURE_FLAG_KEYS.CATEGORY_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  products: {
    name: "Product Management",
    key: FEATURE_FLAG_KEYS.PRODUCT_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  orders: {
    name: "Order Management",
    key: FEATURE_FLAG_KEYS.ORDER_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  kds: {
    name: "KDS Management",
    key: FEATURE_FLAG_KEYS.KDS_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  staff: {
    name: "Staff Management",
    key: FEATURE_FLAG_KEYS.STAFF_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  tables: {
    name: "Table Management",
    key: FEATURE_FLAG_KEYS.TABLE_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  "raw-materials": {
    name: "Raw Material Management",
    key: FEATURE_FLAG_KEYS.RAW_MATERIAL_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  "business-hours": {
    name: "Business Hours Management",
    key: FEATURE_FLAG_KEYS.BUSINESS_HOURS_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  batches: {
    name: "Batch Management",
    key: FEATURE_FLAG_KEYS.BATCH_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  suppliers: {
    name: "Supplier Management",
    key: FEATURE_FLAG_KEYS.SUPPLIER_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  "purchase-orders": {
    name: "Purchase Order Management",
    key: FEATURE_FLAG_KEYS.PURCHASE_ORDER_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  pos: {
    name: "POS Management",
    key: FEATURE_FLAG_KEYS.POS_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  settings: {
    name: "Settings Management",
    key: FEATURE_FLAG_KEYS.SETTINGS_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  pricing_settings: {
    name: "Pricing Settings Management",
    key: FEATURE_FLAG_KEYS.PRICING_SETTINGS_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  roles: {
    name: "Role Management",
    key: FEATURE_FLAG_KEYS.ROLE_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  tenants: {
    name: "Tenant Management",
    key: FEATURE_FLAG_KEYS.TENANT_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  },
  shifts: {
    name: "Shift Management",
    key: FEATURE_FLAG_KEYS.SHIFT_MANAGEMENT,
    category: FEATURE_CATEGORY_KEYS.CORE
  }
}

export const PRODUCT_FLAGS_META = [
  {
    key: FEATURE_FLAG_KEYS.VOUCHER,
    name: "Marketplace Voucher / Coupon",
    category: FEATURE_CATEGORY_KEYS.MARKETPLACE,
    defaultEnabled: false,
    description:
      "Enables voucher/coupon entry in customer checkout. Starting state is deployment-local and can be overridden through the canonical feature flag system."
  },
  {
    key: FEATURE_FLAG_KEYS.MANUAL_CONFIRMATION_PAYMENT,
    name: "Manual Confirmation Payment Method",
    category: FEATURE_CATEGORY_KEYS.MARKETPLACE,
    defaultEnabled: false,
    description:
      "Enables bank-transfer / manual confirmation as a payment method at checkout. Starting state is deployment-local and can be overridden through the canonical feature flag system."
  },
  {
    key: FEATURE_FLAG_KEYS.PLATFORM_FEE_SETTLEMENT,
    name: "Platform Fee Settlement",
    category: FEATURE_CATEGORY_KEYS.MARKETPLACE,
    defaultEnabled: false,
    description:
      "Gates marketplace tenant platform-fee and commission settlement wallet, remittance submission, and order-block enforcement."
  },
  {
    key: FEATURE_FLAG_KEYS.PLATFORM_FEE_CHECKOUT_LINE,
    name: "Platform Fee Checkout Line",
    category: FEATURE_CATEGORY_KEYS.MARKETPLACE,
    defaultEnabled: false,
    description:
      "Controls whether the customer checkout displays the platform-fee line item."
  },
  {
    key: FEATURE_FLAG_KEYS.ADD_TAX,
    name: "Add Tax",
    category: FEATURE_CATEGORY_KEYS.MARKETPLACE,
    defaultEnabled: false,
    description:
      "Controls whether tax can be added and displayed in marketplace order totals."
  },
  {
    key: FEATURE_FLAG_KEYS.SELL_ON_POS_ENABLED,
    name: "POS Sell-On Channel",
    category: FEATURE_CATEGORY_KEYS.TENANT_TYPE,
    defaultEnabled: false,
    description:
      "Controls whether the POS sell-on channel is available for a tenant at runtime."
  },
  {
    key: FEATURE_FLAG_KEYS.SELL_ON_HYBRID_ENABLED,
    name: "Hybrid Sell-On Channel",
    category: FEATURE_CATEGORY_KEYS.TENANT_TYPE,
    defaultEnabled: false,
    description:
      "Controls whether the hybrid sell-on upgrade path is available for a tenant at runtime."
  },
  {
    key: FEATURE_FLAG_KEYS.FORCE_UPDATE,
    name: "Force Update Enforcement",
    category: FEATURE_CATEGORY_KEYS.PLATFORM,
    defaultEnabled: false,
    description:
      "When enabled, enforces minimum supported app version with a blocking modal (FR113O, FR113P)."
  },
  {
    key: FEATURE_FLAG_KEYS.EVENT_TAXONOMY,
    name: "Domain Event Taxonomy",
    category: FEATURE_CATEGORY_KEYS.ANALYTICS,
    defaultEnabled: false,
    description:
      "Gates publication of the canonical domain event taxonomy to Kafka / event bus."
  },
  {
    key: FEATURE_FLAG_KEYS.CUSTOMER_ANALYTICS,
    name: "Customer Behavioral Analytics",
    category: FEATURE_CATEGORY_KEYS.ANALYTICS,
    defaultEnabled: false,
    description: "Gates customer-app behavioral event capture instrumentation."
  },
  {
    key: FEATURE_FLAG_KEYS.FUNNEL_TRACKING,
    name: "Customer Funnel Tracking",
    category: FEATURE_CATEGORY_KEYS.ANALYTICS,
    defaultEnabled: false,
    description:
      "Gates browse-to-order funnel event capture (home -> restaurant -> cart -> placed)."
  },
  {
    key: FEATURE_FLAG_KEYS.CAMPAIGN_ATTRIBUTION,
    name: "Campaign / Source Attribution",
    category: FEATURE_CATEGORY_KEYS.ANALYTICS,
    defaultEnabled: false,
    description:
      "Gates UTM parameter and referral-source capture on app open and first order."
  },
  {
    key: FEATURE_FLAG_KEYS.AB_TESTING,
    name: "A/B Testing Hooks",
    category: FEATURE_CATEGORY_KEYS.ANALYTICS,
    defaultEnabled: false,
    description:
      "Gates lightweight A/B experiment assignment and variant tracking."
  },
  {
    key: FEATURE_FLAG_KEYS.GROWTH_DASHBOARD,
    name: "Growth Dashboard",
    category: FEATURE_CATEGORY_KEYS.ANALYTICS,
    defaultEnabled: false,
    description: "Gates admin-facing growth metrics surface."
  },
  {
    key: FEATURE_FLAG_KEYS.CRASH_ANALYTICS,
    name: "Crash and Error Analytics",
    category: FEATURE_CATEGORY_KEYS.ANALYTICS,
    defaultEnabled: false,
    description:
      "Gates Sentry-backed crash and JS error analytics consolidation."
  },
  {
    key: FEATURE_FLAG_KEYS.RESTAURANT_COVERAGE_ZONES,
    name: "Restaurant Delivery Coverage Zones",
    category: FEATURE_CATEGORY_KEYS.RESTAURANT_SPECIFIC,
    defaultEnabled: false,
    description:
      "Gates restaurant selection of own-rider delivery coverage zones from super-admin-approved zone sets."
  },
  {
    key: FEATURE_FLAG_KEYS.TENANT_LOCAL_CATEGORIES,
    name: "Tenant Local Categories",
    category: FEATURE_CATEGORY_KEYS.RESTAURANT_SPECIFIC,
    defaultEnabled: false,
    description:
      "Gates POS-only tenant-local category authoring and category-list exposure in tenant admin."
  },
  {
    key: FEATURE_FLAG_KEYS.TENANT_ZONE_CONFIG,
    name: "Tenant Zone Config",
    category: FEATURE_CATEGORY_KEYS.RESTAURANT_SPECIFIC,
    defaultEnabled: false,
    description:
      "Gates tenant-admin delivery radius configuration for restaurants using own-rider delivery."
  },
  {
    key: FEATURE_FLAG_KEYS.BARCODE_SCANNING,
    name: "Barcode Scanning",
    category: FEATURE_CATEGORY_KEYS.RETAIL_SPECIFIC,
    defaultEnabled: false,
    description:
      "Gates retailer barcode scanning workflows and routes for tenants that opt into retail capabilities."
  },
  {
    key: FEATURE_FLAG_KEYS.STOCK_TRACKING,
    name: "Stock Tracking",
    category: FEATURE_CATEGORY_KEYS.RETAIL_SPECIFIC,
    defaultEnabled: false,
    description:
      "Gates retailer stock tracking workflows and inventory visibility."
  },
  {
    key: FEATURE_FLAG_KEYS.PRODUCT_VARIANTS,
    name: "Product Variants",
    category: FEATURE_CATEGORY_KEYS.RETAIL_SPECIFIC,
    defaultEnabled: false,
    description:
      "Gates retailer product variant workflows for size, color, and SKU-specific selling."
  },
  {
    key: FEATURE_FLAG_KEYS.RETAIL_RECEIPT_TEMPLATE,
    name: "Retail Receipt Template",
    category: FEATURE_CATEGORY_KEYS.RETAIL_SPECIFIC,
    defaultEnabled: false,
    description:
      "Gates retailer-specific receipt template workflows and routes for tenants that opt into retail capabilities."
  },
  {
    key: FEATURE_FLAG_KEYS.FBR_POS_INTEGRATION,
    name: "FBR / PRAL POS Integration",
    category: FEATURE_CATEGORY_KEYS.RETAIL_SPECIFIC,
    defaultEnabled: false,
    description:
      "Controls opt-in real-time FBR / PRAL invoice submission for retailer POS tenants."
  },
  {
    key: FEATURE_FLAG_KEYS.LOYALTY_POINTS,
    name: "Loyalty Points",
    category: FEATURE_CATEGORY_KEYS.RETAIL_SPECIFIC,
    defaultEnabled: false,
    description:
      "Gates retailer loyalty-points accrual and redemption workflows."
  },
  {
    key: FEATURE_FLAG_KEYS.MULTI_GODOWN,
    name: "Multi Godown",
    category: FEATURE_CATEGORY_KEYS.RETAIL_SPECIFIC,
    defaultEnabled: false,
    description: "Gates retailer multi-godown stock location workflows."
  },
  {
    key: FEATURE_FLAG_KEYS.QUOTATIONS,
    name: "Quotations",
    category: FEATURE_CATEGORY_KEYS.RETAIL_SPECIFIC,
    defaultEnabled: false,
    description: "Gates retailer quotation creation and conversion workflows."
  },
  {
    key: FEATURE_FLAG_KEYS.TENANT_PAYOUT_SETTLEMENT,
    name: "Fishtownco Tenant Payout Settlement",
    category: FEATURE_CATEGORY_KEYS.MARKETPLACE,
    defaultEnabled: false,
    description:
      "Gates the super-admin tenant payout disbursement management screen and Fishtownco commission settlement navigation entry."
  },
  {
    key: FEATURE_FLAG_KEYS.ACTIVE_SESSIONS,
    name: "Active Sessions",
    category: FEATURE_CATEGORY_KEYS.MARKETPLACE,
    defaultEnabled: false,
    description:
      "Enables active session visibility and logout-from-all-devices in the customer profile."
  },
  {
    key: FEATURE_FLAG_KEYS.ORDER_FLAGGING,
    name: "Order Flagging",
    category: FEATURE_CATEGORY_KEYS.MARKETPLACE,
    defaultEnabled: false,
    description:
      "Lets customers, tenants, and riders flag marketplace orders for super-admin investigation."
  },
  {
    key: FEATURE_FLAG_KEYS.WHATSAPP_ORDER_ACTIONS,
    name: "WhatsApp Order Actions",
    category: FEATURE_CATEGORY_KEYS.MARKETPLACE,
    defaultEnabled: false,
    description:
      "Sends a WhatsApp new-order message to the branch whatsapp contact and lets that number accept or reject pending online orders."
  },
  {
    key: FEATURE_FLAG_KEYS.CASH_DRAWERS,
    name: "Cash Drawers",
    category: FEATURE_CATEGORY_KEYS.CORE,
    defaultEnabled: false,
    description:
      "Gates tenant-admin cash drawers for POS and hybrid tenants on an active subscription plan."
  }
] as const

/**
 * Mapping between backend permission group and product feature key.
 */
export const PERMISSION_GROUP_TO_FEATURE_FLAG: Record<
  PermissionGroup,
  (typeof FEATURE_FLAGS)[number]
> = Object.fromEntries(
  Object.entries(FEATURE_FLAGS_META).map(([group, meta]) => [group, meta.key])
) as Record<PermissionGroup, FeatureFlag>

/** Reverse lookup: feature -> permission group */
export const FEATURE_FLAG_TO_PERMISSION_GROUP = Object.fromEntries(
  Object.entries(PERMISSION_GROUP_TO_FEATURE_FLAG).map(([group, feature]) => [
    feature,
    group
  ])
) as Record<FeatureFlag, PermissionGroup>

/** Exact permission list behind each feature flag (derived from permissions.ts) */
const featureToPermissions: Partial<Record<FeatureFlag, readonly string[]>> = {}
for (const [group, feature] of Object.entries(
  PERMISSION_GROUP_TO_FEATURE_FLAG
)) {
  const permissions = CONFIGURABLE_PERMISSIONS[group as PermissionGroup]

  if (!permissions) {
    continue
  }

  featureToPermissions[feature as FeatureFlag] = [...permissions]
}
export const FEATURE_FLAG_TO_PERMISSIONS = featureToPermissions as Record<
  FeatureFlag,
  readonly string[]
>

const permissionToFeatureFlag: Partial<Record<Permission, FeatureFlag>> = {}
for (const [feature, permissions] of Object.entries(
  FEATURE_FLAG_TO_PERMISSIONS
)) {
  for (const permission of permissions) {
    permissionToFeatureFlag[permission as Permission] = feature as FeatureFlag
  }
}
export const PERMISSION_TO_FEATURE_FLAG = permissionToFeatureFlag

export const getFeatureFlagByPermission = (permission: Permission) =>
  PERMISSION_TO_FEATURE_FLAG[permission]

export const featureFlagEnum = z.enum(FEATURE_FLAGS)
export const featureFlagGroupEnum = z.enum(["core"])
export const featureCategoryEnum = z.enum(FEATURE_CATEGORIES)

export const isFeatureFlag = (value: string): value is FeatureFlag =>
  featureFlagEnum.safeParse(value).success

export const isPlatformFeatureEnabled = (
  features: Partial<Record<FeatureFlag, boolean>> | undefined,
  featureFlag: FeatureFlag
) => features?.[featureFlag] === true

export type FeatureFlagKey =
  (typeof FEATURE_FLAG_KEYS)[keyof typeof FEATURE_FLAG_KEYS]
export type FeatureFlag = (typeof FEATURE_FLAGS)[number]
export type FeatureFlagGroup = keyof typeof FEATURE_FLAG_GROUPS
export type FeatureCategoryKey =
  (typeof FEATURE_CATEGORY_KEYS)[keyof typeof FEATURE_CATEGORY_KEYS]
export type FeatureCategory = (typeof FEATURE_CATEGORIES)[number]
