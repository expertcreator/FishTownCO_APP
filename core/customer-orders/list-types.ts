// biome-ignore-all lint/style/useConsistentTypeDefinitions: verbatim copy from mobile-tenant-app (mw-4-3) — rewriting these to `interface` is an UNSAFE fix that breaks the token-equivalence AC, and interfaces get no implicit index signature. Suppressed in-file so it travels to every app that mounts core.
/**
 * The orders-LIST row shape, copied from `mobile-tenant-app`'s
 * `features/orders/components/OrderCard/OrderCard.type.ts` (`mw-4-3`).
 * `OrderCardProps` is deliberately not copied — component prop types are not
 * core's business.
 *
 * **`OrderStatus` here is NOT `ORDER_STATUS` from `@/constants`, and the source
 * comment below claiming they are aligned is wrong.** Measured 2026-08-30:
 * `@/constants` carries 8 members and includes `on_hold`; this union carries 12,
 * adding `inprogress`, `pickup`, `picked_up` and the second spelling `canceled`,
 * and omitting `on_hold`. `isOrderCancellable` reads THIS union. Substituting the
 * constants enum would be a behaviour change wearing deduplication as a disguise,
 * so the union is copied rather than imported.
 */

// Keep aligned with ORDER_STATUS in constants; includes delivery lifecycle states
export type OrderStatus =
  | "pending"
  | "inprogress"
  | "confirmed"
  | "preparing"
  | "ready"
  | "pickup"
  | "picked_up"
  | "completed"
  | "rejected"
  | "cancelled"
  | "canceled"

export type OrderItem = {
  totalQuantity: number
  id: string
  orderNumber?: string
  status: OrderStatus
  total: number
  itemsCount: number
  firstItemImage?: string | null
  firstItemName?: string | { ar?: string; en?: string; ur?: string }
  firstItemIsDeal?: boolean
  firstItemDealId?: string | null
  firstItemType?: string
  firstItemVariantDetails?: unknown
  firstItem?: {
    dealId?: string | null
    isDeal?: boolean
    variantDetails?: unknown
  }
  dealId?: string | null
  isDeal?: boolean
  branch?: {
    id: string
    name?: string
    image?: string
    location?: string
    countryCode?: string
  }
  createdAt?: string
  paymentStatus?: string
  reOrder?: boolean
  available?: boolean
  menuSlugs?: string[]
  liveMenuSlug?: string | null
  deliveryStatus?: string | null
  estimatedDeliveryTime?: string | null
  cancellationReason?: string
  cancelledAt?: string | null
  cancelledBy?: string | null
  customerName?: string
  /** From orders list API when provided (e.g. `Delivery` / `TakeAway`). */
  orderType?: "Delivery" | "TakeAway" | "DineIn" | string
  fulfillmentType?: "delivery" | "takeaway" | "dinein"
  estimatedMinutes?: number | null
  /** True when POS modified the order after customer call confirmation. */
  isModified?: boolean
  /** Detail/list history — `notes: "ORDER_MODIFIED"` also shows the badge. */
  orderStatusHistory?: Array<{ notes?: string | null }>
  items?: Array<{
    isDeleted?: boolean
    deletedAt?: string | null
    dealId?: string | null
    variantDetails?: unknown
    isDeal?: boolean
    roundNo?: number
    available?: boolean
    menuSlugs?: string[]
    liveMenuSlug?: string | null
  }>
}
