import { z } from "zod"

export function typedValues<T extends Record<PropertyKey, unknown>>(obj: T) {
  return Object.values(obj) as T[keyof T][]
}

type UnionToIntersection<U> = (
  U extends unknown
    ? (x: U) => void
    : never
) extends (x: infer I) => void
  ? I
  : never

type LastOf<U> =
  UnionToIntersection<U extends unknown ? () => U : never> extends () => infer R
    ? R
    : never

export type UnionToArray<U, Last = LastOf<U>> = [U] extends [never]
  ? []
  : [...UnionToArray<Exclude<U, Last>>, Last]

// ===========================================================================
// LANGUAGE CONSTANTS
// ===========================================================================

// Supported language codes for multilingual content
export const SUPPORTED_LANGUAGES = ["en", "ar", "ur"] as const
export type Locale = (typeof SUPPORTED_LANGUAGES)[number]

// Zod enum for validation
export const languageEnum = z.enum(SUPPORTED_LANGUAGES)

// ============================================================================
// BUSINESS CONSTANTS
// ============================================================================

// Business status options
// Admin-controlled status (system approval flow)
export const BUSINESS_ADMIN_STATUS = [
  "idle",
  "pending",
  "approved",
  "rejected",
  "skipped"
] as const
export type BusinessAdminStatus = (typeof BUSINESS_ADMIN_STATUS)[number]
export const businessAdminStatusEnum = z.enum(BUSINESS_ADMIN_STATUS)

// Tenant-controlled status (operational status, only after approval)
export const BUSINESS_TENANT_STATUS = ["active", "inactive"] as const
export type BusinessTenantStatus = (typeof BUSINESS_TENANT_STATUS)[number]
export const businessTenantStatusEnum = z.enum(BUSINESS_TENANT_STATUS)

// Tenant types
export const TENANT_TYPES = ["business", "branch"] as const

// Where a tenant sells on (channels). DB/store: single value "marketplace" | "pos" | "hybrid".
export const SELL_ON = ["marketplace", "pos", "hybrid"] as const
export type SellOn = (typeof SELL_ON)[number]
export const sellOnEnum = z.enum(SELL_ON)

export const ORDER_FULFILLMENT = ["delivery", "pickup", "hybrid"] as const
export type OrderFulfillment = (typeof ORDER_FULFILLMENT)[number]
export const orderFulfillmentEnum = z.enum(ORDER_FULFILLMENT)

// Form-only: user picks marketplace and/or pos; selecting both sends "hybrid" to API.
export const SELL_ON_CHANNELS = ["marketplace", "pos"] as const
export type SellOnChannel = (typeof SELL_ON_CHANNELS)[number]

/** Receipt/print logo is required when tenant sells on POS (including hybrid). */
export const sellOnRequiresPrintLogo = (sellOn: SellOn): boolean =>
  sellOn === "pos" || sellOn === "hybrid"

/** Products shown in customer marketplace discovery, cart, checkout, and search (excludes POS-only). */
export const PRODUCT_SELL_ON_FOR_MARKETPLACE = [
  "marketplace",
  "hybrid"
] as const satisfies readonly SellOn[]

// Business hours – days of the week
export const DAY_OF_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
] as const
export type DayOfWeek = (typeof DAY_OF_WEEK)[number]
export const dayOfWeekEnum = z.enum(DAY_OF_WEEK)

// Daypart menus – locked restaurant-wide slugs (backend-enforced)
export const DAYPART_MENU_SLUGS = [
  "morning",
  "noon",
  "evening",
  "dinner"
] as const
export type DaypartMenuSlug = (typeof DAYPART_MENU_SLUGS)[number]
export const daypartMenuSlugEnum = z.enum(DAYPART_MENU_SLUGS)

// Onboarding steps (order matters for progress)
export const ONBOARDING_STEPS = [
  "branches",
  "schedule",
  "products",
  "deals"
] as const
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]
export const onboardingStepEnum = z.enum(ONBOARDING_STEPS)

// ============================================================================
// USER CONSTANTS
// ============================================================================

// User roles
export const USER_TYPES = [
  "super_admin",
  "customer",
  "staff",
  "rider",
  "chef"
] as const
export type UserType = (typeof USER_TYPES)[number]
export const userTypeEnum = z.enum(USER_TYPES)

// Named constants for user types (resilient to array reordering)
export const USER_TYPE_SUPER_ADMIN = "super_admin" as const
export const USER_TYPE_CUSTOMER = "customer" as const
export const USER_TYPE_STAFF = "staff" as const
export const USER_TYPE_RIDER = "rider" as const
export const USER_TYPE_CHEF = "chef" as const

/** Roles allowed on public customer-app auth endpoints (`/customers/signup-login`, `/customers/social-signin`). Used by `PublicCustomerRoleSchema` in `shared/validation/auth.schema.ts`. */
export const CUSTOMER_PUBLIC_AUTH_ROLES = ["customer", "rider"] as const
export type CustomerPublicAuthRole = (typeof CUSTOMER_PUBLIC_AUTH_ROLES)[number]

// ============================================================================
// DRIVER VERIFICATION CONSTANTS
// ============================================================================

// Verification steps
export const VERIFICATION_STEPS = ["1", "2", "3", "4", "5", "6"] as const
export type VerificationStep = (typeof VERIFICATION_STEPS)[number]
export const verificationStepEnum = z.enum(VERIFICATION_STEPS)

// Document status
export const DOCUMENT_STATUS = ["pending", "approved", "rejected"] as const
export type DocumentStatus = (typeof DOCUMENT_STATUS)[number]
export const documentStatusEnum = z.enum(DOCUMENT_STATUS)

// Overall verification status
export const VERIFICATION_STATUS = [
  "incomplete",
  "pending_review",
  "approved",
  "rejected",
  "suspended"
] as const
export type VerificationStatus = (typeof VERIFICATION_STATUS)[number]
export const verificationStatusEnum = z.enum(VERIFICATION_STATUS)

export const VERIFICATION_STATUS_IMAGES = [
  "profileImage",
  "cnicFrontImage",
  "cnicBackImage",
  "licenseImage",
  "policeVerificationImage",
  "utilityBillImage",
  "bankAccountProfileImage"
] as const
export type VerificationStatusImage =
  (typeof VERIFICATION_STATUS_IMAGES)[number]
export const verificationStatusImageEnum = z.enum(VERIFICATION_STATUS_IMAGES)

// ============================================================================
// PRODUCT CONSTANTS
// ============================================================================

// Product status
export const PRODUCT_STATUS = ["active", "inactive"] as const
export type ProductStatus = (typeof PRODUCT_STATUS)[number]
export const productStatusEnum = z.enum(PRODUCT_STATUS)

// Product Admin Status
export const PRODUCT_ADMIN_STATUS = [
  "approved",
  "rejected",
  "pending_approval"
] as const
export type ProductAdminStatus = (typeof PRODUCT_ADMIN_STATUS)[number]
export const productAdminStatusEnum = z.enum(PRODUCT_ADMIN_STATUS)

/** Reasons a Marketplace/Hybrid deal may be hidden from customer discovery. */
export const DEAL_VISIBILITY_ISSUE_CODES = [
  "deal_inactive",
  "deal_not_approved",
  "deal_not_started",
  "deal_expired",
  "category_not_marketplace_visible",
  "no_products",
  "no_inventory",
  "deal_inventory_inactive",
  "deal_out_of_stock",
  "branch_not_active",
  "branch_not_approved",
  "branch_not_sold_on_marketplace",
  "business_not_active",
  "business_not_approved",
  "business_not_sold_on_marketplace",
  "empty_product_group",
  "constituent_out_of_stock"
] as const
export type DealVisibilityIssueCode =
  (typeof DEAL_VISIBILITY_ISSUE_CODES)[number]
export const dealVisibilityIssueCodeEnum = z.enum(DEAL_VISIBILITY_ISSUE_CODES)

// ============================================================================
// ORDER CONSTANTS
// ============================================================================

// Order status
export const ORDER_STATUS = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
  "on_hold",
  "rejected"
] as const
export type OrderStatus = (typeof ORDER_STATUS)[number]
export const orderStatusEnum = z.enum(ORDER_STATUS)

/** How the last accept/reject/status change happened. */
export const ORDER_CHANNELS = ["system", "whatsapp"] as const
export type OrderChannel = (typeof ORDER_CHANNELS)[number]
export const orderChannelEnum = z.enum(ORDER_CHANNELS)

/** Terminal statuses that unlock order flagging (mirrors post-fulfillment review window). */
export const ORDER_FLAG_TERMINAL_STATUSES = [
  "completed",
  "cancelled",
  "rejected"
] as const satisfies readonly OrderStatus[]

export const ORDER_FLAG_WINDOW_DAYS = 7 as const

export const CUSTOMER_FLAG_REASONS = [
  "incorrect_item",
  "missing_item",
  "quality_issue",
  "damaged_item",
  "wrong_order",
  "rider_issue",
  "other"
] as const
export type CustomerFlagReason = (typeof CUSTOMER_FLAG_REASONS)[number]

export const TENANT_FLAG_REASONS = [
  "inappropriate_behaviour",
  "unnecessary_conflict",
  "suspected_fraud",
  "false_information",
  "abusive_language",
  "rider_issue",
  "other"
] as const
export type TenantFlagReason = (typeof TENANT_FLAG_REASONS)[number]

export const RIDER_FLAG_REASONS = [
  "customer_unavailable",
  "unsafe_location",
  "incorrect_address",
  "customer_abusive",
  "tenant_delay",
  "wrong_handover",
  "other"
] as const
export type RiderFlagReason = (typeof RIDER_FLAG_REASONS)[number]

export const ORDER_FLAG_STATUS = [
  "submitted",
  "under_review",
  "resolved",
  "dismissed"
] as const
export type OrderFlagStatus = (typeof ORDER_FLAG_STATUS)[number]
export const orderFlagStatusZodEnum = z.enum(ORDER_FLAG_STATUS)
/** Frontend alias (same zod enum). */
export const orderFlagStatusEnum = orderFlagStatusZodEnum

/** Open (unresolved) order-flag statuses — usable for filters / badges; list default shows all. */
export const ORDER_FLAG_OPEN_STATUSES = [
  "submitted",
  "under_review"
] as const satisfies readonly OrderFlagStatus[]

export const FLAG_REPORTER_TYPES = ["customer", "tenant", "rider"] as const
export type FlagReporterType = (typeof FLAG_REPORTER_TYPES)[number]
export const flagReporterTypeZodEnum = z.enum(FLAG_REPORTER_TYPES)
export const flagReporterTypeEnum = flagReporterTypeZodEnum

export const FLAG_PARTY_TYPES = ["customer", "tenant", "rider"] as const
export type FlagPartyType = (typeof FLAG_PARTY_TYPES)[number]
export const flagPartyTypeZodEnum = z.enum(FLAG_PARTY_TYPES)
export const flagPartyTypeEnum = flagPartyTypeZodEnum

export const FLAG_RESPONSIBLE_PARTIES = [
  "customer",
  "tenant",
  "rider",
  "both",
  "none"
] as const
export type FlagResponsibleParty = (typeof FLAG_RESPONSIBLE_PARTIES)[number]
export const flagResponsiblePartyZodEnum = z.enum(FLAG_RESPONSIBLE_PARTIES)
export const flagResponsiblePartyEnum = flagResponsiblePartyZodEnum

export const ORDER_FLAG_EVENT_TYPES = [
  "created",
  "status_change",
  "note",
  "mistake_assigned",
  "closed"
] as const
export type OrderFlagEventType = (typeof ORDER_FLAG_EVENT_TYPES)[number]

export const ORDER_FLAG_CLOSE_RESOLUTIONS = ["resolved", "dismissed"] as const
export type OrderFlagCloseResolution =
  (typeof ORDER_FLAG_CLOSE_RESOLUTIONS)[number]

/** Reason codes available to each reporter type when submitting a flag. */
export const ORDER_FLAG_REASONS_BY_REPORTER = {
  customer: CUSTOMER_FLAG_REASONS,
  tenant: TENANT_FLAG_REASONS,
  rider: RIDER_FLAG_REASONS
} as const satisfies Record<FlagReporterType, readonly string[]>

export const ORDER_STATUS_SUPER_ADMIN_UPDATE_OPTIONS = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled"
] as const satisfies readonly OrderStatus[]

export const DELIVERY_PROVIDER = [
  "own_rider",
  "platform_rider",
  "customer_pickup"
] as const
export type DeliveryProvider = (typeof DELIVERY_PROVIDER)[number]
export const deliveryProviderEnum = z.enum(DELIVERY_PROVIDER)

/** Non-deleted orders in any of these states prevent tenant (business) soft-delete. */
export const ORDER_STATUSES_BLOCKING_TENANT_DELETE = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "on_hold"
] as const satisfies readonly OrderStatus[]

// Payment status
export const PAYMENT_STATUS = ["pending", "paid", "failed", "refunded"] as const
export type PaymentStatus = (typeof PAYMENT_STATUS)[number]
export const paymentStatusEnum = z.enum(PAYMENT_STATUS)

// Payment methods
export const PAYMENT_METHODS = [
  "cash",
  "card",
  "wallet",
  "online",
  "jazzcash",
  "bank_transfer",
  "easypaisa",
  "nayapay"
] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export const paymentMethodEnum = z.enum(PAYMENT_METHODS)

/**
 * Canonical cash-entry categories stored on branch cash movements.
 * Shared by every backend, web, and mobile repo via this constants pin.
 */
export const CASH_ENTRY_CATEGORIES = [
  "owner_cash_in",
  "float_added",
  "cash_in_misc",
  "supplier_payment",
  "debt_returned",
  "expense_misc",
  "owner_cash_out",
  "bank_deposit",
  "staff_advance",
  "correction"
] as const
export type CashEntryCategory = (typeof CASH_ENTRY_CATEGORIES)[number]
export const cashEntryCategoryEnum = z.enum(CASH_ENTRY_CATEGORIES)

export const CASH_ENTRY_IN_CATEGORIES = [
  "owner_cash_in",
  "float_added",
  "cash_in_misc"
] as const satisfies readonly CashEntryCategory[]

export const CASH_ENTRY_OUT_CATEGORIES = [
  "supplier_payment",
  "debt_returned",
  "expense_misc",
  "owner_cash_out",
  "bank_deposit",
  "staff_advance"
] as const satisfies readonly CashEntryCategory[]

export const CASH_ENTRY_PNL_CATEGORIES = [
  "cash_in_misc",
  "supplier_payment",
  "debt_returned",
  "expense_misc",
  "correction"
] as const satisfies readonly CashEntryCategory[]

export const CASH_ENTRY_LINKED_USER_CATEGORIES = [
  "staff_advance"
] as const satisfies readonly CashEntryCategory[]

export const REVISION_STATUS = [
  "revision_pending",
  "revision_approved",
  "revision_rejected",
  "revision_expired"
] as const
export type RevisionStatus = (typeof REVISION_STATUS)[number]
export const revisionStatusEnum = z.enum(REVISION_STATUS)

// Order types
export const ORDER_TYPES = ["DineIn", "TakeAway", "Delivery"] as const
export type OrderType = (typeof ORDER_TYPES)[number]
export const orderTypeEnum = z.enum(ORDER_TYPES)

export const USER_BLOCK_REASON_CODES = [
  "ORDER_NOT_PICKED_UP",
  "FRAUD",
  "POLICY_VIOLATION",
  "SUSPICIOUS_ACTIVITY",
  "OTHER"
] as const
export const ORDER_REJECTION_REASONS = [
  "At capacity",
  "Item unavailable",
  "Closing early",
  "Technical issue",
  "Other"
] as const
export const orderRejectionReasonEnum = z.enum(ORDER_REJECTION_REASONS)
export type OrderRejectionReason = (typeof ORDER_REJECTION_REASONS)[number]

/** Admin-initiated block reasons (excludes automated ORDER_NOT_PICKED_UP). */
export const ADMIN_INITIATED_BLOCK_REASONS = [
  "FRAUD",
  "POLICY_VIOLATION",
  "SUSPICIOUS_ACTIVITY",
  "OTHER"
] as const
export type AdminInitiatedBlockReason =
  (typeof ADMIN_INITIATED_BLOCK_REASONS)[number]
export const adminInitiatedBlockReasonEnum = z.enum(
  ADMIN_INITIATED_BLOCK_REASONS
)

export const ORDER_CANCELLATION_REASONS = [
  "ORDER_NOT_PICKED_UP",
  "ORDER_ALREADY_REJECTED",
  "CUSTOMER_REQUESTED",
  "TENANT_NOT_AVAILABLE",
  "OUT_OF_STOCK",
  "DUPLICATE_ORDER",
  "OUTSIDE_OPERATING_HOURS",
  "PAYMENT_FAILED",
  "OTHER"
] as const
export type OrderCancellationReason =
  (typeof ORDER_CANCELLATION_REASONS)[number]
export const orderCancellationReasonEnum = z.enum(ORDER_CANCELLATION_REASONS)
export const CANCELLATION_REASON_LABEL = {
  ORDER_NOT_PICKED_UP: "cancellation-reason-order-not-picked-up",
  ORDER_ALREADY_REJECTED: "cancellation-reason-order-already-rejected",
  CUSTOMER_REQUESTED: "cancellation-reason-customer-requested",
  TENANT_NOT_AVAILABLE: "cancellation-reason-tenant-not-available",
  OUT_OF_STOCK: "cancellation-reason-out-of-stock",
  DUPLICATE_ORDER: "cancellation-reason-duplicate-order",
  OUTSIDE_OPERATING_HOURS: "cancellation-reason-outside-operating-hours",
  PAYMENT_FAILED: "cancellation-reason-payment-failed",
  OTHER: "cancellation-reason-other"
} as const satisfies Record<OrderCancellationReason, string>

/** Customer-app home delivery (needs address / rider), not marketplace pickup. */
export function isMarketplaceDeliveryOrder(order: {
  isOnlineOrder: boolean
  orderType: string
}): boolean {
  return order.isOnlineOrder === true && order.orderType === "Delivery"
}

// Delivery status
export const DELIVERY_STATUS = [
  "assigned",
  "picked_up",
  "on_the_way",
  "delivered",
  "cancelled",
  "delivery_failed"
] as const
export type DeliveryStatus = (typeof DELIVERY_STATUS)[number]
export const deliveryStatusEnum = z.enum(DELIVERY_STATUS)

export const RIDER_DELIVERY_FAILURE_REASONS = [
  "CUSTOMER_UNREACHABLE",
  "CUSTOMER_NOT_AVAILABLE",
  "WRONG_ADDRESS",
  "AREA_UNREACHABLE",
  "VEHICLE_ISSUE",
  "ORDER_DAMAGED",
  "SAFETY_CONCERN"
] as const
export type RiderDeliveryFailureReason =
  (typeof RIDER_DELIVERY_FAILURE_REASONS)[number]
export const riderDeliveryFailureReasonEnum = z.enum(
  RIDER_DELIVERY_FAILURE_REASONS
)

// Rider order display statuses (for UI display)
export const RIDER_ORDER_DISPLAY_STATUS = {
  PENDING: "Pending",
  PICKING: "Picking",
  DELIVERING: "Delivering",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
} as const
export type RiderOrderDisplayStatus =
  (typeof RIDER_ORDER_DISPLAY_STATUS)[keyof typeof RIDER_ORDER_DISPLAY_STATUS]

// Rider order status colors (for UI display)
export const RIDER_ORDER_STATUS_COLORS = {
  LIGHT_RED: "light-red",
  LIGHT_GREEN: "light-green",
  LIGHT_BLUE: "light-blue",
  GREEN: "green"
} as const
export type RiderOrderStatusColor =
  (typeof RIDER_ORDER_STATUS_COLORS)[keyof typeof RIDER_ORDER_STATUS_COLORS]

// Rider order list filter statuses
export const RIDER_ORDER_FILTER_STATUS = {
  ALL: "all",
  PENDING: "pending",
  PICKING: "picking",
  DELIVERING: "delivering",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
} as const
export type RiderOrderFilterStatus =
  (typeof RIDER_ORDER_FILTER_STATUS)[keyof typeof RIDER_ORDER_FILTER_STATUS]

// Default values for rider service
export const RIDER_DEFAULTS = {
  CUSTOMER_NAME: "Customer",
  DEFAULT_LOCATION: "Jordan",
  DISTANCE_UNAVAILABLE: "N/A"
} as const

// Unavailable product actions
export const UNAVAILABLE_PRODUCT_ACTIONS = ["remove", "call", "cancel"] as const
export type UnavailableProductAction =
  (typeof UNAVAILABLE_PRODUCT_ACTIONS)[number]
export const unavailableProductActionEnum = z.enum(UNAVAILABLE_PRODUCT_ACTIONS)

// Order tracking timeline statuses
export const ORDER_TIMELINE_STATUS = [
  "order_placed",
  "in_progress",
  "shipping",
  "delivered"
] as const
export type OrderTimelineStatus = (typeof ORDER_TIMELINE_STATUS)[number]
export const orderTimelineStatusEnum = z.enum(ORDER_TIMELINE_STATUS)

// ============================================================================
// PAGINATION CONSTANTS
// ============================================================================

// Default pagination values
export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_PAGE: 0,
  MIN_LIMIT: 1
} as const

// ============================================================================
// FILE UPLOAD CONSTANTS
// ============================================================================

// File upload limits
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 1,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf", "text/plain"]
} as const

export const FILE_UPLOAD_FOLDERS = [
  "tenants",
  "categories",
  "products",
  "profiles",
  "driver_documents",
  "tenant_payout_proofs",
  "order_flags",
  "ads"
] as const

export type FileUploadFolder = (typeof FILE_UPLOAD_FOLDERS)[number]
export const fileUploadFolderEnum = z.enum(FILE_UPLOAD_FOLDERS)

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

// String length limits
export const STRING_LIMITS = {
  NAME_MIN: 1,
  NAME_MAX: 255,
  DESCRIPTION_MIN: 1,
  DESCRIPTION_MAX: 1000,
  EMAIL_MAX: 320,
  PHONE_MAX: 20,
  SKU_MAX: 255,
  IMAGE_URL_MAX: 255,
  SEARCH_MAX: 200
} as const

// Number limits
export const NUMBER_LIMITS = {
  PRICE_MIN: 0,
  PRICE_MAX: 999_999.99,
  LATITUDE_MIN: -90,
  LATITUDE_MAX: 90,
  LONGITUDE_MIN: -180,
  LONGITUDE_MAX: 180,
  POSITION_MIN: 0,
  RADIUS_MAX: 30
} as const

// ============================================================================
// API CONSTANTS
// ============================================================================

// API version
export const API_VERSION = "v1" as const

// Rate limiting
export const RATE_LIMIT = {
  MAX_REQUESTS: 100,
  TIME_WINDOW: "1 minute"
} as const

// CORS settings
export const CORS = {
  DEFAULT_ORIGIN: ["http://localhost:3000", "http://localhost:3001"],
  ALLOWED_METHODS: [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "OPTIONS"
  ] as string[],
  ALLOWED_HEADERS: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Accept-Language",
    "x-locale",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers"
  ] as string[]
} as const

// ============================================================================
// ERROR CONSTANTS
// ============================================================================

// Error messages for consistent error handling
export const ERROR_MESSAGES = {
  // Authentication & Authorization
  UNAUTHORIZED: "UNAUTHORIZED",
  TENANT_SUSPENDED: "TENANT_SUSPENDED",
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  ACCESS_DENIED: "ACCESS_DENIED",
  ALREADY_LOGGED_IN: "ALREADY_LOGGED_IN",
  USER_BLOCKED: "USER_BLOCKED",
  INVALID_EMAIL_OR_PASSWORD: "INVALID_EMAIL_OR_PASSWORD",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  PASSWORDS_DO_NOT_MATCH: "PASSWORDS_DO_NOT_MATCH",
  INVALID_OR_EXPIRED_REFRESH_TOKEN: "INVALID_OR_EXPIRED_REFRESH_TOKEN",
  INVALID_OR_EXPIRED_SESSION: "INVALID_OR_EXPIRED_SESSION",
  INVALID_OTP: "INVALID_OTP",
  EXPIRED_OTP: "EXPIRED_OTP",
  // Account deletion / credential gate errors
  MISSING_CREDENTIAL: "MISSING_CREDENTIAL",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  OTP_EXPIRED: "OTP_EXPIRED",
  NO_EMAIL_ON_FILE: "NO_EMAIL_ON_FILE",
  PLEASE_TRY_AGAIN_IN_30_SECONDS: "PLEASE_TRY_AGAIN_IN_30_SECONDS",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  PLEASE_TRY_AGAIN_IN_2_MINUTES: "PLEASE_TRY_AGAIN_IN_2_MINUTES",
  INVALID_OR_EXPIRED_RESET_TOKEN: "INVALID_OR_EXPIRED_RESET_TOKEN",
  REGISTRATION_TOKEN_ALREADY_USED: "REGISTRATION_TOKEN_ALREADY_USED",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  REDIS_CLIENT_UNAVAILABLE: "REDIS_CLIENT_UNAVAILABLE",
  SIGNUP_SESSION_EXPIRED: "SIGNUP_SESSION_EXPIRED",
  TENANT_REGISTRATION_SESSION_EXPIRED: "TENANT_REGISTRATION_SESSION_EXPIRED",
  SOCIAL_LOGIN_REQUIRED: "SOCIAL_LOGIN_REQUIRED",
  SUPER_ADMIN_ACCESS_REQUIRED: "SUPER_ADMIN_ACCESS_REQUIRED",
  PHONE_NUMBER_ALREADY_VERIFIED: "PHONE_NUMBER_ALREADY_VERIFIED",
  // Customer related
  CUSTOMER_ACCESS_DENIED: "CUSTOMER_ACCESS_DENIED",
  CUSTOMER_LOGIN_DENIED: "CUSTOMER_LOGIN_DENIED",
  CUSTOMER_ACCOUNT_NOT_FOUND: "CUSTOMER_ACCOUNT_NOT_FOUND",
  CUSTOMER_SIGNUP_FAILED: "CUSTOMER_SIGNUP_FAILED",
  GUEST_USERS_MUST_LOGIN_TO_PLACE_ORDER:
    "GUEST_USERS_MUST_LOGIN_TO_PLACE_ORDER",
  CHECKOUT_PHONE_REQUIRED: "CHECKOUT_PHONE_REQUIRED",
  CHECKOUT_PHONE_NOT_VERIFIED: "CHECKOUT_PHONE_NOT_VERIFIED",
  ACCOUNT_ALREADY_DELETED: "ACCOUNT_ALREADY_DELETED",
  CUSTOMER_HAS_ACTIVE_ORDERS: "CUSTOMER_HAS_ACTIVE_ORDERS",
  RIDER_HAS_ACTIVE_SHIFT_BOOKINGS: "RIDER_HAS_ACTIVE_SHIFT_BOOKINGS",
  RIDER_HAS_ACTIVE_SHIFT_ATTENDANCE: "RIDER_HAS_ACTIVE_SHIFT_ATTENDANCE",
  RIDER_HAS_ACTIVE_DELIVERIES: "RIDER_HAS_ACTIVE_DELIVERIES",
  RIDER_HAS_ACTIVE_SHIFT_SWAPS: "RIDER_HAS_ACTIVE_SHIFT_SWAPS",

  // RBAC related
  PERMISSION_NOT_FOUND: "PERMISSION_NOT_FOUND",
  PERMISSION_ACCESS_DENIED: "PERMISSION_ACCESS_DENIED",
  PERMISSION_UPDATE_DENIED: "PERMISSION_UPDATE_DENIED",
  PERMISSION_DELETE_DENIED: "PERMISSION_DELETE_DENIED",
  PERMISSION_CREATE_DENIED: "PERMISSION_CREATE_DENIED",
  PERMISSION_LIST_DENIED: "PERMISSION_LIST_DENIED",
  INVALID_PERMISSION: "INVALID_PERMISSION",

  // Role related
  ROLE_NOT_FOUND: "ROLE_NOT_FOUND",
  ROLE_ACCESS_DENIED: "ROLE_ACCESS_DENIED",
  ROLE_UPDATE_DENIED: "ROLE_UPDATE_DENIED",
  ROLE_DELETE_DENIED: "ROLE_DELETE_DENIED",
  ROLE_CREATE_DENIED: "ROLE_CREATE_DENIED",
  ROLE_LIST_DENIED: "ROLE_LIST_DENIED",
  ROLE_HAS_USERS: "ROLE_HAS_USERS",

  // Business related
  BUSINESS_NOT_FOUND: "BUSINESS_NOT_FOUND",
  BUSINESS_ACCESS_DENIED: "BUSINESS_ACCESS_DENIED",
  BUSINESS_UPDATE_DENIED: "BUSINESS_UPDATE_DENIED",
  BUSINESS_DELETE_DENIED: "BUSINESS_DELETE_DENIED",
  TENANT_DELETE_BLOCKED_BY_RUNNING_ORDERS:
    "TENANT_DELETE_BLOCKED_BY_RUNNING_ORDERS",
  TENANT_SELL_ON_CHANGE_BLOCKED_BY_RUNNING_ORDERS:
    "TENANT_SELL_ON_CHANGE_BLOCKED_BY_RUNNING_ORDERS",
  TENANT_HAS_PENDING_PAYOUTS: "TENANT_HAS_PENDING_PAYOUTS",
  BUSINESS_CREATE_DENIED: "BUSINESS_CREATE_DENIED",
  BUSINESS_CREATE_FAILED: "BUSINESS_CREATE_FAILED",
  BUSINESS_LIST_DENIED: "BUSINESS_LIST_DENIED",
  BUSINESS_NOT_APPROVED: "BUSINESS_NOT_APPROVED",

  // Branch/Staff related
  INVALID_BRANCH_ID: "INVALID_BRANCH_ID",
  BRANCH_DOES_NOT_BELONG_TO_TENANT: "BRANCH_DOES_NOT_BELONG_TO_TENANT",
  BUSINESS_STATUS_UPDATE_DENIED: "BUSINESS_STATUS_UPDATE_DENIED",
  BUSINESS_APPROVAL_REQUIRED: "BUSINESS_APPROVAL_REQUIRED",
  BUSINESS_SKIP_AFTER_APPROVAL: "BUSINESS_SKIP_AFTER_APPROVAL",
  TENANT_ADMIN_ONLY: "TENANT_ADMIN_ONLY",
  TENANT_COORDINATES_REQUIRED: "TENANT_COORDINATES_REQUIRED",
  OUTSIDE_DELIVERY_RADIUS: "OUTSIDE_DELIVERY_RADIUS",
  OUTSIDE_ONBOARDING_RADIUS: "OUTSIDE_ONBOARDING_RADIUS",
  DELIVERY_RADIUS_EXCEEDS_ONBOARDING_RADIUS:
    "DELIVERY_RADIUS_EXCEEDS_ONBOARDING_RADIUS",
  OUTSIDE_COVERAGE_ZONE: "OUTSIDE_COVERAGE_ZONE",
  TENANT_ALREADY_HAS_MARKETPLACE: "TENANT_ALREADY_HAS_MARKETPLACE",
  TENANT_POS_ONLY_REQUIRED: "TENANT_POS_ONLY_REQUIRED",
  NO_PENDING_MARKETPLACE_REQUEST: "NO_PENDING_MARKETPLACE_REQUEST",
  TENANT_STATE_CONFLICT: "TENANT_STATE_CONFLICT",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  TENANT_NAME_ALREADY_TAKEN: "TENANT_NAME_ALREADY_TAKEN",
  TENANT_SLUG_ALREADY_TAKEN: "TENANT_SLUG_ALREADY_TAKEN",
  ACTIVE_TENANT_EMAIL_ALREADY_EXISTS: "ACTIVE_TENANT_EMAIL_ALREADY_EXISTS",
  MARKETPLACE_PRODUCTS_REQUIRED: "MARKETPLACE_PRODUCTS_REQUIRED",
  MARKETPLACE_PRODUCTS_NOT_FOUND: "MARKETPLACE_PRODUCTS_NOT_FOUND",
  STAFF_ROLE_REQUIRED: "STAFF_ROLE_REQUIRED",
  INVALID_ROLE_ID: "INVALID_ROLE_ID",
  STAFF_NOT_FOUND: "STAFF_NOT_FOUND",
  STAFF_NOT_ACTIVE: "STAFF_NOT_ACTIVE",
  STAFF_EMAIL_REQUIRED: "STAFF_EMAIL_REQUIRED",
  FAILED_TO_FETCH_CREATED_STAFF: "FAILED_TO_FETCH_CREATED_STAFF",
  INVALID_VERIFICATION_STEP: "INVALID_VERIFICATION_STEP",
  DRIVER_VERIFICATION_NOT_FOUND: "DRIVER_VERIFICATION_NOT_FOUND",
  DRIVER_VERIFICATION_STEPS_INCOMPLETE: "DRIVER_VERIFICATION_STEPS_INCOMPLETE",
  DRIVER_VERIFICATION_ALREADY_APPROVED: "DRIVER_VERIFICATION_ALREADY_APPROVED",
  DRIVER_VERIFICATION_ALREADY_SUBMITTED:
    "DRIVER_VERIFICATION_ALREADY_SUBMITTED",
  DRIVER_VERIFICATION_SUSPENDED: "DRIVER_VERIFICATION_SUSPENDED",
  DRIVER_VERIFICATION_RESUBMIT_NOT_ALLOWED:
    "DRIVER_VERIFICATION_RESUBMIT_NOT_ALLOWED",
  STAFF_FORGOT_PASSWORD_EMAIL_SENT: "STAFF_FORGOT_PASSWORD_EMAIL_SENT",
  // Category related
  CATEGORY_NOT_FOUND: "CATEGORY_NOT_FOUND",
  CATEGORY_ACCESS_DENIED: "CATEGORY_ACCESS_DENIED",
  CATEGORY_UPDATE_DENIED: "CATEGORY_UPDATE_DENIED",
  CATEGORY_DELETE_DENIED: "CATEGORY_DELETE_DENIED",
  CATEGORY_CREATE_DENIED: "CATEGORY_CREATE_DENIED",
  /** Category rows are global; only Super Admin may insert. */
  CATEGORY_CREATION_SUPER_ADMIN_ONLY: "CATEGORY_CREATION_SUPER_ADMIN_ONLY",
  CATEGORY_LIST_DENIED: "CATEGORY_LIST_DENIED",
  PARENT_CATEGORY_NOT_FOUND: "PARENT_CATEGORY_NOT_FOUND",
  CATEGORY_PARENT_SELF_REFERENCE: "CATEGORY_PARENT_SELF_REFERENCE",
  CATEGORY_SCOPE_MISMATCH: "CATEGORY_SCOPE_MISMATCH",
  CATEGORY_BUSINESS_MISMATCH: "CATEGORY_BUSINESS_MISMATCH",
  CATEGORY_CIRCULAR_REFERENCE: "CATEGORY_CIRCULAR_REFERENCE",
  LOCAL_CATEGORY_POS_ONLY: "LOCAL_CATEGORY_POS_ONLY",
  CATEGORY_NAME_ALREADY_EXISTS: "CATEGORY_NAME_ALREADY_EXISTS",
  CATEGORY_HAS_PRODUCTS: "CATEGORY_HAS_PRODUCTS",
  CATEGORY_HAS_ACTIVE_PRODUCTS: "CATEGORY_HAS_ACTIVE_PRODUCTS",
  CATEGORY_HAS_ACTIVE_CHILDREN: "CATEGORY_HAS_ACTIVE_PRODUCTS",
  PROTECTED_CATEGORY_CANNOT_BE_DELETED: "PROTECTED_CATEGORY_CANNOT_BE_DELETED",
  OTHER_CATEGORY_NOT_FOUND: "OTHER_CATEGORY_NOT_FOUND",
  OTHER_CATEGORY_ALREADY_EXISTS: "OTHER_CATEGORY_ALREADY_EXISTS",
  CATEGORY_REQUEST_FAILED: "CATEGORY_REQUEST_FAILED",

  // Product related
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  ONLY_POS_PRODUCTS_CAN_BE_ORDERED: "ONLY_POS_PRODUCTS_CAN_BE_ORDERED",
  PRODUCT_ACCESS_DENIED: "PRODUCT_ACCESS_DENIED",
  PRODUCT_UPDATE_DENIED: "PRODUCT_UPDATE_DENIED",
  PRODUCT_DELETE_DENIED: "PRODUCT_DELETE_DENIED",
  PRODUCT_CREATE_DENIED: "PRODUCT_CREATE_DENIED",
  PRODUCT_LIST_DENIED: "PRODUCT_LIST_DENIED",
  PRODUCT_SKU_CONFLICT: "PRODUCT_SKU_CONFLICT",
  CATEGORY_SCOPE_INVALID_FOR_MARKETPLACE:
    "CATEGORY_SCOPE_INVALID_FOR_MARKETPLACE",

  // Batch related
  BATCH_CODE_CONFLICT: "BATCH_CODE_CONFLICT",
  BATCH_MANUFACTURE_AFTER_EXPIRY: "BATCH_MANUFACTURE_AFTER_EXPIRY",
  CREATE_BATCH_FAILED: "CREATE_BATCH_FAILED",
  UPDATE_BATCH_FAILED: "UPDATE_BATCH_FAILED",
  DELETE_BATCH_FAILED: "DELETE_BATCH_FAILED",
  PURCHASE_ORDER_NOT_FOUND: "PURCHASE_ORDER_NOT_FOUND",
  PURCHASE_ORDER_NOT_DRAFT: "PURCHASE_ORDER_NOT_DRAFT",
  PURCHASE_ORDER_NOT_DRAFT_TO_SEND: "PURCHASE_ORDER_NOT_DRAFT_TO_SEND",
  PURCHASE_ORDER_NOT_SENT_TO_RECEIVE: "PURCHASE_ORDER_NOT_SENT_TO_RECEIVE",
  PURCHASE_ORDER_CANNOT_CANCEL_RECEIVED:
    "PURCHASE_ORDER_CANNOT_CANCEL_RECEIVED",
  PURCHASE_ORDER_ALREADY_CANCELLED: "PURCHASE_ORDER_ALREADY_CANCELLED",
  PURCHASE_ORDER_BATCH_NOT_FOUND: "PURCHASE_ORDER_BATCH_NOT_FOUND",
  PURCHASE_ORDER_SUPPLIER_NO_EMAIL: "PURCHASE_ORDER_SUPPLIER_NO_EMAIL",
  PURCHASE_ORDER_SUPPLIER_NOT_FOUND: "PURCHASE_ORDER_SUPPLIER_NOT_FOUND",
  PURCHASE_ORDER_ITEMS_REQUIRED: "PURCHASE_ORDER_ITEMS_REQUIRED",
  PURCHASE_ORDER_ITEM_NOT_FOUND: "PURCHASE_ORDER_ITEM_NOT_FOUND",
  CREATE_SUPPLIER_FAILED: "CREATE_SUPPLIER_FAILED",
  UPDATE_SUPPLIER_FAILED: "UPDATE_SUPPLIER_FAILED",
  DELETE_SUPPLIER_FAILED: "DELETE_SUPPLIER_FAILED",

  // Coupon related
  COUPON_NOT_FOUND: "COUPON_NOT_FOUND",
  COUPON_INVALID: "COUPON_INVALID",
  COUPON_INACTIVE: "COUPON_INACTIVE",
  COUPON_EXPIRED: "COUPON_EXPIRED",
  COUPON_NOT_STARTED: "COUPON_NOT_STARTED",
  COUPON_MIN_ORDER_NOT_MET: "COUPON_MIN_ORDER_NOT_MET",
  COUPON_USAGE_LIMIT_REACHED: "COUPON_USAGE_LIMIT_REACHED",
  COUPON_ALREADY_USED: "COUPON_ALREADY_USED",
  COUPON_SEGMENT_NOT_ELIGIBLE: "COUPON_SEGMENT_NOT_ELIGIBLE",
  COUPON_CODE_CONFLICT: "COUPON_CODE_CONFLICT",
  COUPON_CREATE_FAILED: "COUPON_CREATE_FAILED",
  COUPON_PERCENTAGE_VALUE_TOO_HIGH: "COUPON_PERCENTAGE_VALUE_TOO_HIGH",

  // Ads / banners related
  AD_NOT_FOUND: "AD_NOT_FOUND",
  AD_CREATE_FAILED: "AD_CREATE_FAILED",

  FREE_DELIVERY_RULE_NOT_FOUND: "FREE_DELIVERY_RULE_NOT_FOUND",
  DELIVERY_CHARGES_CONFIG_NOT_FOUND: "DELIVERY_CHARGES_CONFIG_NOT_FOUND",

  // Order related
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  ORDER_CANNOT_BE_CANCELLED: "ORDER_CANNOT_BE_CANCELLED",
  ORDER_ALREADY_CANCELLED: "ORDER_ALREADY_CANCELLED",
  ORDER_ALREADY_COMPLETED: "ORDER_ALREADY_COMPLETED",
  ORDER_ALREADY_RATED: "ORDER_ALREADY_RATED",
  ORDER_SUBTOTAL_BELOW_MINIMUM: "ORDER_SUBTOTAL_BELOW_MINIMUM",
  ORDER_CAN_ONLY_BE_REJECTED_WHEN_PENDING:
    "ORDER_CAN_ONLY_BE_REJECTED_WHEN_PENDING",
  ORDER_STATUS_INVALID_TRANSITION: "ORDER_STATUS_INVALID_TRANSITION",
  ORDER_STATUS_TERMINAL_STATE: "ORDER_STATUS_TERMINAL_STATE",
  ORDER_STATUS_TRANSITION_NOT_ALLOWED: "ORDER_STATUS_TRANSITION_NOT_ALLOWED",
  ORDER_STATUS_UNCHANGED: "ORDER_STATUS_UNCHANGED",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  OUTSIDE_MENU_HOURS: "OUTSIDE_MENU_HOURS",
  ALL_PRODUCTS_UNAVAILABLE: "ALL_PRODUCTS_UNAVAILABLE",
  ADDRESS_NOT_FOUND: "ADDRESS_NOT_FOUND",
  INVALID_FULFILLMENT_TYPE: "INVALID_FULFILLMENT_TYPE",
  DINE_IN_NOT_SUPPORTED: "DINE_IN_NOT_SUPPORTED",
  FULFILLMENT_PICKUP_NOT_ALLOWED_FOR_BRANCH:
    "FULFILLMENT_PICKUP_NOT_ALLOWED_FOR_BRANCH",
  FULFILLMENT_DELIVERY_NOT_ALLOWED_FOR_BRANCH:
    "FULFILLMENT_DELIVERY_NOT_ALLOWED_FOR_BRANCH",

  // Order flag related
  ORDER_FLAG_NOT_FOUND: "ORDER_FLAG_NOT_FOUND",
  ORDER_FLAG_INVALID_STATUS_TRANSITION: "ORDER_FLAG_INVALID_STATUS_TRANSITION",
  ORDER_FLAG_MISTAKE_REQUIRES_UNDER_REVIEW:
    "ORDER_FLAG_MISTAKE_REQUIRES_UNDER_REVIEW",
  ORDER_FLAG_CLOSE_REQUIRES_UNDER_REVIEW:
    "ORDER_FLAG_CLOSE_REQUIRES_UNDER_REVIEW",
  ORDER_FLAG_CUSTOMER_USER_ID_REQUIRED: "ORDER_FLAG_CUSTOMER_USER_ID_REQUIRED",
  ORDER_FLAG_RIDER_USER_ID_REQUIRED: "ORDER_FLAG_RIDER_USER_ID_REQUIRED",
  ORDER_FLAG_NOTE_FAILED: "ORDER_FLAG_NOTE_FAILED",
  ORDER_FLAG_MISTAKE_FAILED: "ORDER_FLAG_MISTAKE_FAILED",
  ORDER_FLAG_CLOSE_FAILED: "ORDER_FLAG_CLOSE_FAILED",
  ORDER_FLAG_STATUS_UPDATE_FAILED: "ORDER_FLAG_STATUS_UPDATE_FAILED",

  // Branch related
  BRANCH_NOT_FOUND: "BRANCH_NOT_FOUND",
  BRANCH_ACCESS_DENIED: "BRANCH_ACCESS_DENIED",
  BRANCH_UPDATE_DENIED: "BRANCH_UPDATE_DENIED",
  BRANCH_DELETE_DENIED: "BRANCH_DELETE_DENIED",
  BRANCH_CREATE_DENIED: "BRANCH_CREATE_DENIED",
  BRANCH_LIST_DENIED: "BRANCH_LIST_DENIED",
  BRANCH_ASSIGNMENT_MISSING: "BRANCH_ASSIGNMENT_MISSING",
  BRANCH_CROSS_BUSINESS_ACCESS: "BRANCH_CROSS_BUSINESS_ACCESS",
  BRANCH_USER_CANNOT_SPECIFY_BRANCH: "BRANCH_USER_CANNOT_SPECIFY_BRANCH",
  STAFF_HAS_NO_BRANCH: "STAFF_HAS_NO_BRANCH",
  BRANCH_MANAGER_NOT_FOUND: "BRANCH_MANAGER_NOT_FOUND",

  // Shift / Zone related
  ZONE_NOT_FOUND: "ZONE_NOT_FOUND",
  ZONE_TYPE_MISMATCH: "ZONE_TYPE_MISMATCH",
  ZONE_WITH_THIS_NAME_ALREADY_EXISTS: "ZONE_WITH_THIS_NAME_ALREADY_EXISTS",
  GEO_CITY_NOT_FOUND: "GEO_CITY_NOT_FOUND",
  GEO_AREA_NOT_FOUND: "GEO_AREA_NOT_FOUND",
  GEO_CITY_SLUG_TAKEN: "GEO_CITY_SLUG_TAKEN",
  GEO_AREA_SLUG_TAKEN: "GEO_AREA_SLUG_TAKEN",
  GEO_SLUG_RESERVED: "GEO_SLUG_RESERVED",
  GEO_SLUG_INVALID: "GEO_SLUG_INVALID",
  GEO_CITY_HAS_AREAS: "GEO_CITY_HAS_AREAS",
  GEO_CITY_HAS_LIVE_AREAS: "GEO_CITY_HAS_LIVE_AREAS",
  GEO_AREA_LIVE_REQUIRES_LIVE_CITY: "GEO_AREA_LIVE_REQUIRES_LIVE_CITY",
  GEO_SERVICE_NOT_FOUND: "GEO_SERVICE_NOT_FOUND",
  GEO_SERVICE_SLUG_TAKEN: "GEO_SERVICE_SLUG_TAKEN",
  GEO_SERVICE_AREA_NOT_FOUND: "GEO_SERVICE_AREA_NOT_FOUND",
  GEO_COORDINATES_INCOMPLETE: "GEO_COORDINATES_INCOMPLETE",
  GEO_COORDINATES_OUTSIDE_REGION: "GEO_COORDINATES_OUTSIDE_REGION",
  SHIFT_SLOT_NOT_FOUND: "SHIFT_SLOT_NOT_FOUND",
  SHIFT_SLOT_IS_INACTIVE: "SHIFT_SLOT_IS_INACTIVE",
  SHIFT_SLOT_OVERLAPPING: "SHIFT_SLOT_OVERLAPPING",
  OVERLAPPING_SHIFT_SLOT_ALREADY_EXISTS:
    "OVERLAPPING_SHIFT_SLOT_ALREADY_EXISTS",
  SHIFT_SLOT_INACTIVE: "SHIFT_SLOT_INACTIVE",
  SHIFT_SLOT_PAST: "SHIFT_SLOT_PAST",
  SHIFT_SLOT_FULL: "SHIFT_SLOT_FULL",
  SHIFT_SLOT_BOOKED: "SHIFT_SLOT_BOOKED",
  SHIFT_SLOT_CANCELLED: "SHIFT_SLOT_CANCELLED",
  SHIFT_IS_FULLY_BOOKED: "SHIFT_IS_FULLY_BOOKED",
  BOOKING_NOT_FOUND: "BOOKING_NOT_FOUND",
  SHIFT_SLOT_TIME_MUST_MATCH_SHIFT_DATE:
    "SHIFT_SLOT_TIME_MUST_MATCH_SHIFT_DATE",
  CANNOT_DELETE_SHIFT_SLOT_WITH_ACTIVE_BOOKINGS:
    "CANNOT_DELETE_SHIFT_SLOT_WITH_ACTIVE_BOOKINGS",
  SHIFT_SWAP_NOT_ALLOWED: "SHIFT_SWAP_NOT_ALLOWED",
  SHIFT_SWAP_ALREADY_REQUESTED: "SHIFT_SWAP_ALREADY_REQUESTED",
  SHIFT_SWAP_NOT_FOUND: "SHIFT_SWAP_NOT_FOUND",
  SHIFT_SWAP_ALREADY_ACCEPTED: "SHIFT_SWAP_ALREADY_ACCEPTED",
  SHIFT_IS_NOT_AVAILABLE_FOR_BOOKING: "SHIFT_IS_NOT_AVAILABLE_FOR_BOOKING",
  CANNOT_BOOK_PAST_SHIFTS: "CANNOT_BOOK_PAST_SHIFTS",
  SHIFT_DURATION_BELOW_MINIMUM: "SHIFT_DURATION_BELOW_MINIMUM",
  SHIFT_HAS_INSUFFICIENT_REMAINING_TIME:
    "SHIFT_HAS_INSUFFICIENT_REMAINING_TIME",
  LOCATION_REQUIRED_TO_JOIN_RUNNING_SHIFT:
    "LOCATION_REQUIRED_TO_JOIN_RUNNING_SHIFT",
  CANNOT_CHECKOUT_WITH_ACTIVE_ORDERS: "CANNOT_CHECKOUT_WITH_ACTIVE_ORDERS",
  YOU_HAVE_ALREADY_BOOKED_THIS_SHIFT: "YOU_HAVE_ALREADY_BOOKED_THIS_SHIFT",
  YOU_HAVE_AN_OVERLAPPING_SHIFT_BOOKING:
    "YOU_HAVE_AN_OVERLAPPING_SHIFT_BOOKING",
  BOOKING_CANNOT_BE_CANCELLED: "BOOKING_CANNOT_BE_CANCELLED",
  CANNOT_CANCEL_SHIFT_AFTER_START: "CANNOT_CANCEL_SHIFT_AFTER_START",
  BOOKING_NOT_FOUND_OR_NOT_ACTIVE: "BOOKING_NOT_FOUND_OR_NOT_ACTIVE",
  CHECK_IN_WINDOW_NOT_YET_OPEN: "CHECK_IN_WINDOW_NOT_YET_OPEN",
  CHECK_IN_WINDOW_HAS_CLOSED: "CHECK_IN_WINDOW_HAS_CLOSED",
  ALREADY_CHECKED_IN_TO_THIS_SHIFT: "ALREADY_CHECKED_IN_TO_THIS_SHIFT",
  NOT_CHECKED_IN_TO_THIS_SHIFT: "NOT_CHECKED_IN_TO_THIS_SHIFT",
  ALREADY_CHECKED_OUT_FROM_THIS_SHIFT: "ALREADY_CHECKED_OUT_FROM_THIS_SHIFT",
  RIDER_NOT_IN_ZONE: "RIDER_NOT_IN_ZONE",
  CHECK_IN_TIME_NOT_FOUND: "CHECK_IN_TIME_NOT_FOUND",
  SHIFT_ALREADY_PAUSED: "SHIFT_ALREADY_PAUSED",
  SHIFT_NOT_PAUSED: "SHIFT_NOT_PAUSED",
  CANNOT_PAUSE_WITH_ACTIVE_ORDERS: "CANNOT_PAUSE_WITH_ACTIVE_ORDERS",
  MAX_BREAKS_REACHED: "MAX_BREAKS_REACHED",
  BREAK_DURATION_EXCEEDED: "BREAK_DURATION_EXCEEDED",
  RIDER_PERFORMANCE_RECORD_NOT_FOUND: "RIDER_PERFORMANCE_RECORD_NOT_FOUND",
  RIDER_CASH_OUT_REQUEST_NOT_FOUND: "RIDER_CASH_OUT_REQUEST_NOT_FOUND",
  RIDER_CASH_OUT_REQUEST_NOT_PENDING: "RIDER_CASH_OUT_REQUEST_NOT_PENDING",
  RIDER_NOT_FOUND: "RIDER_NOT_FOUND",
  RIDER_NOT_APPROVED_CANNOT_SUSPEND: "RIDER_NOT_APPROVED_CANNOT_SUSPEND",
  RIDER_NOT_SUSPENDED_CANNOT_CLEAR: "RIDER_NOT_SUSPENDED_CANNOT_CLEAR",
  SHIFT_SWAP_DENIED: "SHIFT_SWAP_DENIED",
  SHIFT_SWAP_CANCEL_DENIED: "SHIFT_SWAP_CANCEL_DENIED",

  // POS related
  BRANCH_INACTIVE: "BRANCH_INACTIVE",

  // Table/floor related
  TABLE_IN_USE: "TABLE_IN_USE",
  TABLE_NOT_FREE: "TABLE_NOT_FREE",
  CREATE_TABLE_FAILED: "CREATE_TABLE_FAILED",
  UPDATE_TABLE_FAILED: "UPDATE_TABLE_FAILED",
  DELETE_TABLE_FAILED: "DELETE_TABLE_FAILED",
  CREATE_FLOOR_FAILED: "CREATE_FLOOR_FAILED",
  UPDATE_FLOOR_FAILED: "UPDATE_FLOOR_FAILED",
  DELETE_FLOOR_FAILED: "DELETE_FLOOR_FAILED",
  FLOOR_NAME_EXISTS: "FLOOR_NAME_EXISTS",
  TABLE_NAME_EXISTS: "TABLE_NAME_EXISTS",
  MAX_FLOORS_REACHED: "MAX_FLOORS_REACHED",
  FLOOR_HAS_TABLES: "FLOOR_HAS_TABLES",

  // Raw Material related
  RAW_MATERIAL_NOT_FOUND: "RAW_MATERIAL_NOT_FOUND",

  // Business hours related
  BUSINESS_HOURS_NOT_FOUND: "BUSINESS_HOURS_NOT_FOUND",
  DAYPART_MENUS_OVERLAP: "DAYPART_MENUS_OVERLAP",
  DAYPART_MENU_OUTSIDE_HOURS: "DAYPART_MENU_OUTSIDE_HOURS",
  DAYPART_MENUS_INVALID: "DAYPART_MENUS_INVALID",

  // Recipe related
  RECIPE_NOT_FOUND: "RECIPE_NOT_FOUND",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  REQUIRED_FIELD_MISSING: "REQUIRED_FIELD_MISSING",
  INVALID_COORDINATES: "INVALID_COORDINATES",
  INVALID_URL: "INVALID_URL",
  INVALID_EMAIL: "INVALID_EMAIL",
  INVALID_PHONE: "INVALID_PHONE",
  INVALID_ROLE: "INVALID_ROLE",
  DESCRIPTION_TOO_LONG: "DESCRIPTION_TOO_LONG",
  NAME_REQUIRED: "NAME_REQUIRED",

  // Database
  DATABASE_ERROR: "DATABASE_ERROR",
  RECORD_NOT_FOUND: "RECORD_NOT_FOUND",
  DUPLICATE_RECORD: "DUPLICATE_RECORD",
  STAFF_EMAIL_ALREADY_EXISTS: "STAFF_EMAIL_ALREADY_EXISTS",
  STAFF_PHONE_ALREADY_EXISTS: "STAFF_PHONE_ALREADY_EXISTS",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",

  // Generic
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  BAD_REQUEST: "BAD_REQUEST",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",

  // Subscription related
  SUBSCRIPTION_CREATE_FAILED: "SUBSCRIPTION_CREATE_FAILED",
  TENANT_ALREADY_HAS_ACTIVE_SUBSCRIPTION:
    "TENANT_ALREADY_HAS_ACTIVE_SUBSCRIPTION",
  TENANT_ALREADY_HAS_ACTIVE_FREE_TRIAL_SUBSCRIPTION:
    "TENANT_ALREADY_HAS_ACTIVE_FREE_TRIAL_SUBSCRIPTION",
  TENANT_ALREADY_HAS_ACTIVE_PAID_SUBSCRIPTION:
    "TENANT_ALREADY_HAS_ACTIVE_PAID_SUBSCRIPTION",
  TENANT_FREE_TRIAL_ALREADY_USED: "TENANT_FREE_TRIAL_ALREADY_USED",
  SUBSCRIPTION_NOT_FOUND: "SUBSCRIPTION_NOT_FOUND",
  SUBSCRIPTION_DATE_OVERLAP:
    "This subscription's date range overlaps with an existing one for this tenant. Start the new subscription on or after the previous end date.",
  SUBSCRIPTION_START_BEFORE_EXPIRE: "Start date must be before expiry date.",
  ACTIVE_SUBSCRIPTION_EXISTS:
    "This tenant already has an active subscription. Extend or change the existing one.",
  SCHEDULED_SUBSCRIPTION_FORBIDDEN:
    "Scheduled subscriptions are not allowed. Start date cannot be in the future.",

  // Tenant reports
  TENANT_REPORT_NOT_FOUND: "TENANT_REPORT_NOT_FOUND",
  TENANT_REPORT_NO_ORDERS_IN_RANGE: "TENANT_REPORT_NO_ORDERS_IN_RANGE",
  TENANT_REPORT_DUPLICATE_RANGE: "TENANT_REPORT_DUPLICATE_RANGE",
  RIDER_REPORT_NOT_FOUND: "RIDER_REPORT_NOT_FOUND",
  RIDER_REPORT_NO_ORDERS_IN_RANGE: "RIDER_REPORT_NO_ORDERS_IN_RANGE",
  RIDER_REPORT_DUPLICATE_RANGE: "RIDER_REPORT_DUPLICATE_RANGE",

  // Deal related
  CREATE_DEAL_FAILED: "CREATE_DEAL_FAILED",
  DELETE_DEAL_FAILED: "DELETE_DEAL_FAILED",
  UPDATE_DEAL_FAILED: "UPDATE_DEAL_FAILED",
  REMOVE_DEAL_PRODUCT_FAILED: "REMOVE_PRODUCT_FAILED",
  DEAL_GROUP_REORDER_FAILED: "DEAL_GROUP_REORDER_FAILED",
  ADD_PRODUCT_FAILED: "ADD_PRODUCT_FAILED",
  DELETE_GROUP_FAILED: "DELETE_GROUP_FAILED",
  REORDER_FAILED: "REORDER_FAILED",
  ADD_GROUP_FAILED: "ADD_GROUP_FAILED",
  UPDATE_GROUP_FAILED: "UPDATE_GROUP_FAILED",
  UPDATE_GROUP_PRODUCT_FAILED: "UPDATE_GROUP_PRODUCT_FAILED"
} as const

/** Machine-readable codes for API error response (response body `code` field) */
export const ERROR_CODES = {
  SUBSCRIPTION_DATE_OVERLAP: "SUBSCRIPTION_DATE_OVERLAP",
  SUBSCRIPTION_START_BEFORE_EXPIRE: "SUBSCRIPTION_START_BEFORE_EXPIRE",
  ACTIVE_SUBSCRIPTION_EXISTS: "ACTIVE_SUBSCRIPTION_EXISTS",
  SCHEDULED_SUBSCRIPTION_FORBIDDEN: "SCHEDULED_SUBSCRIPTION_FORBIDDEN"
} as const

/** Localized error messages for API responses. Use {{paramName}} for interpolation. */
export const ERROR_MESSAGES_I18N: Record<
  (typeof ERROR_CODES)[keyof typeof ERROR_CODES],
  { en: string; ar: string; ur: string }
> = {
  [ERROR_CODES.SUBSCRIPTION_DATE_OVERLAP]: {
    en: "This subscription's date range overlaps with an existing one for this tenant. Start the new subscription on or after the previous end date. Conflicting period: {{conflictingPeriodStart}} to {{conflictingPeriodEnd}}",
    ar: "فترة الاشتراك تتقاطع مع اشتراك آخر لهذا المستأجر. ابدأ الاشتراك الجديد في أو بعد تاريخ انتهاء السابق. الفترة المعارضة: {{conflictingPeriodStart}} إلى {{conflictingPeriodEnd}}",
    ur: "Is tenant ke liye is subscription ki muddat kisi mojooda subscription se overlap karti hai. Nayi subscription ko pichli ke end date par ya us ke baad shuru karein. Mutasadam muddat: {{conflictingPeriodStart}} se {{conflictingPeriodEnd}}"
  },
  [ERROR_CODES.SUBSCRIPTION_START_BEFORE_EXPIRE]: {
    en: "Start date must be before expiry date.",
    ar: "يجب أن يكون تاريخ البداية قبل تاريخ الانتهاء.",
    ur: "Start date expiry date se pehle honi chahiye."
  },
  [ERROR_CODES.ACTIVE_SUBSCRIPTION_EXISTS]: {
    en: "This tenant already has an active subscription. Extend or change the existing one.",
    ar: "لدى هذا المستأجر اشتراك نشط بالفعل. قم بتمديد أو تغيير الاشتراك الحالي.",
    ur: "Is tenant ki pehle se active subscription hai. Mojooda subscription extend ya change karein."
  },
  [ERROR_CODES.SCHEDULED_SUBSCRIPTION_FORBIDDEN]: {
    en: "Scheduled subscriptions are not allowed. Start date cannot be in the future.",
    ar: "الاشتراكات المجدولة غير مسموحة. لا يمكن أن يكون تاريخ البداية في المستقبل.",
    ur: "Scheduled subscriptions ijazat nahi. Start date future mein nahi ho sakti."
  }
}

// Success codes for consistent responses (for frontend localization)
export const SUCCESS_CODES = {
  // Authentication & OTP
  OTP_GENERATED: "OTP_GENERATED",
  OTP_VERIFIED: "OTP_VERIFIED",
  OTP_SENT: "OTP_SENT",

  // Password operations
  PASSWORD_RESET_SUCCESS: "PASSWORD_RESET_SUCCESS",
  PASSWORD_CHANGED_SUCCESS: "PASSWORD_CHANGED_SUCCESS",

  // Session operations
  LOGOUT_SUCCESS: "LOGOUT_SUCCESS",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",

  // Guest user operations
  GUEST_USER_CREATED: "GUEST_USER_CREATED",
  GUEST_SESSION_RESTORED: "GUEST_SESSION_RESTORED",
  GUEST_ACCOUNT_CONVERTED: "GUEST_ACCOUNT_CONVERTED",
  GUEST_DATA_MERGED: "GUEST_DATA_MERGED",

  // Account operations
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
  ACCOUNT_UPDATED: "ACCOUNT_UPDATED",
  ACCOUNT_DELETED: "ACCOUNT_DELETED",
  PROFILE_UPDATED: "PROFILE_UPDATED",

  // Driver verification
  DRIVER_VERIFICATION_UPDATED_SUCCESS: "DRIVER_VERIFICATION_UPDATED_SUCCESS",
  DRIVER_VERIFICATION_SUBMITTED_SUCCESS:
    "DRIVER_VERIFICATION_SUBMITTED_SUCCESS",

  // Staff operations
  STAFF_CREATED: "STAFF_CREATED",
  STAFF_UPDATED: "STAFF_UPDATED",
  STAFF_DELETED: "STAFF_DELETED",
  STAFF_ALREADY_DELETED: "STAFF_ALREADY_DELETED",
  STAFF_PASSWORD_RESET_SUCCESS: "STAFF_PASSWORD_RESET_SUCCESS",

  // Generic
  OPERATION_SUCCESS: "OPERATION_SUCCESS",

  ADDRESS_CREATED: "ADDRESS_CREATED",
  ADDRESS_UPDATED: "ADDRESS_UPDATED",
  ADDRESS_DELETED: "ADDRESS_DELETED",

  ZONE_CREATED_SUCCESS: "ZONE_CREATED_SUCCESS",
  ZONE_UPDATED_SUCCESS: "ZONE_UPDATED_SUCCESS",
  ZONE_DELETED_SUCCESS: "ZONE_DELETED_SUCCESS",
  GEO_CITY_CREATED_SUCCESS: "GEO_CITY_CREATED_SUCCESS",
  GEO_CITY_UPDATED_SUCCESS: "GEO_CITY_UPDATED_SUCCESS",
  GEO_CITY_DELETED_SUCCESS: "GEO_CITY_DELETED_SUCCESS",
  GEO_AREA_CREATED_SUCCESS: "GEO_AREA_CREATED_SUCCESS",
  GEO_AREA_UPDATED_SUCCESS: "GEO_AREA_UPDATED_SUCCESS",
  GEO_AREA_DELETED_SUCCESS: "GEO_AREA_DELETED_SUCCESS",
  GEO_SERVICE_CREATED_SUCCESS: "GEO_SERVICE_CREATED_SUCCESS",
  GEO_SERVICE_UPDATED_SUCCESS: "GEO_SERVICE_UPDATED_SUCCESS",
  GEO_SERVICE_DELETED_SUCCESS: "GEO_SERVICE_DELETED_SUCCESS",
  SHIFT_SLOT_CREATED_SUCCESS: "SHIFT_SLOT_CREATED_SUCCESS",
  SHIFT_SLOT_UPDATED_SUCCESS: "SHIFT_SLOT_UPDATED_SUCCESS",
  SHIFT_SLOT_DELETED_SUCCESS: "SHIFT_SLOT_DELETED_SUCCESS",
  SHIFT_RELEASED_SUCCESS: "SHIFT_RELEASED_SUCCESS",
  CAPACITY_ADJUSTED_SUCCESS: "CAPACITY_ADJUSTED_SUCCESS",
  SHIFT_BOOKED_SUCCESS: "SHIFT_BOOKED_SUCCESS",
  SHIFT_CANCELLED_SUCCESS: "SHIFT_CANCELLED_SUCCESS",
  SHIFT_CHECKED_IN_SUCCESS: "SHIFT_CHECKED_IN_SUCCESS",
  SHIFT_CHECKED_OUT_SUCCESS: "SHIFT_CHECKED_OUT_SUCCESS",
  SHIFT_PAUSED_SUCCESS: "SHIFT_PAUSED_SUCCESS",
  SHIFT_RESUMED_SUCCESS: "SHIFT_RESUMED_SUCCESS",
  RIDER_PERFORMANCE_UPDATED_SUCCESS: "RIDER_PERFORMANCE_UPDATED_SUCCESS",
  RIDER_ONLINE_SUCCESS: "RIDER_ONLINE_SUCCESS",
  RIDER_OFFLINE_SUCCESS: "RIDER_OFFLINE_SUCCESS",
  CLEANUP_EXPIRED_RIDERS_SUCCESS: "CLEANUP_EXPIRED_RIDERS_SUCCESS",
  PERFORMANCE_UPDATE_SUCCESS: "PERFORMANCE_UPDATE_SUCCESS",
  SHIFT_AUTO_CHECKOUT_SUCCESS: "SHIFT_AUTO_CHECKOUT_SUCCESS",
  SHIFT_SWAP_CANCELLED_SUCCESS: "SHIFT_SWAP_CANCELLED_SUCCESS",
  SHIFT_SWAP_REQUESTED_SUCCESS: "SHIFT_SWAP_REQUESTED_SUCCESS",
  SHIFT_NO_SHOW_MARKED_SUCCESS: "SHIFT_NO_SHOW_MARKED_SUCCESS",
  SWAP_REQUESTS_EXPIRED_SUCCESS: "SWAP_REQUESTS_EXPIRED_SUCCESS",

  // Tenant operations
  TENANT_REGISTERED: "TENANT_REGISTERED",
  TENANT_APPROVED_SUCCESS: "TENANT_APPROVED_SUCCESS",
  TENANT_REJECTED_SUCCESS: "TENANT_REJECTED_SUCCESS",
  TENANT_IDLE_SUCCESS: "TENANT_IDLE_SUCCESS",
  TENANT_PENDING_SUCCESS: "TENANT_PENDING_SUCCESS",
  TENANT_SKIPPED_SUCCESS: "TENANT_SKIPPED_SUCCESS",
  TENANT_SUSPENDED_SUCCESS: "TENANT_SUSPENDED_SUCCESS",
  TENANT_UNSUSPENDED_SUCCESS: "TENANT_UNSUSPENDED_SUCCESS",

  // Rider cash-out request operations
  CASH_OUT_REQUEST_APPROVED_SUCCESS: "CASH_OUT_REQUEST_APPROVED_SUCCESS",
  CASH_OUT_REQUEST_REJECTED_SUCCESS: "CASH_OUT_REQUEST_REJECTED_SUCCESS",
  RIDER_SUSPENDED_SUCCESS: "RIDER_SUSPENDED_SUCCESS",
  RIDER_SUSPENSION_CLEARED_SUCCESS: "RIDER_SUSPENSION_CLEARED_SUCCESS",

  // Product operations
  PRODUCT_APPROVED_SUCCESS: "PRODUCT_APPROVED_SUCCESS",
  PRODUCT_REJECTED_SUCCESS: "PRODUCT_REJECTED_SUCCESS",
  PRODUCT_PENDING_APPROVAL_SUCCESS: "PRODUCT_PENDING_APPROVAL_SUCCESS",
  PRODUCT_ACTIVE_SUCCESS: "PRODUCT_ACTIVE_SUCCESS",
  PRODUCT_INACTIVE_SUCCESS: "PRODUCT_INACTIVE_SUCCESS",
  PRODUCT_DELETED_SUCCESS: "PRODUCT_DELETED_SUCCESS",

  // Coupon operations
  COUPON_CREATED_SUCCESS: "COUPON_CREATED_SUCCESS",
  COUPON_UPDATED_SUCCESS: "COUPON_UPDATED_SUCCESS",
  COUPON_ACTIVE_SUCCESS: "COUPON_ACTIVE_SUCCESS",
  COUPON_INACTIVE_SUCCESS: "COUPON_INACTIVE_SUCCESS",
  COUPON_EXPIRED_SUCCESS: "COUPON_EXPIRED_SUCCESS",

  // Free delivery rules
  FREE_DELIVERY_RULE_CREATED: "FREE_DELIVERY_RULE_CREATED",
  FREE_DELIVERY_RULE_UPDATED: "FREE_DELIVERY_RULE_UPDATED",
  FREE_DELIVERY_RULE_DELETED: "FREE_DELIVERY_RULE_DELETED",

  DELIVERY_CHARGES_CONFIG_CREATED: "DELIVERY_CHARGES_CONFIG_CREATED",
  DELIVERY_CHARGES_CONFIG_UPDATED: "DELIVERY_CHARGES_CONFIG_UPDATED",

  // Subscriptions
  SUBSCRIPTION_CREATED: "SUBSCRIPTION_CREATED",
  SUBSCRIPTION_UPDATED: "SUBSCRIPTION_UPDATED",
  SUBSCRIPTION_DELETED: "SUBSCRIPTION_DELETED"
} as const

// Backward compatibility - map to SUCCESS_CODES
export const SUCCESS_MESSAGES = SUCCESS_CODES

// HTTP status codes
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const

// ============================================================================
// AUDIT CONSTANTS
// ============================================================================

// Audit plugin configuration
export const AUDIT_CONFIG = {
  MAX_RETRIES: 5,
  BASE_DELAY: 1000,
  MAX_DELAY: 30_000,
  CONSUMER_TIMEOUT: 5000,
  MAX_ARRAY_SLICE: 50,
  MAX_OBJECT_ENTRIES: 100,
  MAX_STRING_LENGTH: 4096
} as const

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Common error types for type safety
export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES]
export type StatusCode =
  (typeof HTTP_STATUS_CODES)[keyof typeof HTTP_STATUS_CODES]

// ============================================================================
// SOCKET EVENTS CONSTANTS
// ============================================================================

/**
 * Socket event names for real-time communication
 * All socket events should be defined here for consistency
 */
export const SOCKET_EVENTS = {
  // Shift booking events (emitted to specific rider)
  SHIFT_BOOKED: "shift:booked",
  SHIFT_CANCELLED: "shift:cancelled",
  SHIFT_CHECKED_IN: "shift:checked_in",
  SHIFT_CHECKIN_AVAILABLE: "shift:checkin_available",

  // Shift swap events (emitted to specific rider)
  SHIFT_SWAP_REQUESTED: "shift:swap_requested",
  SHIFT_SWAP_ACCEPTED: "shift:swap_accepted",
  SHIFT_SWAP_CANCELLED: "shift:swap_cancelled",
  SHIFT_SWAP_WINDOW_CLOSED: "shift:swap_window_closed",

  // Shift availability events (emitted to all riders)
  SHIFT_AVAILABILITY_UPDATED: "shift:availability_updated",

  // Rider status events (emitted to super admin)
  RIDER_ONLINE: "rider:online",
  RIDER_OFFLINE: "rider:offline",

  // Break warning event (emitted to specific rider)
  BREAK_WARNING: "break:warning",

  // Rider cash wallet / cash-block events (emitted to specific rider)
  RIDER_CASH_BLOCK_STATUS: "rider:cash_block_status",
  RIDER_CASH_REQUEST_STATUS: "rider:cash_request_status",

  // Order assignment events (emitted to specific rider)
  ORDER_ASSIGNED: "order:assigned",
  ORDER_ASSIGNMENT_EXPIRED: "order:assignment_expired",
  ORDER_ASSIGNMENT_ACCEPTED: "order:assignment_accepted",
  ORDER_ASSIGNMENT_REJECTED: "order:assignment_rejected",

  // Order events (emitted to branch)
  ORDER_CREATED: "order:created",
  ORDER_CREATED_POS: "order-created-pos",
  ORDER_ACCEPTED_BY_RIDER: "order:accepted_by_rider",
  ORDER_ACCEPTED_BY_TENANT: "order:accepted_by_tenant",
  ORDER_REJECTED_BY_TENANT: "order:rejected_by_tenant",
  ORDER_STATUS_PREPARING: "order:status:preparing",
  ORDER_STATUS_READY: "order:status:ready",
  ORDER_STATUS_COMPLETED: "order:status:completed",
  ORDER_CANCELLED: "order:cancelled",
  ORDER_REJECTED: "order:rejected",
  // Unified order update event (emitted to customer and rider)
  ORDER_UPDATED: "order:updated",
  /** Order flag case updates — reporter room only (do not overload order:updated). */
  ORDER_FLAG_UPDATED: "order:flag:updated",

  // Menu / catalog (tenant catalog + branch inventory)
  MENU_ITEM_CREATED: "menu:item:created",
  MENU_ITEM_UPDATED: "menu:item:updated",
  MENU_ITEM_DELETED: "menu:item:deleted",
  MENU_ITEM_AVAILABILITY_CHANGED: "menu:item:availability_changed",
  MENU_ITEM_INVENTORY_UPDATED: "menu:item:inventory_updated",
  STOCK_UPDATED: "stock-updated",
  SALE_COMPLETED: "sale-completed",
  MENU_CATEGORY_CREATED: "menu:category:created",
  MENU_CATEGORY_UPDATED: "menu:category:updated",
  MENU_CATEGORY_DELETED: "menu:category:deleted"
} as const

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS]

/**
 * Socket room names
 */
export const SOCKET_ROOMS = {
  RIDER_PREFIX: "rider:",
  BRANCH_PREFIX: "branch:",
  CUSTOMER_PREFIX: "customer:",
  SUPER_ADMIN: "super_admin",
  TENANT_CATALOG_PREFIX: "tenant_catalog:"
} as const

/**
 * Helper function to get rider room name
 */
export function getRiderRoom(riderId: string): string {
  return `${SOCKET_ROOMS.RIDER_PREFIX}${riderId}`
}

/**
 * Helper function to get branch room name
 * @param branchId - The branch ID (must be a non-empty string after trimming)
 * @returns Room name string in format "branch:${branchId}"
 * @throws {Error} If branchId is not a string, empty, or whitespace-only
 */
export function getBranchRoom(branchId: string): string {
  // Validate branchId is a string
  if (typeof branchId !== "string") {
    throw new Error(`Invalid branchId: expected string, got ${typeof branchId}`)
  }

  // Trim and validate non-empty
  const trimmedBranchId = branchId.trim()
  if (trimmedBranchId.length === 0) {
    throw new Error(
      `Invalid branchId: cannot be empty or whitespace-only (original length: ${branchId.length})`
    )
  }

  return `${SOCKET_ROOMS.BRANCH_PREFIX}${trimmedBranchId}`
}

export function getTenantCatalogRoom(businessTenantId: string): string {
  if (typeof businessTenantId !== "string") {
    throw new Error(
      `Invalid businessTenantId: expected string, got ${typeof businessTenantId}`
    )
  }
  const trimmed = businessTenantId.trim()
  if (trimmed.length === 0) {
    throw new Error("Invalid businessTenantId: cannot be empty")
  }
  return `${SOCKET_ROOMS.TENANT_CATALOG_PREFIX}${trimmed}`
}

/**
 * Helper function to get customer room name
 * @param customerId - The customer ID (must be a non-empty string after trimming)
 * @returns Room name string in format "customer:${customerId}"
 * @throws {Error} If customerId is not a string, empty, or whitespace-only
 */
export function getCustomerRoom(customerId: string): string {
  // Validate customerId is a string
  if (typeof customerId !== "string") {
    throw new Error(
      `Invalid customerId: expected string, got ${typeof customerId}`
    )
  }

  // Trim and validate non-empty
  const trimmedCustomerId = customerId.trim()
  if (trimmedCustomerId.length === 0) {
    throw new Error(
      `Invalid customerId: cannot be empty or whitespace-only (original length: ${customerId.length})`
    )
  }

  return `${SOCKET_ROOMS.CUSTOMER_PREFIX}${trimmedCustomerId.toLowerCase()}`
}

// ============================================================================
// HOME SECTIONS
// ============================================================================

export const HOME_SECTIONS = {
  MostOrdered: "mostOrdered",
  TryNew: "tryNew",
  RecentOrders: "recentOrders",
  TopPlaces: "topPlaces",
  FastFood: "fastFood",
  Pizza: "pizza",
  Burgers: "burgers",
  LightBites: "lightBites",
  FiftyOff: "fiftyOff",
  Offers: "offers",
  Deals: "deals",
  Desserts: "desserts",
  DesiFood: "desiFood",
  Drinks: "drinks",
  Groceries: "groceries",
  Breakfast: "breakfast",
  Bbq: "bbq",
  BiryaniPulao: "biryaniPulao",
  TrendingNow: "trendingNow",
  FreeDelivery: "freeDelivery"
} as const

/** Items returned per home-screen section. */
export const HOME_SECTION_ITEM_LIMIT = 10

/** Price-bucket deal rails: `dealsUnder500`, `dealsUnder700`, … */
export const HOME_DEALS_UNDER_SECTION_PREFIX = "dealsUnder"
export const HOME_DEALS_UNDER_STEP = 100
export const HOME_DEALS_UNDER_MIN_COUNT = 3
/** Consecutive deal rails must be at least this far apart. */
export const HOME_DEALS_UNDER_MIN_GAP = 300
/** Pool size used to discover price rails. Kept close to other section windows. */
export const HOME_DEALS_UNDER_CANDIDATE_LIMIT = 60
const DEALS_UNDER_THRESHOLD_DIGITS = /^\d+$/

export const dealsUnderSectionKey = (threshold: number) =>
  `${HOME_DEALS_UNDER_SECTION_PREFIX}${threshold}`

export const parseDealsUnderThreshold = (
  section: string
): number | undefined => {
  if (!section.startsWith(HOME_DEALS_UNDER_SECTION_PREFIX)) return
  const raw = section.slice(HOME_DEALS_UNDER_SECTION_PREFIX.length)
  if (!DEALS_UNDER_THRESHOLD_DIGITS.test(raw)) return
  const threshold = Number(raw)
  if (!Number.isInteger(threshold) || threshold <= 0) return
  return threshold
}

export const dealsUnderSectionTitle = (
  threshold: number
): Record<Locale, string> => ({
  en: `Deals under ${threshold}`,
  ar: `عروض أقل من ${threshold}`,
  ur: `Deals under ${threshold}`
})

export const dealsUnderSectionDescription = (
  threshold: number
): Record<Locale, string> => ({
  en: `Combo deals priced at or below ${threshold}`,
  ar: `عروض كومبو بسعر ${threshold} أو أقل`,
  ur: `${threshold} ya us se kam ke combo deals`
})

/** Lookback for the Most ordered product section. */
export const HOME_MOST_ORDERED_LOOKBACK_DAYS = 30

export type HomeSection = (typeof HOME_SECTIONS)[keyof typeof HOME_SECTIONS]

export const homeSectionEnum = z.enum(
  Object.values(HOME_SECTIONS) as [string, ...string[]]
)

export function isHomeSection(value: unknown): value is HomeSection {
  return Object.values(HOME_SECTIONS).includes(value as HomeSection)
}

// ============================================================================
// NOTIFICATION CONSTANTS
// ============================================================================

// Device types for push notifications
export const DEVICE_TYPES = ["ios", "android", "web"] as const
export type DeviceType = (typeof DEVICE_TYPES)[number]
export const deviceTypeEnum = z.enum(DEVICE_TYPES)

// App types (which frontend app the user is using)
export const APP_TYPES = [
  "customer",
  "rider",
  "admin",
  "pos",
  "super_admin",
  "pos_customer",
  "tenant"
] as const
export type AppType = (typeof APP_TYPES)[number]
export const appTypeEnum = z.enum(APP_TYPES)

// Email types for tracking and categorization
export const EMAIL_TYPES = [
  "otp",
  "welcome",
  "password-reset",
  "order-confirmation",
  "order-status",
  "custom"
] as const
export type EmailType = (typeof EMAIL_TYPES)[number]
export const emailTypeEnum = z.enum(EMAIL_TYPES)

// Push notification priority levels
export const NOTIFICATION_PRIORITY = ["high", "normal"] as const
export type NotificationPriority = (typeof NOTIFICATION_PRIORITY)[number]
export const notificationPriorityEnum = z.enum(NOTIFICATION_PRIORITY)

// Notification categories for grouping
export const NOTIFICATION_CATEGORIES = [
  "authentication",
  "product",
  "order",
  "delivery",
  "promotion",
  "system",
  "chat",
  "payment"
] as const
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number]
export const notificationCategoryEnum = z.enum(NOTIFICATION_CATEGORIES)

// Named constants for notification categories
export const NOTIFICATION_CATEGORY = {
  AUTHENTICATION: "authentication",
  ORDER: "order",
  DELIVERY: "delivery",
  PROMOTION: "promotion",
  SYSTEM: "system",
  CHAT: "chat",
  PAYMENT: "payment",
  PRODUCT: "product"
} as const

/** Who created the notification row (nullable; default null in DB). Super-admin tools set `super_admin`. */
export const NOTIFICATION_CREATED_BY = ["super_admin"] as const
export type NotificationCreatedBy = (typeof NOTIFICATION_CREATED_BY)[number]
export const NOTIFICATION_CREATED_BY_SUPER_ADMIN = NOTIFICATION_CREATED_BY[0]

/** Default `type` for super-admin notification APIs when the client omits `type`. */
export const SUPER_ADMIN_NOTIFICATION_DEFAULT_TYPE =
  "super_admin_notice" as const

// Notification types for order flow
export const NOTIFICATION_TYPES = {
  // Customer notifications
  ORDER_PLACED: "order_placed",
  ORDER_CONFIRMED: "order_confirmed",
  ORDER_REJECTED: "order_rejected",
  ORDER_PREPARING: "order_preparing",
  ORDER_READY: "order_ready",
  RIDER_ASSIGNED: "rider_assigned",
  RIDER_PICKED_UP: "rider_picked_up",
  RIDER_ON_THE_WAY: "rider_on_the_way",
  ORDER_DELIVERED: "order_delivered",
  ORDER_DELIVERY_FAILED: "order_delivery_failed",
  ORDER_CANCELLED: "order_cancelled",
  PAYMENT_SUCCESS: "payment_success",
  PAYMENT_FAILED: "payment_failed",
  // Rider notifications
  NEW_ORDER_ASSIGNED: "new_order_assigned",
  ORDER_ACCEPTED: "order_accepted",
  ORDER_REJECTED_BY_RIDER: "order_rejected_by_rider",
  ORDER_CANCELLED_BY_CUSTOMER: "order_cancelled_by_customer",
  RIDER_APPLICATION_APPROVED: "rider_application_approved",
  RIDER_APPLICATION_REJECTED: "rider_application_rejected",
  RIDER_CASH_REQUEST_SUBMITTED: "rider_cash_request_submitted",
  RIDER_CASH_REQUEST_APPROVED: "rider_cash_request_approved",
  RIDER_CASH_REQUEST_REJECTED: "rider_cash_request_rejected",
  RIDER_CASH_BLOCKED: "rider_cash_blocked",
  RIDER_ACCOUNT_SUSPENDED: "rider_account_suspended",
  RIDER_ACCOUNT_SUSPENSION_CLEARED: "rider_account_suspension_cleared",
  // Tenant admin notifications
  ORDER_PLACED_TENANT: "order_placed_tenant",
  ORDER_CANCELLED_TENANT: "order_cancelled_tenant",
  REVIEW_CREATED_TENANT: "review_created_tenant",
  PRODUCT_APPROVED_TENANT: "product_approved_tenant",
  PRODUCT_REJECTED_TENANT: "product_rejected_tenant",
  PRODUCT_STATUS_CHANGED_TENANT: "product_status_changed_tenant",
  PRODUCT_SELL_ON_CHANGED_TENANT: "product_sell_on_changed_tenant",
  ORDER_DELIVERED_TENANT: "order_delivered_tenant",
  ORDER_DELIVERY_FAILED_TENANT: "order_delivery_failed_tenant",
  TENANT_PAYMENT_RECEIVED: "tenant_payment_received",
  TENANT_PAYOUT_APPROVED: "tenant_payout_approved",
  TENANT_PAYOUT_REJECTED: "tenant_payout_rejected",
  TENANT_PLATFORM_FEE_THRESHOLD_REACHED:
    "tenant_platform_fee_threshold_reached",
  TENANT_PLATFORM_FEE_BLOCK_WARNING: "tenant_platform_fee_block_warning",
  TENANT_PLATFORM_FEE_BLOCKED: "tenant_platform_fee_blocked",
  TENANT_ACCOUNT_SUSPENDED: "tenant_account_suspended",
  TENANT_ACCOUNT_REACTIVATED: "tenant_account_reactivated",
  TENANT_SELL_ON_CHANGED: "tenant_sell_on_changed",
  TENANT_COMMISSION_UPDATED: "tenant_commission_updated",
  TENANT_FREE_TRIAL_STARTED: "tenant_free_trial_started",
  TENANT_SUBSCRIPTION_ACTIVATED: "tenant_subscription_activated",
  TENANT_SUBSCRIPTION_PAYMENT_UNDER_REVIEW:
    "tenant_subscription_payment_under_review",
  TENANT_SUBSCRIPTION_PAYMENT_REJECTED: "tenant_subscription_payment_rejected",
  TENANT_SUBSCRIPTION_EXPIRY_WARNING: "tenant_subscription_expiry_warning",
  LOW_STOCK_ALERT: "low_stock_alert",
  BATCH_EXPIRY_ALERT: "batch_expiry_alert",
  // Order revision loop (pos-workspace-revamp ticket 84)
  REVISION_SENT: "revision_sent",
  REVISION_APPROVED: "revision_approved",
  REVISION_REJECTED: "revision_rejected",
  REVISION_EXPIRED: "revision_expired",
  // Super admin notifications
  PRODUCT_PENDING_APPROVAL: "product_pending_approval",
  PRODUCT_DETAIL_UPDATED: "product_detail_updated",
  RIDER_VERIFICATION_SUBMITTED: "rider_verification_submitted",
  RIDER_VERIFICATION_RESUBMITTED: "rider_verification_resubmitted",
  // Order flagging
  ORDER_FLAG_SUBMITTED: "order_flag_submitted",
  ORDER_FLAG_RECEIVED: "order_flag_received",
  ORDER_FLAG_SIBLING_SUBMITTED: "order_flag_sibling_submitted",
  ORDER_FLAG_UNDER_REVIEW: "order_flag_under_review",
  ORDER_FLAG_NOTE_ADDED: "order_flag_note_added",
  ORDER_FLAG_MISTAKE_RECORDED: "order_flag_mistake_recorded",
  ORDER_FLAG_RESOLVED: "order_flag_resolved"
} as const
export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]

// Kafka topics for notifications
export const KAFKA_TOPICS = {
  EMAIL: "notification.email",
  PUSH: "notification.push",
  SMS: "notification.sms",
  AUDIT: "audit.logs",
  SOCKET_EVENTS: "socket.events",
  /** Domain event: new order (analytics, integrations). */
  ORDER_CREATED: "order.created",
  /** Domain event: order status transitions. */
  ORDER_STATUS_UPDATED: "order.status_updated",
  /** Batched customer growth / behavioral events from the mobile app (Epic 20, Story 20-2+). */
  CUSTOMER_GROWTH_EVENT: "customer.growth_event"
} as const

/** Topics for invalidating restaurant analytics Redis cache (see analytics-cache consumer). */
export const ANALYTICS_CACHE_KAFKA_TOPICS = {
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_COMPLETED: "order.completed",
  ORDER_CANCELLED: "order.cancelled",
  PRODUCT_UPDATED: "product.updated"
} as const

// Email template tags
export const EMAIL_TAGS = {
  OTP: "otp",
  VERIFICATION: "verification",
  WELCOME: "welcome",
  ONBOARDING: "onboarding",
  PASSWORD_RESET: "password-reset",
  SECURITY: "security",
  ORDER: "order",
  CONFIRMATION: "confirmation",
  STATUS_UPDATE: "status-update",
  PROMOTION: "promotion"
} as const

// Notification expiry times (in minutes)
export const NOTIFICATION_EXPIRY = {
  OTP: 2,
  PASSWORD_RESET: 60,
  VERIFICATION_LINK: 1440 // 24 hours
} as const

// Firebase topic naming patterns
export const FIREBASE_TOPICS = {
  ALL_USERS: "all-users",
  CUSTOMERS: "customers",
  RIDERS: "riders",
  DRIVERS: "drivers",
  ADMINS: "admins",
  CUSTOMERS_PREMIUM: "customers-premium"
  // Dynamic topics: `riders-${city}`, `customers-${tier}`, `user-${userId}`
} as const

// number regex
export const NUMBER_REGEX = /^\d+$/

export const HOME_SECTION_SHAPES = ["rectangle", "square"] as const
export type HomeSectionShape = (typeof HOME_SECTION_SHAPES)[number]
export const homeSectionShapeEnum = z.enum(HOME_SECTION_SHAPES)

export const HOME_SECTION_DISPLAY = ["single", "multiple"] as const
export type HomeSectionDisplay = (typeof HOME_SECTION_DISPLAY)[number]
export const homeSectionDisplayEnum = z.enum(HOME_SECTION_DISPLAY)

export interface HomeSectionMetadata {
  section: HomeSection
  index: number
  shape: HomeSectionShape
  display: HomeSectionDisplay
  heading: Record<Locale, string>
  color: boolean
}

export const HOME_SECTIONS_METADATA: HomeSectionMetadata[] = [
  {
    section: HOME_SECTIONS.MostOrdered,
    index: 0,
    shape: "rectangle",
    display: "single",
    heading: {
      en: "Most ordered",
      ar: "الأكثر طلباً",
      ur: "Zyada order honay wali"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.TryNew,
    index: 1,
    shape: "rectangle",
    display: "single",
    heading: {
      en: "Try something new",
      ar: "جرب شيء جديد",
      ur: "Kuch naya try karein"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.RecentOrders,
    index: 2,
    shape: "rectangle",
    display: "single",
    heading: {
      en: "Order again",
      ar: "اطلب مرة أخرى",
      ur: "Dobara order karein"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.Breakfast,
    index: 3,
    shape: "rectangle",
    display: "single",
    heading: {
      en: "Looking for Breakfast",
      ar: "تبحث عن الإفطار",
      ur: "Nashtay ki talash hai"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.TopPlaces,
    index: 4,
    shape: "square",
    display: "single",
    heading: {
      en: "Nearby top brands",
      ar: "أفضل العلامات التجارية القريبة",
      ur: "Qareebi top brands"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.FastFood,
    index: 5,
    shape: "rectangle",
    display: "single",
    heading: {
      en: "Fast Food Favorites",
      ar: "مفضلات الوجبات السريعة",
      ur: "Fast Food Favorites"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.Pizza,
    index: 6,
    shape: "rectangle",
    display: "single",
    heading: {
      en: "Pizza, Fresh Out of the Oven",
      ar: "بيتزا طازجة من الفرن",
      ur: "Pizza, Fresh Out of the Oven"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.Burgers,
    index: 7,
    shape: "rectangle",
    display: "single",
    heading: {
      en: "Burger Time!",
      ar: "وقت البرجر!",
      ur: "Burger Time!"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.LightBites,
    index: 8,
    shape: "rectangle",
    display: "single",
    heading: {
      en: "Light cravings",
      ar: "وجبات خفيفة",
      ur: "Light cravings"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.Bbq,
    index: 9,
    shape: "rectangle",
    display: "single",
    heading: {
      en: "BBQ Cravings",
      ar: "شغف الباربكيو",
      ur: "BBQ cravings"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.BiryaniPulao,
    index: 10,
    shape: "rectangle",
    display: "single",
    heading: {
      en: "Biryani & Pulao Specials",
      ar: "عروض البرياني والبلاو",
      ur: "Biryani aur pulao specials"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.FreeDelivery,
    index: 11,
    shape: "square",
    display: "multiple",
    heading: {
      en: "Free delivery near you",
      ar: "توصيل مجاني بالقرب منك",
      ur: "Aap ke qareeb free delivery"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.TrendingNow,
    index: 12,
    shape: "square",
    display: "single",
    heading: {
      en: "Everyone's ordering",
      ar: "الأكثر طلباً الآن",
      ur: "Zyada order honay wali"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.DesiFood,
    index: 13,
    shape: "rectangle",
    display: "single",
    heading: {
      en: "Spice in every bite",
      ar: "توابل في كل قضمة",
      ur: "Har nivalay mein tadka"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.Drinks,
    index: 14,
    shape: "rectangle",
    display: "single",
    heading: {
      en: "Drinks and beverages",
      ar: "المشروبات",
      ur: "Drinks aur beverages"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.Groceries,
    index: 15,
    shape: "rectangle",
    display: "single",
    heading: {
      en: "Fresh groceries your doorstep",
      ar: "بقالة طازجة عند عتبتك",
      ur: "Taaza grocery aap ke darwaze par"
    },
    color: false
  },
  {
    section: HOME_SECTIONS.Desserts,
    index: 16,
    shape: "rectangle",
    display: "single",
    heading: {
      en: "Sweet treats",
      ar: "حلويات لذيذة",
      ur: "Kuch meetha ho jaye"
    },
    color: false
  }
]

export const HOME_FILTERS = {
  PRICE: "price",
  DISTANCE: "distance",
  TOP_SELLER: "topSeller",
  OFFERS: "offers",
  FREE_DELIVERY: "freeDelivery",
  FAST_DELIVERY: "fastDelivery",
  RATING: "rating",
  NEW_ARRIVALS: "newArrivals",
  DEAL: "deal",
  VOUCHERS: "vouchers",
  RATING_4_PLUS: "rating4Plus",
  BENEFITS: "benefits",
  DELIVERY: "delivery",
  PICKUP: "pickup"
} as const

export const HOME_SEARCH_TARGETS = {
  PRODUCTS: "products",
  SHOPS: "shops"
} as const

// ============================================================================
// CATEGORY SLUG CONSTANTS
// ============================================================================

// Category slugs for home sections to avoid hardcoding
export const CATEGORY_SLUGS = {
  FAST_FOOD: "fast-food",
  DESSERTS: "desserts",
  PIZZA: "pizza",
  BURGER: "burger",
  ASIAN: "asian-cuisine",
  ITALIAN: "italian-cuisine",
  MEXICAN: "mexican-cuisine",
  SEAFOOD: "seafood",
  VEGETARIAN: "vegetarian",
  BEVERAGES: "beverages",
  GROCERIES: "groceries",
  GROCERY: "grocery",
  RAW_MEAT: "raw-meat",
  RAW_CHICKEN: "raw-chicken",
  PHARMACY: "pharmacy",
  PAKISTANI_FOOD: "pakistani-food"
} as const

export type CategorySlug = (typeof CATEGORY_SLUGS)[keyof typeof CATEGORY_SLUGS]

/**
 * Parent-category tokens for sections that must stay under a root (e.g. groceries).
 * Combined with {@link HOME_SECTION_CATEGORY_SLUGS} so raw meat/chicken under
 * grocery match, while restaurant "chicken" dishes do not.
 */
export const HOME_SECTION_PARENT_CATEGORY_SLUGS = {
  [HOME_SECTIONS.Groceries]: ["groceries", "grocery"] as const,
  [HOME_SECTIONS.Bbq]: ["pakistani", "pakistani-food"] as const,
  [HOME_SECTIONS.BiryaniPulao]: ["pakistani", "pakistani-food"] as const
} as const

/**
 * Tokens per home section. Fast food, light bites, desserts, desi food, drinks,
 * and grocery subcategories use loose contains-match on slug/name, then the
 * whole category tree (parentId / rootCategoryId). Groceries is further scoped
 * by {@link HOME_SECTION_PARENT_CATEGORY_SLUGS}.
 *
 * Drinks tokens avoid "beverage" (matches the "Food & Beverages" parent) and
 * short tokens like "tea" (matches "steak").
 */
export const HOME_SECTION_CATEGORY_SLUGS = {
  [HOME_SECTIONS.FastFood]: ["fast-food", "fastfood", "fast food"] as const,
  [HOME_SECTIONS.Pizza]: ["pizza", "pizzas"] as const,
  [HOME_SECTIONS.Burgers]: ["burger", "burgers", "hamburger"] as const,
  [HOME_SECTIONS.LightBites]: [
    "starter",
    "starters",
    "appetizer",
    "appetizers",
    "snack",
    "snacks",
    "sandwich",
    "sandwiches",
    "finger-food",
    "finger food"
  ] as const,
  [HOME_SECTIONS.Desserts]: [
    "dessert",
    "desserts",
    "sweet",
    "sweets",
    "mithai",
    "ice-cream",
    "icecream",
    "cake",
    "pastry",
    "kheer",
    "gulab",
    "halwa",
    "brownie",
    "pudding",
    "donut",
    "doughnut",
    "waffle",
    "cookie"
  ] as const,
  [HOME_SECTIONS.DesiFood]: [
    "pakistani",
    "desi",
    "bbq",
    "barbeque",
    "barbecue",
    "karahi",
    "biryani",
    "nihari",
    "tikka",
    "haleem",
    "kebab",
    "kabab",
    "chapli",
    "sajji",
    "handi",
    "qorma",
    "korma",
    "pulao",
    "seekh",
    "tandoor",
    "keema",
    "paya",
    "paye"
  ] as const,
  [HOME_SECTIONS.Drinks]: [
    "drink",
    "drinks",
    "juice",
    "juices",
    "coffee",
    "smoothie",
    "milkshake",
    "mocktail",
    "cocktail",
    "lassi",
    "chai",
    "soda",
    "shake",
    "cold-drink",
    "colddrink",
    "soft-drink",
    "softdrink",
    "energy-drink",
    "energydrink",
    "مشروبات"
  ] as const,
  [HOME_SECTIONS.Bbq]: ["bbq", "barbeque", "barbecue"] as const,
  [HOME_SECTIONS.BiryaniPulao]: ["biryani", "pulao"] as const,
  [HOME_SECTIONS.Groceries]: [
    "raw-meat",
    "raw meat",
    "rawmeat",
    "raw-meet",
    "raw meet",
    "raw-chicken",
    "raw chicken",
    "rawchicken",
    "meat",
    "chicken"
  ] as const
} as const

// ============================================================================
// STATUS VALUE CONSTANTS
// ============================================================================

// Named status values for better code readability and maintainability
export const STATUS_VALUES = {
  ADMIN_STATUS: {
    IDLE: "idle",
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    SKIPPED: "skipped"
  },
  TENANT_STATUS: {
    ACTIVE: "active",
    INACTIVE: "inactive"
  },
  TENANT_TYPE: {
    BUSINESS: "business",
    BRANCH: "branch"
  },
  PRODUCT_ADMIN_STATUS: {
    PENDING_APPROVAL: "pending_approval",
    APPROVED: "approved",
    REJECTED: "rejected"
  },
  PRODUCT_STATUS: {
    ACTIVE: "active",
    INACTIVE: "inactive"
  }
} as const

const ADMIN_STATUS_ARRAY = typedValues(STATUS_VALUES.ADMIN_STATUS)
type AdminStatusArray = UnionToArray<(typeof ADMIN_STATUS_ARRAY)[number]>

const TENANT_STATUS_ARRAY = typedValues(STATUS_VALUES.TENANT_STATUS)
type TenantStatusArray = UnionToArray<(typeof TENANT_STATUS_ARRAY)[number]>

export const TENANT_STATUS = TENANT_STATUS_ARRAY as TenantStatusArray
export type TenantStatus = TenantStatusArray[number]
export const tenantStatusEnum = z.enum(TENANT_STATUS)

const TENANT_TYPE_ARRAY = typedValues(STATUS_VALUES.TENANT_TYPE)
type TenantTypeArray = UnionToArray<(typeof TENANT_TYPE_ARRAY)[number]>

export const TENANT_TYPE = TENANT_TYPE_ARRAY as TenantTypeArray
export type TenantType = TenantTypeArray[number]
export const tenantTypeEnum = z.enum(TENANT_TYPE)

export const TENANT_ADMIN_STATUS = ADMIN_STATUS_ARRAY as AdminStatusArray
export type TenantAdminStatus = AdminStatusArray[number]
export const tenantAdminStatusEnum = z.enum(TENANT_ADMIN_STATUS)

export const BUSINESS_CATEGORY = ["restaurant", "pharmacy"] as const
export type BusinessCategory = (typeof BUSINESS_CATEGORY)[number]
export const businessCategoryEnum = z.enum(BUSINESS_CATEGORY)

export const FAVORITE_CODES = {
  ADD_TO_FAVORITE: "ADD_TO_FAVORITE",
  REMOVE_FROM_FAVORITE: "REMOVE_FROM_FAVORITE"
} as const

export type HomeFilter = (typeof HOME_FILTERS)[keyof typeof HOME_FILTERS]

export const homeFilterEnum = z.enum(
  Object.values(HOME_FILTERS) as [string, ...string[]]
)

export type HomeSearchTarget =
  (typeof HOME_SEARCH_TARGETS)[keyof typeof HOME_SEARCH_TARGETS]

export const homeSearchTargetEnum = z.enum(
  Object.values(HOME_SEARCH_TARGETS) as [string, ...string[]]
)
export const TYPE_OF_SEARCH = ["products", "tenants"] as const
export type TypeOfSearch = (typeof TYPE_OF_SEARCH)[number]
export const typeOfSearchEnum = z.enum(TYPE_OF_SEARCH)

export const AVAILABLE_HOME_FILTERS = [
  {
    value: HOME_FILTERS.PRICE,
    label: { en: "Price", ar: "السعر", ur: "Qeemat" }
  },
  {
    value: HOME_FILTERS.DISTANCE,
    label: { en: "Distance", ar: "المسافة", ur: "Faasla" }
  },
  {
    value: HOME_FILTERS.TOP_SELLER,
    label: { en: "Top seller", ar: "الأكثر مبيعاً", ur: "Top seller" }
  },
  {
    value: HOME_FILTERS.OFFERS,
    label: { en: "Offers", ar: "العروض", ur: "Offers" }
  },
  {
    value: HOME_FILTERS.DEAL,
    label: { en: "Deals", ar: "الصفقات", ur: "Deals" }
  },
  {
    value: HOME_FILTERS.FREE_DELIVERY,
    label: { en: "Free delivery", ar: "توصيل مجاني", ur: "Free delivery" }
  },
  {
    value: HOME_FILTERS.FAST_DELIVERY,
    label: { en: "Fast delivery", ar: "توصيل سريع", ur: "Fast delivery" }
  },
  {
    value: HOME_FILTERS.RATING,
    label: { en: "Rating", ar: "التقييم", ur: "Rating" }
  },
  {
    value: HOME_FILTERS.NEW_ARRIVALS,
    label: { en: "New arrivals", ar: "وصل حديثاً", ur: "Nayi arrivals" }
  }
]

// ============================================================================
// COUNTRY CONSTANTS
// ============================================================================

/**
 * Available countries in the system
 */
export const AVAILABLE_COUNTRIES = ["PK", "JO"] as const

/**
 * Type for available country codes
 */
export type AvailableCountry = (typeof AVAILABLE_COUNTRIES)[number]

/**
 * Default country code
 */
export const DEFAULT_COUNTRY: AvailableCountry = "PK"

/**
 * Tenant POS support line — used by Settings → Support Team.
 * Update this value to change the dial target app-wide.
 */
export const SUPPORT_TEAM_PHONE_NUMBER = "+923156043137"

/**
 * Default map center (lat/lng) for location pickers when no coordinates exist yet.
 */
export const DEFAULT_MAP_CENTER_BY_COUNTRY: Record<
  AvailableCountry,
  { lat: number; lng: number }
> = {
  PK: { lat: 32.104_738, lng: 74.216_218 },
  JO: { lat: 31.2606, lng: 36.3317 }
}

/**
 * User profile country codes (lowercase; stored on `users.countryCode`)
 */
export const USER_COUNTRY_CODES = ["pk", "jod"] as const

export type UserCountryCode = (typeof USER_COUNTRY_CODES)[number]

export const DEFAULT_USER_COUNTRY_CODE: UserCountryCode = "pk"

// ============================================================================
// FREE DELIVERY RULES (PLATFORM-BASED)
// ============================================================================

/**
 * Free delivery is platform-decided (riders are platform-owned).
 * Rule types: zone, global_promo, merchant_funded, condition_based.
 */
export const FREE_DELIVERY_RULE_TYPES = [
  "zone",
  "global_promo",
  "merchant_funded",
  "condition_based"
] as const
export type FreeDeliveryRuleType = (typeof FREE_DELIVERY_RULE_TYPES)[number]

// ============================================================================
// FEE CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Country-specific fee configuration
 */
export interface CountryFeeConfig {
  /** Legacy fixed delivery fee in local currency. Per-km-only pricing keeps this at 0. */
  defaultDeliveryFee: number
  /** Maximum delivery distance in kilometers */
  maxFreeDeliveryDistanceKm: number
  /** Distance included before per-km charges apply */
  distanceThresholdKm: number | null
  /** Delivery fee per kilometer */
  deliveryFeePerKm: number
  /** Minimum order subtotal for free delivery when enabled. */
  freeDeliveryThreshold?: number
  /** Enables free delivery threshold or distance rules. */
  freeDeliveryThresholdEnabled?: boolean
  /** Maximum distance for subtotal-based free delivery, or distance-only free delivery when no subtotal threshold is set. */
  freeDeliveryDistanceKm?: number
}

export interface CountryTaxConfig {
  /** Tax rate for cash orders (decimal, e.g. 0.05 = 5%) */
  taxRateCash: number
  /** Tax rate for card/wallet orders (decimal, e.g. 0.15 = 15%) */
  taxRateCard: number
}

/**
 * Fee configuration per country
 */
export const COUNTRY_FEE_CONFIG: Record<AvailableCountry, CountryFeeConfig> = {
  PK: {
    defaultDeliveryFee: 0,
    maxFreeDeliveryDistanceKm: 20.0,
    distanceThresholdKm: null,
    deliveryFeePerKm: 20.0
  },
  JO: {
    defaultDeliveryFee: 0,
    maxFreeDeliveryDistanceKm: 20.0,
    distanceThresholdKm: null,
    deliveryFeePerKm: 0.6
  }
} as const

export const COUNTRY_TAX_CONFIG: Record<AvailableCountry, CountryTaxConfig> = {
  PK: {
    taxRateCash: 0.05,
    taxRateCard: 0.15
  },
  JO: {
    taxRateCash: 0.05,
    taxRateCard: 0.15
  }
} as const

/**
 * Default fee configuration (fallback)
 * Uses Jordan (JO) as default since it was the original config
 */
export const FEE_CONFIG: CountryFeeConfig = COUNTRY_FEE_CONFIG.JO
export const TAX_CONFIG: CountryTaxConfig = COUNTRY_TAX_CONFIG.JO

/**
 * Get fee configuration for a specific country
 * Falls back to default if country not found
 */
export function getFeeConfigForCountry(
  country: AvailableCountry | string | null | undefined
): CountryFeeConfig {
  if (!country) {
    return FEE_CONFIG
  }
  const upperCountry = country.toUpperCase()
  if (upperCountry in COUNTRY_FEE_CONFIG) {
    return COUNTRY_FEE_CONFIG[upperCountry as AvailableCountry]
  }
  return FEE_CONFIG
}

export function getTaxConfigForCountry(
  country: AvailableCountry | string | null | undefined
): CountryTaxConfig {
  if (!country) {
    return TAX_CONFIG
  }
  const upperCountry = country.toUpperCase()
  if (upperCountry in COUNTRY_TAX_CONFIG) {
    return COUNTRY_TAX_CONFIG[upperCountry as AvailableCountry]
  }
  return TAX_CONFIG
}

export const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED"] as const
export type DiscountType = (typeof DISCOUNT_TYPES)[number]

// ============================================================================
// PRICING CALCULATION FUNCTION
// ============================================================================

/**
 * Cart item input for pricing calculation
 */
export interface CartItemInput {
  /** Product price per unit */
  price: number
  /** Quantity of items */
  quantity: number
  /** Optional product identifier for reference */
  productId?: string
  /** Optional inventory identifier for reference */
  inventoryId?: string
}

/**
 * Promo code details for discount calculation
 */
export interface PromoCodeDetails {
  /** Discount type: "PERCENTAGE" or "FIXED" */
  discountType: "PERCENTAGE" | "FIXED"
  /** Discount value (percentage as number 0-100, or fixed amount) */
  discountValue: number
  /** Minimum order amount required for promo (optional) */
  minOrderAmount?: number | null
  /** Maximum discount amount (for percentage discounts, optional) */
  maxDiscountAmount?: number | null
  /** Whether promo is active */
  isActive: boolean
  /** Expiry date (optional) */
  validUntil?: Date | null
  /** Usage limit (optional) */
  usageLimit?: number | null
  /** Current usage count */
  usedCount: number
}

/**
 * Pricing calculation configuration
 */
export interface PricingCalculationConfig {
  /** Country code for country-specific fee configuration */
  country?: AvailableCountry | string | null
  /** Optional tenant/platform delivery settings that override country defaults. */
  feeConfig?: Partial<CountryFeeConfig>
  /** Feature flag gate: tax is applied only when explicitly true. */
  addTaxEnabled?: boolean
  /** Tax rate as decimal (e.g., 0.1 for 10%) - overrides country config if provided */
  taxRate?: number
  /** Payment method: when taxRate not provided, cash uses taxRateCash and card/wallet use taxRateCard from country config */
  paymentMethod?: PaymentMethod
  /** Delivery fee amount - overrides calculation if provided */
  deliveryFee?: number
  /** Platform fee amount - overrides calculation if provided */
  platformFee?: number
  /** Discount amount - overrides calculation if provided */
  discount?: number
  /** Tip amount */
  tip?: number | null
  /** Branch coordinates for distance-based delivery fee calculation */
  branchCoordinates?: {
    latitude: number
    longitude: number
  } | null
  /** Delivery address coordinates for distance-based delivery fee calculation */
  deliveryAddress?: {
    latitude: number
    longitude: number
  } | null
  /** Promo code details for discount calculation */
  promoCode?: PromoCodeDetails | null
  /** Subtotal (if already calculated, will be recalculated from items if not provided) */
  subtotal?: number
}

/**
 * Item pricing breakdown
 */
export interface ItemPricingBreakdown {
  /** Price per unit */
  unitPrice: number
  /** Quantity */
  quantity: number
  /** Subtotal for this item (unitPrice * quantity) */
  subtotal: number
}

/**
 * Complete pricing breakdown result
 */
export interface PricingCalculationResult {
  /** Individual item breakdowns */
  items: ItemPricingBreakdown[]
  /** Sum of all item subtotals */
  subtotal: number
  /** Tax amount (subtotal * taxRate) */
  tax: number
  /** Delivery fee */
  deliveryFee: number
  /** Platform fee */
  platformFee: number
  /** Discount amount */
  discount: number
  /** Tip amount */
  tip: number
  /** Grand total (subtotal + tax + deliveryFee + tip - discount) */
  total: number
  /** Complete breakdown for display */
  breakdown: {
    subtotal: number
    tax: number
    deliveryFee: number
    platformFee: number
    discount: number
    tip: number
    total: number
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 * @param lat1 - Latitude of first point in degrees
 * @param lon1 - Longitude of first point in degrees
 * @param lat2 - Latitude of second point in degrees
 * @param lon2 - Longitude of second point in degrees
 * @returns Distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = GEO_CONSTANTS.EARTH_RADIUS_KM
  const toRadians = (degrees: number) => degrees * (Math.PI / 180)
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate delivery fee based on subtotal, distance, and country config
 */
export function calculateDeliveryFee(
  subtotal: number,
  feeConfig: CountryFeeConfig,
  branchCoordinates?: { latitude: number; longitude: number } | null,
  deliveryAddress?: { latitude: number; longitude: number } | null
): number {
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return 0
  }

  // If no coordinates are provided, avoid falling back to a fixed fee.
  if (!(deliveryAddress && branchCoordinates)) {
    return 0
  }

  // Validate coordinates are valid numbers
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
    return 0
  }

  const distance = calculateDistance(
    branchLat,
    branchLon,
    deliveryLat,
    deliveryLon
  )

  if (!Number.isFinite(distance) || distance < 0) {
    return 0
  }

  const freeDeliveryEnabled = feeConfig.freeDeliveryThresholdEnabled === true
  const freeDeliveryThreshold = Math.max(
    0,
    Number(feeConfig.freeDeliveryThreshold ?? 0)
  )
  const freeDeliveryDistanceKm = Math.max(
    0,
    Number(feeConfig.freeDeliveryDistanceKm ?? 0)
  )

  if (freeDeliveryEnabled) {
    const isSubtotalEligible =
      freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold
    const isWithinFreeDeliveryDistance =
      freeDeliveryDistanceKm > 0 && distance <= freeDeliveryDistanceKm

    if (
      (isSubtotalEligible &&
        (freeDeliveryDistanceKm === 0 || isWithinFreeDeliveryDistance)) ||
      (freeDeliveryThreshold === 0 && isWithinFreeDeliveryDistance)
    ) {
      return 0
    }
  }

  const threshold = Math.max(0, Number(feeConfig.distanceThresholdKm ?? 0))
  const perKmFee = Math.max(0, Number(feeConfig.deliveryFeePerKm ?? 0))

  const billableKm = Math.max(0, distance - threshold)
  const finalFee = billableKm * perKmFee
  return Number.isFinite(finalFee) ? finalFee : 0
}

/**
 * Calculate tax based on subtotal and tax rate
 */
function calculateTax(subtotal: number, taxRate: number): number {
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return 0
  }
  if (!Number.isFinite(taxRate) || taxRate < 0) {
    return 0
  }
  const tax = subtotal * taxRate
  return Number.isFinite(tax) ? tax : 0
}

/**
 * Validate promo code eligibility
 */
function isPromoValid(promo: PromoCodeDetails, subtotal: number): boolean {
  if (!promo.isActive) {
    return false
  }

  if (promo.validUntil !== undefined && promo.validUntil !== null) {
    const now = new Date()
    if (promo.validUntil < now) {
      return false
    }
  }

  if (
    promo.usageLimit !== undefined &&
    promo.usageLimit !== null &&
    promo.usedCount >= promo.usageLimit
  ) {
    return false
  }

  if (
    promo.minOrderAmount !== undefined &&
    promo.minOrderAmount !== null &&
    subtotal < promo.minOrderAmount
  ) {
    return false
  }

  return true
}

/**
 * Calculate discount from promo code
 */
function calculatePromoDiscount(
  promo: PromoCodeDetails,
  subtotal: number
): number {
  if (!isPromoValid(promo, subtotal)) {
    return 0
  }

  let discount = 0
  if (promo.discountType === "PERCENTAGE") {
    const rate = Math.max(0, Math.min(100, promo.discountValue)) / 100
    discount = subtotal * rate
    if (
      promo.maxDiscountAmount !== undefined &&
      promo.maxDiscountAmount !== null
    ) {
      discount = Math.min(discount, Math.max(0, promo.maxDiscountAmount))
    }
    discount = Math.min(discount, subtotal)
  } else if (promo.discountType === "FIXED") {
    // Clamp discountValue to non-negative before applying to subtotal
    discount = Math.min(Math.max(0, promo.discountValue), subtotal)
  }

  return discount
}

/**
 * Calculate complete pricing breakdown for cart/checkout
 *
 * This function can be used by both frontend and backend to calculate
 * consistent pricing across the application. It handles all fee calculations
 * internally including delivery fee (distance-based), tax, and discount (promo-based).
 *
 * @param items - Array of cart items with price and quantity
 * @param config - Pricing configuration (country, coordinates, promo code, tip, etc.)
 * @returns Complete pricing breakdown with item details and totals
 *
 * @example
 * ```typescript
 * // Simple usage with pre-calculated fees
 * const result = calculatePricing(
 *   [
 *     { price: 10.50, quantity: 2 },
 *     { price: 5.00, quantity: 1 }
 *   ],
 *   {
 *     country: "PK",
 *     deliveryFee: 70.0,
 *     discount: 2.0,
 *     tip: 3.0
 *   }
 * )
 *
 * // Advanced usage with automatic fee calculation
 * const result = calculatePricing(
 *   items,
 *   {
 *     country: "PK",
 *     branchCoordinates: { latitude: 31.5204, longitude: 74.3587 },
 *     deliveryAddress: { latitude: 31.5497, longitude: 74.3436 },
 *     promoCode: {
 *       discountType: "PERCENTAGE",
 *       discountValue: 10,
 *       maxDiscountAmount: 50,
 *       isActive: true,
 *       usedCount: 0
 *     },
 *     tip: 5.0
 *   }
 * )
 * ```
 */
export function calculatePricing(
  items: CartItemInput[],
  config: PricingCalculationConfig = {}
): PricingCalculationResult {
  // Helper function to round to 2 decimal places
  const round2 = (n: number): number => {
    if (!Number.isFinite(n)) {
      return 0
    }
    return Math.round(n * 100) / 100
  }

  // Get country-specific fee configuration
  const feeConfig: CountryFeeConfig = {
    ...getFeeConfigForCountry(config.country),
    ...config.feeConfig
  }
  const taxConfig = getTaxConfigForCountry(config.country)

  // Calculate item-level pricing
  const itemBreakdowns: ItemPricingBreakdown[] = items.map((item) => {
    const unitPrice =
      Number.isFinite(item.price) && item.price >= 0 ? item.price : 0
    const quantity =
      Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 0
    const subtotal = round2(unitPrice * quantity)

    return {
      unitPrice: round2(unitPrice),
      quantity,
      subtotal
    }
  })

  // Calculate subtotal (use provided or calculate from items)
  const subtotal =
    config.subtotal !== undefined && Number.isFinite(config.subtotal)
      ? round2(Math.max(0, config.subtotal))
      : round2(itemBreakdowns.reduce((sum, item) => sum + item.subtotal, 0))

  // Calculate tax only when the add_tax feature is enabled.
  let taxRate: number
  if (config.addTaxEnabled !== true) {
    taxRate = 0
  } else if (Number.isFinite(config.taxRate) && config.taxRate !== undefined) {
    taxRate = Math.max(0, config.taxRate)
  } else if (config.paymentMethod === "cash") {
    taxRate = taxConfig.taxRateCash
  } else {
    taxRate = taxConfig.taxRateCard
  }
  const tax = round2(calculateTax(subtotal, taxRate))

  // Calculate delivery fee
  let deliveryFee: number
  if (Number.isFinite(config.deliveryFee) && config.deliveryFee !== undefined) {
    // Use provided delivery fee
    deliveryFee = Math.max(0, config.deliveryFee)
  } else {
    // Calculate delivery fee based on distance and country config
    deliveryFee = calculateDeliveryFee(
      subtotal,
      feeConfig,
      config.branchCoordinates,
      config.deliveryAddress
    )
  }
  deliveryFee = round2(deliveryFee)

  const platformFee =
    Number.isFinite(config.platformFee) && config.platformFee !== undefined
      ? round2(Math.max(0, config.platformFee))
      : 0

  // Calculate discount
  let discount: number
  if (Number.isFinite(config.discount) && config.discount !== undefined) {
    // Use provided discount
    discount = Math.max(0, config.discount)
  } else if (config.promoCode) {
    // Calculate discount from promo code
    discount = calculatePromoDiscount(config.promoCode, subtotal)
  } else {
    discount = 0
  }
  // Ensure discount doesn't exceed subtotal
  const cappedDiscount = round2(Math.min(discount, subtotal))

  // Calculate tip
  const tip =
    config.tip !== null &&
    config.tip !== undefined &&
    Number.isFinite(config.tip)
      ? Math.max(0, config.tip)
      : 0
  const tipRounded = round2(tip)

  // Calculate total
  const total = Math.max(
    0,
    round2(
      subtotal + tax + deliveryFee + platformFee + tipRounded - cappedDiscount
    )
  )

  return {
    items: itemBreakdowns,
    subtotal,
    tax,
    deliveryFee,
    platformFee,
    discount: cappedDiscount,
    tip: tipRounded,
    total,
    breakdown: {
      subtotal,
      tax,
      deliveryFee,
      platformFee,
      discount: cappedDiscount,
      tip: tipRounded,
      total
    }
  }
}

export const DEFAULT_LOCALE: Locale = "en"

// ============================================================================
// CURRENCY CONSTANTS
// ============================================================================

/**
 * ISO 4217 country code to currency code mapping
 * Used for formatting prices based on tenant's country
 */
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // Americas
  US: "USD",
  CA: "CAD",
  MX: "MXN",
  BR: "BRL",
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
  PE: "PEN",

  // Europe
  GB: "GBP",
  EU: "EUR",
  TR: "TRY",

  // Middle East
  PK: "PKR",
  JO: "JOD",
  AE: "AED",
  SA: "SAR",
  EG: "EGP",
  KW: "KWD",
  QA: "QAR",
  BH: "BHD",
  OM: "OMR",
  LB: "LBP",
  IQ: "IQD",
  SY: "SYP",
  YE: "YER",
  PS: "ILS",

  // Asia Pacific
  JP: "JPY",
  CN: "CNY",
  IN: "INR",
  AU: "AUD",
  NZ: "NZD",
  SG: "SGD",
  MY: "MYR",
  ID: "IDR",
  TH: "THB",
  PH: "PHP",
  VN: "VND",
  KR: "KRW",

  // Africa
  ZA: "ZAR",
  NG: "NGN",
  KE: "KES",
  GH: "GHS"
} as const

export const DEFAULT_CURRENCY = "USD"

/**
 * Get currency code from country code
 * Falls back to USD if country not found
 */
export function getCurrencyFromCountry(countryCode: string): string {
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] ?? DEFAULT_CURRENCY
}

// ============================================================================
// RIDER CASH BLOCK CONSTANTS
// ============================================================================

/**
 * Cash block thresholds per currency.
 * Riders are blocked if they hold cash above threshold for more than CASH_BLOCK_DAYS.
 */
export const CASH_BLOCK_THRESHOLD = {
  PKR: 1000, // Pakistani riders: 1000 PKR
  JOD: 2.53 // Jordanian riders: equivalent to 1000 PKR in JOD (~2.53 JOD)
} as const

/**
 * Number of days a rider can hold cash above threshold before being blocked
 */
export const CASH_BLOCK_DAYS = 7

/**
 * Marketplace tenant settlement block thresholds.
 * Tenants are blocked if their outstanding settlement stays above threshold
 * for more than PLATFORM_FEE_BLOCK_DAYS.
 */
export const PLATFORM_FEE_BLOCK_THRESHOLD_PKR = 1000
export const PLATFORM_FEE_BLOCK_DAYS = 7
export const PLATFORM_FEE_BLOCK_WARNING_DAYS_BEFORE = 1

/** Redis dedupe keys for tenant platform-fee notifications. Must match auth-service cron keys. */
export const TENANT_PLATFORM_FEE_THRESHOLD_NOTIFICATION_KEY =
  "tenant:platform_fee:threshold_notified:"
export const TENANT_PLATFORM_FEE_BLOCK_WARNING_NOTIFICATION_KEY =
  "tenant:platform_fee:block_warning_notified:"
export const TENANT_PLATFORM_FEE_BLOCKED_NOTIFICATION_KEY =
  "tenant:platform_fee:blocked_notified:"

// ============================================================================
// SHIFT MANAGEMENT CONSTANTS
// ============================================================================

// Shift slot statuses
export const SHIFT_SLOT_STATUS = {
  DRAFT: "DRAFT",
  RELEASED: "RELEASED",
  FULL: "FULL",
  CANCELLED: "CANCELLED"
} as const

export type ShiftSlotStatus =
  (typeof SHIFT_SLOT_STATUS)[keyof typeof SHIFT_SLOT_STATUS]

export const shiftSlotStatusEnum = z.enum(
  Object.values(SHIFT_SLOT_STATUS) as [string, ...string[]]
)

// Shift booking statuses
export const SHIFT_BOOKING_STATUS = {
  BOOKED: "BOOKED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
  CHECKED_IN: "CHECKED_IN",
  CHECKED_OUT: "CHECKED_OUT",
  NO_SHOW: "NO_SHOW",
  SWAP_REQUESTED: "SWAP_REQUESTED",
  SWAPPED: "SWAPPED",
  SWAP_EXPIRED: "SWAP_EXPIRED"
} as const

export type ShiftBookingStatus =
  (typeof SHIFT_BOOKING_STATUS)[keyof typeof SHIFT_BOOKING_STATUS]

export const shiftBookingStatusEnum = z.enum(
  Object.values(SHIFT_BOOKING_STATUS) as [string, ...string[]]
)

// Redis TTL (Time To Live) in seconds
export const SHIFT_REDIS_TTL = {
  RIDER_LOCATION: 300, // 5 minutes
  ONLINE_STATUS: 300 // 5 minutes
} as const

// Check-in/Check-out time windows (in minutes)
export const SHIFT_CHECKIN_WINDOW = {
  BEFORE_START: 15, // Can check-in 15 minutes before shift starts
  AFTER_START: 30 // Can check-in up to 30 minutes after shift starts
} as const

// Cancellation policy - time thresholds (in hours)
export const SHIFT_CANCELLATION_POLICY = {
  LATE_CANCELLATION_HOURS: 2, // Less than 2 hours = late cancellation
  SHORT_NOTICE_HOURS: 24 // 2-24 hours = short notice
} as const

// Penalty points for violations
export const SHIFT_PENALTIES = {
  LATE_CANCELLATION: 5, // Cancel within 2 hours of shift
  SHORT_NOTICE_CANCELLATION: 2, // Cancel 2-24 hours before shift
  NO_SHOW: 10, // Didn't show up for booked shift
  SWAP_TRANSFER: 3,
  SWAP_MISSED: 7
} as const

/**
 * Early-launch assignment loop (1–2 platform riders).
 * Used by discovery when offering orders; kept here so every backend shares the knobs.
 */
export const RIDER_ASSIGNMENT_LOOP = {
  /** Wait before re-offering the same rider when they are the only one available. */
  SINGLE_RIDER_REOFFER_DELAY_MS: 15 * 1000,
  /** Apply ignore penalty every N missed offers (same rider + same order). */
  IGNORE_PENALTY_EVERY: 3,
  IGNORE_PENALTY_POINTS: 2,
  /** Cap extra penalty points from ignores on a single order. */
  IGNORE_PENALTY_MAX_PER_ORDER: 6
} as const

// Auto-checkout grace period (in minutes)
export const SHIFT_AUTO_CHECKOUT = {
  GRACE_PERIOD_MINUTES: 30, // Auto-checkout 30 minutes after shift end
  ZONE_LEAVE_GRACE_MINUTES: 5 // Auto-checkout if rider leaves zone for more than 5 minutes
} as const

// Geographic constants
export const GEO_CONSTANTS = {
  EARTH_RADIUS_KM: 6371, // Earth's radius in kilometers (for distance calculations)
  DEFAULT_SEARCH_RADIUS_KM: 30 // Default radius for nearby rider search
} as const

// Shift slot defaults
export const SHIFT_DEFAULTS = {
  DEFAULT_CAPACITY: 10, // Default number of riders per shift slot
  MAX_CAPACITY: 1000, // Maximum riders per shift slot
  WEEKS_AHEAD_RELEASE: 1, // Release shifts 1 week in advance
  /** Minimum slot length, and minimum remaining minutes to book or check in. */
  MIN_DURATION_MINUTES: 60
} as const

/**
 * Break limits based on shift duration (in hours)
 * Each entry represents: [minHours, maxHours, breakLimit]
 * Shifts are matched to the first range where minHours <= duration < maxHours
 */
export const BREAK_LIMITS_BY_DURATION = [
  [0, 5, 1], // 0-5 hours: 1 break
  [5, 8, 2], // 5-8 hours: 2 breaks
  [8, 10, 3], // 8-10 hours: 3 breaks
  [10, 12, 4], // 10-12 hours: 4 breaks
  [12, Number.POSITIVE_INFINITY, 5] // 12+ hours: 5 breaks
] as const

/**
 * Break duration limits and notifications
 */
export const BREAK_DURATION = {
  MAX_MINUTES_PER_BREAK: 20, // Maximum minutes allowed per break
  WARNING_MINUTES_BEFORE_END: 3, // Notify rider 3 minutes before break ends
  CHECK_INTERVAL_MINUTES: 1 // Check for break warnings every 1 minute
} as const

export const PRODUCT_TYPE = ["product", "addon", "deal"] as const
export type ProductType = (typeof PRODUCT_TYPE)[number]

export const SKU_REGEX = /^[A-Z0-9\-_]+$/

/** Public URL slug format, shared with the marketplace website's validation. */
export const SLUG_REGEX = /^[a-z0-9-]+$/

export const SLUG_MAX_LENGTH = 120

/**
 * Slugs the marketplace website's router already owns (static routes plus
 * every supported locale prefix), so no tenant may take one. Single source of
 * truth for backend slug generation AND the website's segment resolver — the
 * frontend-core copy re-exports from here.
 */
export const RESERVED_SLUGS = [
  "cart",
  "checkout",
  "order",
  "search",
  "about",
  "api",
  "_next",
  ...SUPPORTED_LANGUAGES
] as const

const RESERVED_SLUG_SET: ReadonlySet<string> = new Set(RESERVED_SLUGS)

/** True when a raw URL segment collides with a static route or locale prefix. */
export const isReservedSlug = (value: string): boolean =>
  RESERVED_SLUG_SET.has(value.toLowerCase())

// ============================================================================
// COUPON CONSTANTS
// ============================================================================

export const COUPON_TYPE = ["percentage", "fixed"] as const
export type CouponType = (typeof COUPON_TYPE)[number]

export const COUPON_STATUS = ["active", "inactive", "expired"] as const
export type CouponStatus = (typeof COUPON_STATUS)[number]

/** Target segment for app-level vouchers: who can see and use the coupon. */
export const COUPON_TARGET_SEGMENT = ["all", "first_order", "new_user"] as const
export type CouponTargetSegment = (typeof COUPON_TARGET_SEGMENT)[number]

/** Days after registration to consider user "new" for new_user segment. */
export const COUPON_NEW_USER_DAYS = 30
export const COUPON_CURRENCY = ["PKR", "JOD"] as const
export type CouponCurrency = (typeof COUPON_CURRENCY)[number]

export const REQUEST_TYPE = ["category", "feature"] as const
export type RequestType = (typeof REQUEST_TYPE)[number]

// ============================================================================
// ADS / BANNERS CONSTANTS
// ============================================================================

export const AD_STATUS = ["active", "inactive"] as const
export type AdStatus = (typeof AD_STATUS)[number]

/** Platform the ad/banner is targeted at. */
export const AD_PLATFORMS = ["web", "mobile"] as const
export type AdPlatform = (typeof AD_PLATFORMS)[number]

/** Aspect ratio the customer app should render the banner with. */
export const AD_ASPECT_RATIOS = [
  "2.4:1",
  "16:9",
  "4:3",
  "3:2",
  "1:1",
  "2:1",
  "3:1"
] as const
export type AdAspectRatio = (typeof AD_ASPECT_RATIOS)[number]

/** Aspect ratios available per platform (web banners are wider). */
export const AD_PLATFORM_ASPECT_RATIOS: Record<
  AdPlatform,
  readonly AdAspectRatio[]
> = {
  web: ["16:9", "2:1", "3:1"],
  mobile: ["2.4:1", "16:9", "4:3", "3:2", "1:1", "2:1"]
} as const

/** What happens when the customer taps the ad. */
export const AD_CLICK_ACTIONS = ["none", "external", "internal"] as const
export type AdClickAction = (typeof AD_CLICK_ACTIONS)[number]

/** Customer app screens an internal ad click can navigate to. */
export const AD_INTERNAL_SCREENS = [
  "home",
  "search",
  "offers",
  "vouchers",
  "grocery",
  "product_detail",
  "deal_detail",
  "tenant_detail"
] as const
export type AdInternalScreen = (typeof AD_INTERNAL_SCREENS)[number]

/**
 * Detail screens that require a target entity id
 * (e.g. product_detail opens a specific product).
 */
export const AD_ENTITY_SCREENS = {
  product_detail: "product",
  deal_detail: "deal",
  tenant_detail: "tenant"
} as const
export type AdEntityScreen = keyof typeof AD_ENTITY_SCREENS

export const isAdEntityScreen = (
  screen: string | null | undefined
): screen is AdEntityScreen => screen != null && screen in AD_ENTITY_SCREENS

/**
 * Detail screens whose target is sold per branch. A product or deal belongs
 * to a business but is priced and stocked per branch, so the ad also stores
 * the branch. `tenant_detail` is not here: its target is already a branch.
 */
export const AD_BRANCH_SCOPED_SCREENS = [
  "product_detail",
  "deal_detail"
] as const
export type AdBranchScopedScreen = (typeof AD_BRANCH_SCOPED_SCREENS)[number]

export const isAdBranchScopedScreen = (
  screen: string | null | undefined
): screen is AdBranchScopedScreen =>
  screen != null &&
  (AD_BRANCH_SCOPED_SCREENS as readonly string[]).includes(screen)

// ============================================================================
// SUBSCRIPTION BLOCKED — MANUAL PAYMENT (tenant admin)
// ============================================================================

export * from "./feature-flags"
export * from "./predefined-roles"
export {
  GEO_AREA_SLUGS,
  GEO_CITY_SLUGS,
  GEO_LOCATION_OTHER,
  GEO_TAXONOMY_SEED,
  USER_AREA_SLUGS,
  USER_CITY_SLUGS,
  type GeoAreaSlug,
  type GeoCitySlug,
  type GeoLocationOther,
  type GeoTaxonomySeed,
  type UserAreaSlug,
  type UserCitySlug
} from "./geo-taxonomy/seed"
export {
  COUNTRY_SUBSCRIPTION_CONFIG,
  getExpectedSubscriptionClaimAmount,
  getSubscriptionManualPaymentCurrency,
  getSubscriptionPaymentConfigForCountry,
  getSubscriptionPayoutMethodMeta,
  isSubscriptionIbanNotApplicable,
  toSubscriptionManualPaymentMethodKey,
  SUBSCRIPTION_DAY_OPTIONS,
  SUBSCRIPTION_MANUAL_PAYMENT_CURRENCY,
  SUBSCRIPTION_PAYMENT_COUNTRIES,
  type CountrySubscriptionConfig,
  type PaymentMethodConfig,
  type SubscriptionDayOption,
  type SubscriptionManualPaymentMethodKey,
  type SubscriptionPaymentCountry,
  type SubscriptionPaymentBrand,
  type SubscriptionPayoutMethodMeta
} from "./subscription-payment"
export {
  ALL_PLAN_POS_FLAGS,
  getExpectedSubscriptionClaimAmountForPlan,
  isPaidSubscriptionPlan,
  isSubscriptionPlan,
  MARKETPLACE_FEATURE_FLAGS,
  PAID_SUBSCRIPTION_PLANS,
  PLAN_APPLY_NEVER_TOUCH_FLAGS,
  resolvePlanFlags,
  SUBSCRIPTION_PLAN_CODES,
  SUBSCRIPTION_PLANS,
  type PaidSubscriptionPlan,
  type SubscriptionPlan
} from "./subscription-plans"
