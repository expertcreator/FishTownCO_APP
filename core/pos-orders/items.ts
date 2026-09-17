import type {
  PosBillLine,
  PosCartLine,
  PosPlaceOrderApiItem,
  PosVariantLike
} from "./types"

/** Minimal server/live line needed to build a POS PUT row. */
export interface PosBillLineSource {
  id: string
  quantity: number
  productId?: string
  combinationId?: string | null
  addons?: Array<{
    addonProductId: string
    quantity?: number
    combinationId?: string | null
  }>
}

/**
 * Builds a stable combination id from variant option picks.
 * @param selectedVariants - Variant groups with option ids
 * @returns Joined `variantId:optionIds` string, or empty
 */
export function buildCombinationId(
  selectedVariants?: PosVariantLike[] | null
): string {
  if (!selectedVariants?.length) {
    return ""
  }
  return [...selectedVariants]
    .sort((a, b) => a.variantId.localeCompare(b.variantId))
    .map(
      (variant) =>
        `${variant.variantId}:${[...variant.optionIds].sort().join(",")}`
    )
    .join(";")
}

/**
 * Builds a human combination label from option names.
 * @param selectedVariants - Variant groups with option names
 * @returns Joined labels, or undefined
 */
export function buildCombinationLabel(
  selectedVariants?: Array<{ optionNames?: string[] }> | null
): string | undefined {
  if (!selectedVariants?.length) {
    return
  }
  const labels = selectedVariants
    .flatMap((variant) => variant.optionNames ?? [])
    .map((name) => String(name).trim())
    .filter(Boolean)
  return labels.length > 0 ? labels.join(" / ") : undefined
}

/**
 * Maps cart lines to POST/PUT `/orders` item rows (product, combination, or deal).
 * @param items - Cart lines
 * @returns API items with addons and variantDetails
 */
export function buildPlaceOrderApiItems(
  items: PosCartLine[]
): PosPlaceOrderApiItem[] {
  return items.map((item) => {
    const combinationId =
      item.combinationId ?? buildCombinationId(item.selectedVariants)
    const combinationLabel = buildCombinationLabel(item.selectedVariants)
    const isDealItem = Boolean(item.dealId)
    const addons =
      item.selectedAddons
        ?.filter((addon) => addon.quantity > 0)
        .map((addon) => ({
          addonProductId: addon.addonProductId,
          quantity: addon.quantity,
          ...(addon.combinationId ? { combinationId: addon.combinationId } : {})
        })) ?? []

    let identity: {
      dealId?: string
      combinationId?: string
      productId?: string
    }
    if (item.dealId) {
      identity = { dealId: item.dealId }
    } else if (combinationId) {
      identity = { combinationId }
    } else {
      identity = { productId: item.productId }
    }

    return {
      quantity: item.quantity,
      ...identity,
      ...(addons.length > 0 ? { addons } : {}),
      variantDetails: {
        ...(combinationId ? { combinationId } : {}),
        ...(combinationLabel ? { combinationLabel } : {}),
        modifierSelections: item.modifierSelections,
        modifierTotal: item.modifierTotal ?? 0,
        ...(isDealItem && item.dealSelections
          ? { selections: item.dealSelections }
          : {})
      }
    }
  })
}

/**
 * Maps live bill lines into core PUT rows.
 * @param items - Enriched order items
 * @returns Core bill lines
 */
export function mapOrderItemsToPosBillLines(
  items: PosBillLineSource[] | null | undefined
): PosBillLine[] {
  return (items ?? []).map((item) => ({
    id: item.id,
    quantity: item.quantity,
    productId: item.productId,
    combinationId: item.combinationId,
    addons: item.addons?.map((addon) => ({
      addonProductId: addon.addonProductId,
      quantity: Number(addon.quantity) || 1,
      ...(addon.combinationId ? { combinationId: addon.combinationId } : {})
    }))
  }))
}
