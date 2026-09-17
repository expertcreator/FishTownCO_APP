function normalizeOrderType(orderType: string | null | undefined) {
  return String(orderType ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "")
}

function normalizeDeliveryProvider(
  deliveryProvider: string | null | undefined
) {
  return String(deliveryProvider ?? "")
    .trim()
    .toLowerCase()
}

/**
 * Whether staff can convert a marketplace delivery ticket to pickup.
 * Only pending tickets can change; later kitchen statuses cannot.
 * Fishtownco rider (`platform_rider`) tickets stay delivery — the rider owns them.
 * @param input - Ticket flags
 * @param input.isOnlineOrder - `true` for marketplace tickets
 * @param input.orderType - DineIn, TakeAway, or Delivery
 * @param input.orderStatus - Current kitchen status
 * @param input.deliveryProvider - Rider / pickup provider
 * @returns `true` when change-to-pickup is allowed
 */
export function canChangeOnlineDeliveryToPickup(input: {
  isOnlineOrder?: boolean | null
  orderType?: string | null
  orderStatus?: string | null
  deliveryProvider?: string | null
}): boolean {
  const status = String(input.orderStatus ?? "")
    .trim()
    .toLowerCase()
  return (
    input.isOnlineOrder === true &&
    normalizeOrderType(input.orderType) === "delivery" &&
    status === "pending" &&
    normalizeDeliveryProvider(input.deliveryProvider) !== "platform_rider"
  )
}

/**
 * Whether the restaurant should see the delivery fee line.
 * Platform-rider fees are excluded. Own-rider delivery always shows.
 * Marketplace delivery also shows when a fee is present.
 * @param input - Ticket type, rider, and fee
 * @param input.orderType - DineIn, TakeAway, or Delivery
 * @param input.deliveryProvider - Rider / pickup provider
 * @param input.deliveryFee - Stored delivery fee
 * @param input.isOnlineOrder - `true` for marketplace tickets
 * @returns `true` when the fee row should render
 */
export function shouldShowRestaurantDeliveryFee(input: {
  orderType?: string | null
  deliveryProvider?: string | null
  deliveryFee?: number | string | null
  isOnlineOrder?: boolean | null
}): boolean {
  const fee = Number(input.deliveryFee ?? 0)
  if (!Number.isFinite(fee) || fee <= 0) {
    return false
  }
  if (normalizeOrderType(input.orderType) !== "delivery") {
    return false
  }
  const provider = normalizeDeliveryProvider(input.deliveryProvider)
  if (provider === "platform_rider") {
    return false
  }
  return provider === "own_rider" || input.isOnlineOrder === true
}

function restaurantFacingHiddenFee(
  value: number | string | null | undefined
): number {
  const fee = Number(value ?? 0)
  if (!Number.isFinite(fee) || fee <= 0) {
    return 0
  }
  return fee
}

/**
 * Whether the restaurant should see the platform-fee line.
 * Fishtownco rider (`platform_rider`) fees are excluded, same as delivery fee.
 * @param input - Rider and stored fee
 * @param input.deliveryProvider - Rider / pickup provider
 * @param input.platformFee - Stored platform fee
 * @returns `true` when the fee row should render
 */
export function shouldShowRestaurantPlatformFee(input: {
  deliveryProvider?: string | null
  platformFee?: number | string | null
}): boolean {
  if (restaurantFacingHiddenFee(input.platformFee) <= 0) {
    return false
  }
  return normalizeDeliveryProvider(input.deliveryProvider) !== "platform_rider"
}

/**
 * Whether the restaurant should see the commission line.
 * Commission is settlement-only and is shown whenever a fee was snapshotted.
 * @param input - Stored commission fee
 * @param input.commissionFee - Snapshotted commission amount
 * @returns `true` when the commission row should render
 */
export function shouldShowRestaurantCommissionFee(input: {
  commissionFee?: number | string | null
}): boolean {
  return restaurantFacingHiddenFee(input.commissionFee) > 0
}

/**
 * Restaurant-facing bill total. Fishtownco rider (`platform_rider`) collects the
 * delivery fee and platform fee, so those amounts are subtracted from the
 * stored grand total.
 * @param input - Stored total, fees, and rider
 * @param input.total - Grand total including Fishtownco rider fees
 * @param input.deliveryFee - Stored delivery fee
 * @param input.platformFee - Stored platform fee
 * @param input.deliveryProvider - Rider / pickup provider
 * @returns Total the restaurant should display
 */
export function restaurantFacingOrderTotal(input: {
  total?: number | string | null
  deliveryFee?: number | string | null
  platformFee?: number | string | null
  deliveryProvider?: string | null
}): number {
  const total = Number(input.total) || 0
  if (normalizeDeliveryProvider(input.deliveryProvider) !== "platform_rider") {
    return total
  }
  const hidden =
    restaurantFacingHiddenFee(input.deliveryFee) +
    restaurantFacingHiddenFee(input.platformFee)
  return Math.max(0, total - hidden)
}

/**
 * Whether staff should see restaurant payment collection (status, paid, due).
 * Fishtownco rider orders are collected by the platform, not the restaurant.
 * @param input - Rider / pickup provider
 * @param input.deliveryProvider - Rider / pickup provider
 * @returns `true` when payment rows should render
 */
export function shouldShowRestaurantPaymentCollection(input: {
  deliveryProvider?: string | null
}): boolean {
  return normalizeDeliveryProvider(input.deliveryProvider) !== "platform_rider"
}

/**
 * Whether staff should see customer name, phone, and address.
 * Fishtownco rider (`platform_rider`) tickets hide diner PII from the restaurant.
 * @param input - Rider / pickup provider
 * @param input.deliveryProvider - Rider / pickup provider
 * @returns `true` when customer details should render
 */
export function shouldShowRestaurantCustomerInfo(input: {
  deliveryProvider?: string | null
}): boolean {
  return normalizeDeliveryProvider(input.deliveryProvider) !== "platform_rider"
}

function productSellOnChannels(sellOn: string | string[] | null | undefined) {
  return Array.isArray(sellOn) ? sellOn : [sellOn ?? ""]
}

/**
 * Whether a product can be sold on POS (pos or hybrid channel).
 * @param product - Catalog product with a sellOn field
 * @param product.sellOn - Channel or channel list
 * @returns `true` when the product is POS-sellable
 */
export function isProductSellableOnPos(product: {
  sellOn?: string | string[] | null
}): boolean {
  const channels = productSellOnChannels(product.sellOn)
  return channels.includes("pos") || channels.includes("hybrid")
}

/**
 * Whether a product can be sold on marketplace (marketplace or hybrid).
 * @param product - Catalog product with a sellOn field
 * @param product.sellOn - Channel or channel list
 * @returns `true` when the product is marketplace-sellable
 */
export function isProductSellableOnMarketplace(product: {
  sellOn?: string | string[] | null
}): boolean {
  const channels = productSellOnChannels(product.sellOn)
  return channels.includes("marketplace") || channels.includes("hybrid")
}
