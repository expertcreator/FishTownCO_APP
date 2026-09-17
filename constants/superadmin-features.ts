import { z } from "zod"

/**
 * Sidebar feature flags - controls visibility of sidebar navigation items
 */
export const SUPERADMIN_FEATURE_KEYS = {
  DASHBOARD: "dashboard",
  TENANTS: "tenants",
  REGISTRATION_INVITES: "registration_invites",
  SYSTEM_NOTIFICATIONS: "system_notifications",
  PRODUCTS: "products",
  CATEGORIES: "categories",
  COUPONS: "coupons",
  SUBSCRIPTIONS: "subscriptions",
  RIDERS: "riders",
  DELIVERY_CHARGES: "delivery_charges",
  APP_VERSIONS: "app_versions",
  PLATFORM_FEE: "platform_fee",
  TENANT_EARNINGS: "tenant_earnings",
  RIDER_EARNINGS: "rider_earnings",
  TENANT_EXPENSES: "tenant_expenses",
  RIDER_EXPENSES: "rider_expenses",
  FREE_DELIVERY_RULES: "free_delivery_rules",
  SHIFT_SLOTS: "shift_slots",
  ZONES: "zones",
  GEO_TAXONOMY: "geo_taxonomy",
  TENANT_ZONE_CONFIG: "tenant_zone_config",
  ORDER_FLAGGING: "order_flagging",
  ADS: "ads"
} as const

export type SuperadminFeatureFlagKey =
  (typeof SUPERADMIN_FEATURE_KEYS)[keyof typeof SUPERADMIN_FEATURE_KEYS]

export const SUPERADMIN_FEATURE_FLAGS = Object.values(
  SUPERADMIN_FEATURE_KEYS
) as [SuperadminFeatureFlagKey, ...SuperadminFeatureFlagKey[]]

/**
 * Sidebar features metadata with display name and key
 */
export const SUPERADMIN_FEATURES_META: Record<
  string,
  { name: string; key: SuperadminFeatureFlag }
> = {
  dashboard: {
    name: "Dashboard",
    key: SUPERADMIN_FEATURE_KEYS.DASHBOARD
  },
  tenants: {
    name: "Tenants",
    key: SUPERADMIN_FEATURE_KEYS.TENANTS
  },
  "registration-invites": {
    name: "Registration Invites",
    key: SUPERADMIN_FEATURE_KEYS.REGISTRATION_INVITES
  },
  "system-notifications": {
    name: "System Notifications",
    key: SUPERADMIN_FEATURE_KEYS.SYSTEM_NOTIFICATIONS
  },
  products: {
    name: "Products",
    key: SUPERADMIN_FEATURE_KEYS.PRODUCTS
  },
  categories: {
    name: "Categories",
    key: SUPERADMIN_FEATURE_KEYS.CATEGORIES
  },
  coupons: {
    name: "Coupons",
    key: SUPERADMIN_FEATURE_KEYS.COUPONS
  },
  subscriptions: {
    name: "Subscriptions",
    key: SUPERADMIN_FEATURE_KEYS.SUBSCRIPTIONS
  },
  riders: {
    name: "Riders",
    key: SUPERADMIN_FEATURE_KEYS.RIDERS
  },
  "delivery-charges": {
    name: "Delivery Charges",
    key: SUPERADMIN_FEATURE_KEYS.DELIVERY_CHARGES
  },
  "app-versions": {
    name: "App Versions",
    key: SUPERADMIN_FEATURE_KEYS.APP_VERSIONS
  },
  "platform-fee": {
    name: "Platform Fee",
    key: SUPERADMIN_FEATURE_KEYS.PLATFORM_FEE
  },
  "tenant-earnings": {
    name: "Tenant Earnings",
    key: SUPERADMIN_FEATURE_KEYS.TENANT_EARNINGS
  },
  "rider-earnings": {
    name: "Rider Earnings",
    key: SUPERADMIN_FEATURE_KEYS.RIDER_EARNINGS
  },
  "tenant-expenses": {
    name: "Tenant Expenses",
    key: SUPERADMIN_FEATURE_KEYS.TENANT_EXPENSES
  },
  "rider-expenses": {
    name: "Rider Expenses",
    key: SUPERADMIN_FEATURE_KEYS.RIDER_EXPENSES
  },
  "free-delivery-rules": {
    name: "Free Delivery Rules",
    key: SUPERADMIN_FEATURE_KEYS.FREE_DELIVERY_RULES
  },
  "shift-slots": {
    name: "Shift Slots",
    key: SUPERADMIN_FEATURE_KEYS.SHIFT_SLOTS
  },
  zones: {
    name: "Zones",
    key: SUPERADMIN_FEATURE_KEYS.ZONES
  },
  "geo-taxonomy": {
    name: "Geo Taxonomy",
    key: SUPERADMIN_FEATURE_KEYS.GEO_TAXONOMY
  },
  "tenant-zone-config": {
    name: "Tenant Zone Config",
    key: SUPERADMIN_FEATURE_KEYS.TENANT_ZONE_CONFIG
  },
  "order-flags": {
    name: "Order Flags",
    key: SUPERADMIN_FEATURE_KEYS.ORDER_FLAGGING
  },
  ads: {
    name: "Ads",
    key: SUPERADMIN_FEATURE_KEYS.ADS
  }
}

/**
 * Sidebar features list with key, description, and isEnabled
 */
export const SUPERADMIN_FEATURES_LIST = [
  {
    key: SUPERADMIN_FEATURE_KEYS.DASHBOARD,
    description: "Main dashboard overview and analytics",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.TENANTS,
    description: "Manage restaurant tenants and their settings",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.REGISTRATION_INVITES,
    description: "Send and manage registration invitations",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.SYSTEM_NOTIFICATIONS,
    description: "System-wide notifications and announcements",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.PRODUCTS,
    description: "Manage product catalog and inventory",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.CATEGORIES,
    description: "Organize products into categories",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.COUPONS,
    description: "Create and manage discount coupons",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.SUBSCRIPTIONS,
    description: "Manage subscription plans and billing",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.RIDERS,
    description: "Manage delivery riders and assignments",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.DELIVERY_CHARGES,
    description: "Configure delivery pricing and charges",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.APP_VERSIONS,
    description: "Configure minimum app versions and force update enforcement",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.PLATFORM_FEE,
    description: "Configure Fishtownco platform commission rate",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.TENANT_EARNINGS,
    description: "View and manage tenant earnings reports",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.RIDER_EARNINGS,
    description: "Track rider earnings and payouts",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.TENANT_EXPENSES,
    description: "Monitor tenant operational expenses",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.RIDER_EXPENSES,
    description: "Track rider-related expenses",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.FREE_DELIVERY_RULES,
    description: "Configure free delivery thresholds and rules",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.SHIFT_SLOTS,
    description: "Manage rider shift scheduling",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.ZONES,
    description: "Define delivery zones and coverage areas",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.GEO_TAXONOMY,
    description: "Manage marketplace cities and areas",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.TENANT_ZONE_CONFIG,
    description: "Configure tenant-specific zone settings",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.ORDER_FLAGGING,
    description: "Review marketplace order flag cases and close investigations",
    isEnabled: true
  },
  {
    key: SUPERADMIN_FEATURE_KEYS.ADS,
    description: "Create and manage customer app ads and banners",
    isEnabled: true
  }
] as const

export const superadminFeatureFlagEnum = z.enum(SUPERADMIN_FEATURE_FLAGS)

export const isSuperadminFeatureFlag = (
  value: string
): value is SuperadminFeatureFlag =>
  superadminFeatureFlagEnum.safeParse(value).success

export type SuperadminFeatureFlag = (typeof SUPERADMIN_FEATURE_FLAGS)[number]

/**
 * Returns whether a super-admin sidebar feature is enabled for the current session.
 * Missing maps or keys stay visible so older sessions do not hide new nav items.
 * @param features - Session feature map from `/me`, or undefined before load
 * @param featureKey - Super-admin feature key to check
 * @returns True unless the feature is explicitly disabled
 */
export function isSuperadminFeatureEnabled(
  features: Record<string, boolean> | undefined,
  featureKey: SuperadminFeatureFlag
): boolean {
  return features?.[featureKey] !== false
}
