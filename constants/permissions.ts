// Default permissions - automatically granted to all authenticated users
// These are read-only/view permissions that don't need to be configured
export const DEFAULT_PERMISSIONS = [
  // Category - public read access
  "read:category",
  "list:category",
  // Product - public read access
  "read:product",
  "list:product",
  // Business - view own restaurant
  "read:business",
  "list:business",
  // Branch - view branches
  "read:branch",
  "list:branch",
  // Notifications - personal inbox for order updates
  "read:notification",
  "update:notification"
] as const

// Configurable permissions - can be assigned to roles
// Grouped by feature for easy management
export const CASH_ENTRY_PERMISSIONS = {
  read: "read:cash_entries",
  manage: "manage:cash_entries"
} as const

export const CONFIGURABLE_PERMISSIONS = {
  // Branch Management - restaurant-wide
  branches: ["create:branch", "update:branch", "delete:branch"],
  // Category Management - restaurant-wide
  categories: ["create:category", "update:category", "delete:category"],
  // Product Management - branch-specific or restaurant-wide
  products: [
    "create:product",
    "update:product",
    "delete:product",
    "list:product",
    "read:product"
  ],
  // Order Management - branch-specific
  orders: [
    "create:order",
    "read:order",
    "update:order",
    "delete:order",
    "list:order"
  ],
  // KDS Access - branch-specific
  kds: ["access:kds"],
  // Staff Management - branch-specific or restaurant-wide
  staff: [
    "create:staff",
    "read:staff",
    "update:staff",
    "delete:staff",
    "reset-password:staff",
    "list:staff"
  ],
  // Table Management - branch-specific
  tables: [
    "create:table",
    "read:table",
    "update:table",
    "delete:table",
    "list:table"
  ],
  // Raw Material Management - branch-specific
  "raw-materials": [
    "create:raw-material",
    "read:raw-material",
    "update:raw-material",
    "delete:raw-material",
    "list:raw-material"
  ],
  // Business Hours - branch-specific
  "business-hours": [
    "create:business-hours",
    "read:business-hours",
    "update:business-hours",
    "delete:business-hours",
    "list:business-hours"
  ],
  // Batch Management - tenant-wide with branch associations
  batches: [
    "create:batch",
    "read:batch",
    "update:batch",
    "delete:batch",
    "list:batch"
  ],
  suppliers: [
    "list:supplier",
    "create:supplier",
    "read:supplier",
    "update:supplier",
    "delete:supplier"
  ],
  "purchase-orders": [
    "list:purchase-order",
    "create:purchase-order",
    "read:purchase-order",
    "update:purchase-order",
    "delete:purchase-order"
  ],
  // POS Access - branch-specific
  pos: [
    "access:pos",
    CASH_ENTRY_PERMISSIONS.read,
    CASH_ENTRY_PERMISSIONS.manage
  ],
  // Restaurant Settings - restaurant-wide (admin only)
  settings: ["create:business", "update:business", "delete:business"],
  pricing_settings: ["read:pricing_settings", "update:pricing_settings"],
  // Role Management - restaurant-wide (admin only)
  roles: [
    "create:role",
    "read:role",
    "update:role",
    "delete:role",
    "list:role"
  ],
  // Tenant Management - super admin only
  tenants: [
    "create:tenant",
    "read:tenant",
    "update:tenant",
    "delete:tenant",
    "list:tenant"
  ],
  // Shift Management - branch-specific
  shifts: [
    "create:zone",
    "read:zone",
    "update:zone",
    "delete:zone",
    "list:zone",
    "create:shift-slot",
    "read:shift-slot",
    "update:shift-slot",
    "delete:shift-slot",
    "list:shift-slot",
    "manage:shifts",
    "release:shifts",
    "adjust-capacity:shifts",
    "book:shift",
    "cancel:shift",
    "check-in:shift",
    "check-out:shift",
    "list:shift",
    "view:shift-analytics",
    "view:rider-performance",
    "update:rider-performance-records",
    "auto-checkout:shifts",
    "cleanup:expired-riders",
    "mark:no-show-shifts",
    "expire:swap-requests"
  ]
} as const

// Permission groups that are typically for admin/owner only
export const ADMIN_ONLY_GROUPS = [
  "settings",
  "pricing_settings",
  "roles",
  "tenants",
  "shifts"
] as const

// Permission groups available to tenant-level roles (excludes platform-owner only)
export const TENANT_PERMISSION_GROUPS = [
  "branches",
  "categories",
  "products",
  "orders",
  "kds",
  "staff",
  "tables",
  "raw-materials",
  "business-hours",
  "batches",
  "suppliers",
  "purchase-orders",
  "pos",
  "settings",
  "pricing_settings",
  "roles",
  "shifts"
] as const

/**
 * Permission groups accepted by the role create/update API (backend ALLOWED_PERMISSION_GROUPS).
 * Excludes business-hours, tenants, shifts which the backend role validation does not accept.
 */
export const ROLE_API_PERMISSION_GROUPS = [
  "branches",
  "categories",
  "products",
  "orders",
  "kds",
  "staff",
  "tables",
  "raw-materials",
  "batches",
  "suppliers",
  "purchase-orders",
  "pos",
  "settings",
  "pricing_settings",
  "roles"
] as const

/** Permissions that can be sent to the role API (must match backend validation). */
export const ROLE_API_ALLOWED_PERMISSIONS = ROLE_API_PERMISSION_GROUPS.flatMap(
  (group) => CONFIGURABLE_PERMISSIONS[group]
) as readonly string[]

// Flatten all configurable permissions for validation
export const CONFIGURABLE_PERMISSIONS_LIST = Object.values(
  CONFIGURABLE_PERMISSIONS
).flat()

const defaultPermissionSet = new Set<string>(DEFAULT_PERMISSIONS)

// All permissions combined (unique; products group repeats read/list from defaults — Postgres enums forbid duplicate labels)
export const PERMISSIONS = [
  ...DEFAULT_PERMISSIONS,
  ...CONFIGURABLE_PERMISSIONS_LIST.filter((p) => !defaultPermissionSet.has(p))
] as const

export type Permission = (typeof PERMISSIONS)[number]
export type ConfigurablePermission =
  (typeof CONFIGURABLE_PERMISSIONS_LIST)[number]
export type DefaultPermission = (typeof DEFAULT_PERMISSIONS)[number]
export type PermissionGroup = keyof typeof CONFIGURABLE_PERMISSIONS
