// biome-ignore-all lint/style/useConsistentTypeDefinitions: verbatim copy from mobile-tenant-app (mw-4-3) — rewriting these to `interface` is an UNSAFE fix that breaks the token-equivalence AC, and interfaces get no implicit index signature. Suppressed in-file so it travels to every app that mounts core.
/**
 * Customer order API payload types, copied verbatim from `mobile-tenant-app`'s
 * `features/orders/types/orderApi.ts` (`mw-4-3`).
 *
 * These describe what the orders endpoints actually send, wrapper shapes and
 * optional-everything included — they are not a tidied model of what an order
 * ought to be. Fields that look redundant (`data` nested inside `data`, both
 * `platformFee` and `platform_fee`) are redundant on the wire, and the readers
 * in this domain exist precisely to absorb that. Do not narrow a field here to
 * make a consumer simpler; narrow it in the consumer.
 *
 * Zero imports, as in the source. `list-types.ts` holds the orders-LIST shape,
 * which is a different payload from the same backend.
 */

export type OrderItemDealSelection =
  | { groupId: string; productId: string; combinationId?: never }
  | { groupId: string; combinationId: string; productId?: never }

export type CreateOrderRequest = {
  addressId?: string
  idempotencyKey?: string
  paymentMethod: "cash" | "card" | "wallet"
  customerPhone?: string
  tip?: number
  promoCode?: string | null
  lat?: number
  lng?: number
  deliveryInstructions?: string
  unavailableProductAction?: "remove" | "call" | "cancel"
  /** When true, delivery fee is not added (product/branch has free delivery) */
  freeDelivery?: boolean
  orders: Array<{
    branchId: string
    /** When pricing used `GET tenants/:id/delivery-charges` rule */
    deliveryChargeRuleId?: string
    fulfillmentType?: "delivery" | "takeaway" | "dinein"
    notes?: string
    items: Array<
      | {
          productId: string
          inventoryId: string
          quantity: number
          unavailableProductAction?: "remove" | "call" | "cancel"
          /** Variant/combination ID when product has variants */
          variantId?: string
          /** Persisted on `order_items.variantDetails` (single + multi modifiers). */
          variantDetails?: Record<string, unknown>
          /** Addons attached to this item */
          addons?: Array<{
            productId: string
            inventoryId: string
            quantity: number
          }>
        }
      | {
          dealId: string
          quantity: number
          selections: OrderItemDealSelection[]
          addons?: Array<{
            productId: string
            inventoryId: string
            quantity: number
          }>
          unavailableProductAction?: "remove" | "call" | "cancel"
        }
    >
    // Pricing breakdown for this order
    pricing?: {
      subtotal: number
      tax: number
      deliveryFee?: number
      platformFee?: number
      discount: number
      tip: number
      total: number
    }
  }>
  // Overall pricing breakdown (sum of all orders)
  pricing?: {
    subtotal: number
    tax: number
    deliveryFee?: number
    platformFee?: number
    discount: number
    tip: number
    total: number
  }
}

/** Optional fields when placement adjusts or drops lines server-side (Story 11.1). */
export type CreateOrderResponseDataUnavailable = {
  productId?: string
  inventoryId?: string
  name?: string
  /** Backend may send this instead of `name`. */
  productName?: string
  reason?: string
}

export type CreateOrderResponse = {
  success: boolean
  message?: string
  data?: {
    orderId: string
    orderNumber?: string
    status?: string
    totalAmount?: number
    orders?: Array<{
      id: string
      orderNumber?: string
      status?: string
    }>
    /** Server removed or could not fulfill these lines; mobile may keep them in local cart. */
    unavailableItems?: CreateOrderResponseDataUnavailable[]
    removedFromOrder?: CreateOrderResponseDataUnavailable[]
    removedItems?: CreateOrderResponseDataUnavailable[]
    placementOutcome?: "full" | "partial"
  }
}

export type GetOrdersParams = {
  page?: number
  limit?: number
  status?:
    | "all"
    | "pending"
    | "confirmed"
    | "inprogress"
    | "preparing"
    | "ready"
    | "pickup"
    | "picked_up"
    | "completed"
    | "rejected"
    | "cancelled"
  startDate?: string
  endDate?: string
  dateRange?: "last_7_days" | "last_15_days" | "last_30_days"
}

export type GetOrdersResponse = {
  items: Array<{
    id: string
    orderNumber?: string
    status:
      | "pending"
      | "confirmed"
      | "inprogress"
      | "preparing"
      | "ready"
      | "pickup"
      | "picked_up"
      | "completed"
      | "rejected"
      | "cancelled"
    cancellationReason?: string
    cancelledAt?: string | null
    cancelledBy?: string | null
    total: number
    itemsCount: number
    createdAt: string
    updatedAt?: string
    paymentStatus?: string
    deliveryStatus?: string | null
    estimatedDeliveryTime?: string | null
    estimatedMinutes?: number | null
    tracking?: {
      estimatedMinutes?: number | null
    } | null
    firstItemImage?: string | null
    firstItemName?: string | { ar?: string; en?: string }
    /** Shown on order history cards; aligns with `data.orderType` on order detail when present. */
    orderType?: "Delivery" | "TakeAway" | "DineIn" | string
    fulfillmentType?: "delivery" | "takeaway" | "dinein"
    branch?: {
      id: string
      name?: string
      image?: string
      location?: string
      countryCode?: string
    }
    reOrder?: boolean
    available?: boolean
    menuSlugs?: string[]
    liveMenuSlug?: string | null
  }>
  total?: number
  page?: number
  limit?: number
  data?: {
    items?: []
  }
}

export type OrderStatusHistoryUser = {
  id?: string
  name?: string
  email?: string
  image?: string
  phone?: string
}

export type OrderStatusHistoryEntry = {
  id: string
  orderId: string
  oldStatus: string
  newStatus: string
  changedAt: string
  createdAt?: string
  updatedAt?: string
  notes?: string | null
  updatedBy?: string | null
  updatedByUser?: OrderStatusHistoryUser | null
}

export type OrderDetailItem = {
  id: string
  orderId: string
  /** Null for deal-only lines (rate via dealId / dealRatings). */
  productId: string | null
  inventoryId: string
  quantity: number
  price: string
  subtotal: string
  sku?: string
  productName: {
    en: string
    ar: string
  }
  product: {
    id: string
    name: Array<{ language: string; value: string }>
    images: string[]
    tenantId?: string
    categoryId?: string
    rating?: string
    status?: string
  }
  inventory: {
    id: string
    branchId: string
    productId: string | null
    price: string
    stock?: number
    sku?: string
  }
  variantDetails?: unknown
  /** When set, this line is a deal; selections required for cart/checkout */
  dealId?: string
  selections?: OrderItemDealSelection[]
  /** Nested addons as stored on the order line (alternative to separate addon lines) */
  addons?: Array<{
    productId: string
    inventoryId: string
    quantity: number
    product?: OrderDetailItem["product"]
    addonId?: string
    price?: string | number
  }>
  variantId?: string
  unavailableProductAction?: "remove" | "call" | "cancel"
  /** Separate row representing an addon product linked to a parent line */
  isAddon?: boolean
  parentOrderItemId?: string
  parentItemId?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  /** POS add-item round; > 1 means the line was added after the original order. */
  roundNo?: number
  roundSentAt?: string | null
  available?: boolean
  menuSlugs?: string[]
  liveMenuSlug?: string | null
  isDeleted?: boolean
}

/** Customer's submitted review on GET order detail (mirrors rate payload when present). */
export type OrderMyReview = {
  productRatings?: Array<{
    productId: string
    rating: number
    comment?: string
  }>
  riderRating?: {
    rating: number
    comment?: string
  }
  rating?: number
  stars?: number
  comment?: string
  review?: string
}

export type GetOrderDetailResponse = {
  id: string
  orderNumber?: string
  cancellationReason: string
  orderStatus:
    | "pending"
    | "confirmed"
    | "inprogress"
    | "preparing"
    | "ready"
    | "pickup"
    | "picked_up"
    | "completed"
    | "rejected"
    | "cancelled"
  status:
    | "pending"
    | "confirmed"
    | "inprogress"
    | "preparing"
    | "ready"
    | "pickup"
    | "picked_up"
    | "completed"
    | "rejected"
    | "cancelled"
  total: number
  itemsCount: number
  createdAt: string
  updatedAt?: string
  reOrder?: boolean
  available?: boolean
  menuSlugs?: string[]
  liveMenuSlug?: string | null
  paymentStatus?: string
  deliveryStatus?: string | null
  deliveryProvider?:
    | "own_rider"
    | "platform_rider"
    | "customer_pickup"
    | string
    | null
  estimatedDeliveryTime?: string | null
  data: {
    orderNumber?: string
    total: number
    id: string
    status:
      | "pending"
      | "confirmed"
      | "inprogress"
      | "preparing"
      | "ready"
      | "pickup"
      | "picked_up"
      | "completed"
      | "rejected"
      | "cancelled"
    orderType?: "Delivery" | "TakeAway" | "DineIn"
    deliveryProvider?:
      | "own_rider"
      | "platform_rider"
      | "customer_pickup"
      | string
      | null
    customer: { name: string; phone: string; address: string }
    cancellationReason: string
    cancelledAt?: string | null
    cancelledBy?: string | null
    customerName?: string
    orderStatusHistory?: OrderStatusHistoryEntry[]
    items: OrderDetailItem[]
    orderStatus:
      | "pending"
      | "confirmed"
      | "inprogress"
      | "preparing"
      | "ready"
      | "pickup"
      | "picked_up"
      | "completed"
      | "rejected"
      | "cancelled"
    tracking: {
      deliveryAddress: {
        latitude: number
        longitude: number
        label: string
        addressLine1: string
        city: string
        state: string
        country: string
      }
      timeline?: string[]
      estimatedMinutes?: number | null
      estimatedDeliveryTime?: string | null
      estimatedPreparationTime?: string | null
      driver: {
        location: {
          latitude: number
          longitude: number
        }
        phone?: string
        role?: string
        id?: string
        name?: string
        image?: { uri: never }
      }
    }
    createdAt: string

    deliveryFee?: number
    freeDelivery?: boolean
    discount?: number
    tax?: number
    paymentMethod?: string
    pricing?: {
      subtotal?: number
      deliveryFee?: number
      discount?: number
      tax?: number
      total?: number
    }

    /** Present on detail when backend supports it; null until the customer rates. */
    myReview?: OrderMyReview | null

    /** Ticket 13/79 revision axis — independent of orderStatus. */
    revisionStatus?:
      | "revision_pending"
      | "revision_approved"
      | "revision_rejected"
      | "revision_expired"
      | null
    preRevisionOrderId?: string | null
    /** ISO deadline for pending revisions (ticket 80). */
    revisionExpiryDeadline?: string | null
    /** True when POS modified the order after customer call confirmation. */
    isModified?: boolean
    modifiedAt?: string | null
    reOrder?: boolean
    available?: boolean
    menuSlugs?: string[]
    liveMenuSlug?: string | null

    branch: {
      restaurantPicture: string
      name: {
        en: string
        ar: string
      }
      countryCode: string
      location?: string
      address?: string
      addressLine1?: string
      city?: string
      state?: string
      image?: string
      phone?: string
      contactPhone?: string
      restaurantPhone?: string
      /** When present, matches cart `branchOrderFulfillment` (avoids extra tenant fetch on reorder). */
      orderFulfillment?: "delivery" | "pickup" | "hybrid"
      deliveryProvider?:
        | "own_rider"
        | "platform_rider"
        | "customer_pickup"
        | string
        | null
      isDeliveredByFishtownco?: boolean
    }
  }

  branch?: {
    id: string
    name?:
      | {
          en?: string
          ar?: string
        }
      | string
    image?: string
    location?: string
    countryCode?: string
    orderFulfillment?: "delivery" | "pickup" | "hybrid"
    deliveryProvider?:
      | "own_rider"
      | "platform_rider"
      | "customer_pickup"
      | string
      | null
    isDeliveredByFishtownco?: boolean
  }
  items?: OrderDetailItem[]
  /**
   * Root-level status history, sibling to root `branch`/`items`/`tracking`.
   * `business-discovery-backend`'s `orderService.getOrder()` returns it here,
   * not under `data` — a consumer that unwraps the envelope (web's proxy does,
   * twice) sees only this one.
   */
  orderStatusHistory?: OrderStatusHistoryEntry[]
  customer?: {
    name?: string
    phone?: string
    address?: string
  }
  tracking?: {
    deliveryAddress?: {
      latitude?: number | string
      longitude?: number | string
      label?: string
      addressLine1?: string
      city?: string
      state?: string
      country?: string
    }
    timeline?: string[]
    driver?: {
      name?: string
      role?: string
      phone?: string
      image?: string | { uri: string } | number
      location?: {
        latitude?: number | string
        longitude?: number | string
      }
    }
  }
}

export type CancelOrderRequest = {
  reason: string
}

export type CancelOrderResponse = {
  success: boolean
  message?: string
  data?: {
    id: string
    status?: string
    canceledAt?: string
  }
}

export type UpdateOrderFulfillmentRequest =
  | {
      orderType: "pickup" | "takeaway"
    }
  | {
      orderType: "delivery"
      addressId: string
      lat?: number
      lng?: number
    }

export type UpdateOrderFulfillmentResponse = {
  success: boolean
  message?: string
  data?: GetOrderDetailResponse["data"]
}

export type OrderSuggestionsResponse = {
  data: {
    items: Array<{
      id: string
      name: { ar?: string; en?: string }
      images: string[]
      price: string
      rating: string
      branch: {
        id: string
        name: { ar?: string; en?: string }
        rating: string
        timeRange?: { min?: number | string; max?: number | string }
      }
    }>
  }
  total?: number
}

/** POST /orders/{orderId}/rate — product / deal + rider use numeric 1–5 ratings */
export type RateOrderRequest = {
  productRatings?: Array<{
    productId: string
    rating: number
    comment?: string
  }>
  /** Deal-only order lines (productId null) — backend must accept this. */
  dealRatings?: Array<{
    dealId: string
    rating: number
    comment?: string
  }>
  riderRating?: {
    rating: number
    comment?: string
  }
}

export type RateOrderResponse = {
  success: boolean
  message?: string
  data?: {
    id: string
    orderId: string
    review?: string
    createdAt?: string
  }
}

export type RateBranchRequest = {
  orderId: string
  rating: number // 1-5 stars
}

export type RateBranchResponse = {
  success: boolean
  message?: string
  data?: {
    id: string
    orderId: string
    branchId?: string
    rating: number
    createdAt?: string
  }
}

/**
 * Socket data structure for order:updated events
 */
export type OrderStatusChangeSocketData = {
  orderId: string
  orderNumber: string
  orderStatus: string
  previousStatus: string
  driverId: string | null
  deliveryStatus: string | null
  cancellationReason: string | null
  updatedAt: string
  /** Ticket 79 — enriched on revision transitions. */
  revisionStatus?: string | null
  preRevisionOrderId?: string | null
  revisionExpiryDeadline?: string | null
}
