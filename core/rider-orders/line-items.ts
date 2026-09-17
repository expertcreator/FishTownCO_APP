type LocalizedText = string | { en?: string; ar?: string; ur?: string }

export type MappedOrderLineItem = {
  id: string
  name: LocalizedText
  quantity: number
  price: number
  image?: string
}

/**
 * Returns true when an order line item was soft-deleted (e.g. removed on POS).
 * @param item - Raw order line item from the API
 * @returns Whether the line should be hidden from rider UI
 */
export function isOrderLineItemDeleted(
  item: Record<string, unknown> | null | undefined
): boolean {
  if (!item || typeof item !== "object") {
    return false
  }
  if (item.isDeleted === true || item.deleted === true) {
    return true
  }
  const deletedAt = item.deletedAt
  return typeof deletedAt === "string" && deletedAt.trim().length > 0
}

/**
 * Parses a numeric money value from API number/string fields.
 * @param value - Raw price-like value
 * @returns Finite number, or `null` when missing/invalid
 */
function parseMoney(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/**
 * Resolves unit price for a line item from common API field aliases.
 * Prefers `price` / `unitPrice`, then derives from line `subtotal` / quantity.
 * @param item - Raw order line item from the API
 * @returns Unit price (may be 0 for free items)
 * @example
 * resolveOrderLineItemPrice({ price: "12.5" }) // -> 12.5
 */
export function resolveOrderLineItemPrice(
  item: Record<string, unknown>
): number {
  for (const key of ["price", "unitPrice", "productPrice"] as const) {
    const parsed = parseMoney(item[key])
    if (parsed != null) {
      return parsed
    }
  }

  const quantity = Math.max(1, Number(item.quantity ?? item.qty) || 1)
  for (const key of ["subtotal", "lineTotal", "total"] as const) {
    const lineTotal = parseMoney(item[key])
    if (lineTotal != null) {
      return lineTotal / quantity
    }
  }

  return 0
}

/**
 * Maps API order line items for rider UI: drops deleted lines and normalizes price.
 * Copied from the driver app order-details / socket mapping (`d3bf6f0`).
 * @param items - Raw `items` array from order details / socket payloads
 * @returns Active line items with resolved unit prices
 */
export function mapApiOrderItemsToUi(
  items: unknown[] | null | undefined
): MappedOrderLineItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return []
  }

  const mapped: MappedOrderLineItem[] = []
  for (let index = 0; index < items.length; index += 1) {
    const raw = items[index]
    if (!raw || typeof raw !== "object") {
      continue
    }
    const item = raw as Record<string, unknown>
    if (isOrderLineItemDeleted(item)) {
      continue
    }

    const product =
      item.product && typeof item.product === "object"
        ? (item.product as Record<string, unknown>)
        : null
    const productImages = Array.isArray(product?.images)
      ? (product?.images as unknown[])
      : []
    const imageFromProduct =
      typeof productImages[0] === "string" ? productImages[0] : undefined
    const image =
      (typeof item.image === "string" ? item.image : undefined) ||
      imageFromProduct

    const name =
      (item.productName as LocalizedText | undefined) ||
      (product?.name as LocalizedText | undefined) ||
      (item.name as LocalizedText | undefined) ||
      ""

    const quantityRaw = Number(item.quantity ?? item.qty)
    const quantity =
      Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1

    mapped.push({
      id:
        (typeof item.id === "string" && item.id) ||
        (typeof item.id === "number" ? String(item.id) : `item-${index}`),
      name,
      quantity,
      price: resolveOrderLineItemPrice(item),
      ...(image ? { image } : {})
    })
  }

  return mapped
}
