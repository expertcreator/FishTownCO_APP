import { PERMISSIONS } from "./permissions"

export type PredefinedRoleKey =
  | "owner"
  | "manager"
  | "staff"
  | "read_only"
  | "platform_admin"
  | "support_staff"

export interface PredefinedRoleDefinition {
  key: PredefinedRoleKey
  name: { en: string; ar: string; ur: string }
  permissions: (typeof PERMISSIONS)[number][]
  canCreateAllRoles: boolean
}

const ALL_PERMISSIONS: (typeof PERMISSIONS)[number][] = [...PERMISSIONS]

export const PREDEFINED_ROLE_DEFINITIONS: readonly PredefinedRoleDefinition[] =
  [
    {
      key: "owner",
      name: { en: "Owner", ar: "مالک", ur: "Malik" },
      permissions: ALL_PERMISSIONS,
      canCreateAllRoles: true
    },
    {
      key: "manager",
      name: { en: "Manager", ar: "منیجر", ur: "Manager" },
      permissions: [
        // Categories
        "create:category",
        "update:category",
        "delete:category",
        "read:category",
        "list:category",
        // Products
        "create:product",
        "update:product",
        "delete:product",
        "read:product",
        "list:product",
        // Orders
        "create:order",
        "read:order",
        "update:order",
        "delete:order",
        "list:order",
        // POS & cash — managers need to supervise/open sessions
        "access:pos",
        "read:cash_entries",
        "manage:cash_entries",
        // Tables
        "create:table",
        "read:table",
        "update:table",
        "delete:table",
        "list:table",
        // Branch visibility
        "read:branch",
        "list:branch",
        // Business read
        "read:business",
        "list:business",
        "read:pricing_settings",
        "update:pricing_settings",
        // Raw Material / Inventory
        "create:raw-material",
        "read:raw-material",
        "update:raw-material",
        "delete:raw-material",
        "list:raw-material",
        // Batches
        "create:batch",
        "read:batch",
        "update:batch",
        "delete:batch",
        "list:batch",
        // Suppliers
        "list:supplier",
        "create:supplier",
        "read:supplier",
        "update:supplier",
        "delete:supplier",
        // Purchase Orders
        "list:purchase-order",
        "create:purchase-order",
        "read:purchase-order",
        "update:purchase-order",
        "delete:purchase-order"
      ],
      canCreateAllRoles: false
    },
    {
      key: "staff",
      name: { en: "Staff", ar: "عملہ", ur: "Staff" },
      permissions: [
        // Orders — core job
        "create:order",
        "read:order",
        "update:order",
        "list:order",
        // Menu visibility
        "read:product",
        "list:product",
        "update:product",
        "read:category",
        "list:category",
        // POS access
        "access:pos",
        "read:cash_entries",
        // Tables — needed for table-based ordering
        "read:table",
        "list:table",
        // Branch — needs to know which branch they're in
        "read:branch",
        "list:branch"
      ],
      canCreateAllRoles: false
    },
    {
      key: "read_only",
      name: { en: "Read-Only", ar: "صرف دیکھیں", ur: "Sirf dekhein" },
      permissions: [
        "read:business",
        "list:business",
        "read:branch",
        "list:branch",
        "read:order",
        "list:order",
        "read:product",
        "list:product",
        "read:category",
        "list:category"
      ],
      canCreateAllRoles: false
    },
    {
      key: "platform_admin",
      name: {
        en: "Platform Admin",
        ar: "پلیٹ فارم ایڈمن",
        ur: "Platform admin"
      },
      permissions: ALL_PERMISSIONS,
      canCreateAllRoles: true
    },
    {
      key: "support_staff",
      name: { en: "Support Staff", ar: "سپورٹ عملہ", ur: "Support staff" },
      permissions: [
        "read:tenant",
        "list:tenant",
        "read:business",
        "list:business"
      ],
      canCreateAllRoles: false
    }
  ] as const

export function buildPredefinedRolesForTenant(tenantId: string): {
  tenantId: string
  roleType: "tenant"
  isPredefined: true
  name: { en: string; ar: string; ur: string }
  permissions: (typeof PERMISSIONS)[number][]
  canCreateAllRoles: boolean
}[] {
  return PREDEFINED_ROLE_DEFINITIONS.map((definition) => ({
    tenantId,
    roleType: "tenant",
    isPredefined: true,
    name: definition.name,
    permissions: [...definition.permissions],
    canCreateAllRoles: definition.canCreateAllRoles
  }))
}
