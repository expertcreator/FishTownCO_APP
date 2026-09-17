import { getLocalizedValue } from "../i18n"

export interface BillLineAddonVariantLike {
  name?: string | Partial<Record<string, string>> | null
  value?: string | Partial<Record<string, string>> | null
}

export interface BillLineAddonLike {
  addonName?: string | null
  name?: string | Partial<Record<string, string>> | null
  quantity?: number | string | null
  price?: number | string | null
  combinationLabel?: string | null
  variantLabel?: string | null
  selectedVariants?: BillLineAddonVariantLike[] | null
  variantDetails?: { combinationLabel?: string | null } | null
}

export interface BillLineAddonRow {
  name: string
  variantLines: string[]
  quantity: number
  price: number
}

const ADDON_LABEL_SPLIT = /\s*(?:,|·|\/)\s*/

interface LocalizedRecord {
  en?: string
  ar?: string
  ur?: string
  value?: string
}

/**
 * Splits a stored combination label into one line per option.
 * @param label - Snapshot label such as `Size: Small, Flavor: Cola`
 * @returns Trimmed option lines
 */
export function splitAddonVariantLines(
  label: string | null | undefined
): string[] {
  if (!label) {
    return []
  }
  const lines: string[] = []
  for (const part of label.split(ADDON_LABEL_SPLIT)) {
    const line = part.trim()
    if (line) {
      lines.push(line)
    }
  }
  return lines
}

function localizedAddonText(
  value: string | Partial<Record<string, string>> | null | undefined,
  locale: string
): string {
  if (typeof value === "string") {
    return value.trim()
  }
  return getLocalizedValue(value as LocalizedRecord, locale)
}

/**
 * Variant lines for one addon: structured picks first, then a stored label.
 * @param addon - Snapshot/catalog addon row
 * @param locale - UI locale for localized variant names
 * @returns Size/flavor lines, or empty
 */
export function listAddonVariantLines(
  addon: BillLineAddonLike,
  locale: string
): string[] {
  const lines: string[] = []
  for (const variant of addon.selectedVariants ?? []) {
    const value = localizedAddonText(variant.value, locale)
    if (!value) {
      continue
    }
    const group = localizedAddonText(variant.name, locale)
    if (group && group.toLowerCase() !== value.toLowerCase()) {
      lines.push(`${group}: ${value}`)
      continue
    }
    lines.push(value)
  }
  if (lines.length > 0) {
    return lines
  }
  return splitAddonVariantLines(
    addon.combinationLabel ??
      addon.variantLabel ??
      addon.variantDetails?.combinationLabel
  )
}

function addonQuantity(raw: number | string | null | undefined): number {
  if (raw == null || raw === "") {
    return 1
  }
  const quantity = Number(raw)
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0
}

function addonPrice(raw: number | string | null | undefined): number {
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : 0
}

function addonLabel(addon: BillLineAddonLike, locale: string): string {
  const fromName =
    typeof addon.name === "string"
      ? addon.name.trim()
      : getLocalizedValue(addon.name as LocalizedRecord, locale)
  if (fromName) {
    return fromName
  }
  return String(addon.addonName ?? "").trim()
}

/**
 * Add-on rows for cart/bill (name, variant lines, quantity, unit price).
 * @param line - Line with selected add-ons
 * @param locale - UI locale for localized addon names
 * @returns Add-ons with quantity greater than 0
 * @example
 * listBillLineAddonRows({
 *   addons: [{
 *     name: { en: "Drink" },
 *     combinationLabel: "Size: Small, Flavor: Cola",
 *     quantity: 1,
 *     price: 100
 *   }]
 * }, "en")
 * // [{ name: "Drink", variantLines: ["Size: Small", "Flavor: Cola"], … }]
 */
export function listBillLineAddonRows(
  line: { addons?: BillLineAddonLike[] | null },
  locale: string
): BillLineAddonRow[] {
  const rows: BillLineAddonRow[] = []
  for (const addon of line.addons ?? []) {
    const quantity = addonQuantity(addon.quantity)
    if (quantity <= 0) {
      continue
    }
    const name = addonLabel(addon, locale)
    if (!name) {
      continue
    }
    rows.push({
      name,
      variantLines: listAddonVariantLines(addon, locale),
      quantity,
      price: addonPrice(addon.price)
    })
  }
  return rows
}
