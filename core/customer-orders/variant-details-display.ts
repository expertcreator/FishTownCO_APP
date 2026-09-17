/**
 * Customization subtitles for a customer's order lines (`mw-4-3`, copied
 * verbatim from `mobile-tenant-app`'s
 * `features/orders/utils/variantDetailsDisplay.ts`).
 *
 * The largest module in the domain, and almost all of it is payload tolerance
 * rather than decision: the orders API has sent this field as an object, a
 * legacy array, nested arrays and a JSON string of any of those, and old orders
 * keep their old shape forever. Nothing here may be tidied without a payload
 * census first.
 */

/**
 * Builds checkout-style variant/flavor subtitles for order detail rows.
 * Place-order cart uses option labels joined with " / " (see getCartVariantSubtitle /
 * catalogVariantName). Order API may return the same as:
 * - `{ combinationLabel, modifierSelections }`
 * - `[{ variantName, optionName }, ...]`
 * - JSON string of either
 */

function localizedFromRecord(
  obj: { en?: string; ar?: string; ur?: string; value?: string },
  locale: string
): string {
  const lang = locale?.split("-")[0] || "en"
  if (lang === "ar") {
    return (obj.ar || obj.en || obj.value || "").trim()
  }
  if (lang === "ur" || lang === "rmu") {
    return (obj.ur || obj.en || obj.value || "").trim()
  }
  return (obj.en || obj.ar || obj.value || "").trim()
}

function pickText(value: unknown, locale: string): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (entry && typeof entry === "object") {
        const row = entry as { language?: string; value?: unknown }
        if (typeof row.value === "string" && row.value.trim()) {
          const lang = locale?.split("-")[0] || "en"
          if (
            typeof row.language === "string" &&
            row.language.split("-")[0]?.toLowerCase() === lang
          ) {
            return row.value.trim()
          }
        }
      }
    }
    for (const entry of value) {
      const text = pickText(entry, locale)
      if (text) {
        return text
      }
    }
    return
  }
  if (value && typeof value === "object") {
    const obj = value as {
      en?: string
      ar?: string
      ur?: string
      value?: string
    }
    if ("en" in obj || "ar" in obj || "ur" in obj || "value" in obj) {
      const localized = localizedFromRecord(obj, locale)
      return localized.length > 0 ? localized : undefined
    }
  }
  return
}

/** Normalize API payloads that may arrive as JSON strings. */
function parseVariantDetailsRaw(raw: unknown): unknown {
  if (typeof raw !== "string") {
    return raw
  }
  const trimmed = raw.trim()
  if (!trimmed) {
    return
  }
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed) as unknown
    } catch {
      return trimmed
    }
  }
  return trimmed
}

function detailRecords(details: unknown): Record<string, unknown>[] {
  const parsed = parseVariantDetailsRaw(details)
  if (typeof parsed === "string") {
    const label = parsed.trim()
    return label ? [{ combinationLabel: label }] : []
  }
  if (!parsed || typeof parsed !== "object") {
    return []
  }
  if (Array.isArray(parsed)) {
    return parsed.filter(
      (entry): entry is Record<string, unknown> =>
        !!entry && typeof entry === "object"
    )
  }
  return [parsed as Record<string, unknown>]
}

function pushUnique(parts: string[], value: string | undefined): void {
  const trimmed = value?.trim()
  if (!trimmed) {
    return
  }
  const lower = trimmed.toLowerCase()
  if (parts.some((part) => part.toLowerCase() === lower)) {
    return
  }
  parts.push(trimmed)
}

/** Split pre-joined cart labels ("large / egg" or "large, egg") into parts. */
function pushLabelSegments(parts: string[], label: string | undefined): void {
  const trimmed = label?.trim()
  if (!trimmed) {
    return
  }
  if (trimmed.includes(" / ")) {
    for (const segment of trimmed.split(" / ")) {
      pushUnique(parts, segment)
    }
    return
  }
  if (trimmed.includes(",")) {
    for (const segment of trimmed.split(",")) {
      pushUnique(parts, segment)
    }
    return
  }
  pushUnique(parts, trimmed)
}

/**
 * Selected option label only (checkout style) — never the group name alone.
 * Handles `{ name, value }`, `{ variantName, optionName }`, `optionNames[]`.
 */
function optionFromVariantRecord(
  record: Record<string, unknown>,
  locale: string
): string | undefined {
  const optionNames = Array.isArray(record.optionNames)
    ? record.optionNames
    : null
  if (optionNames) {
    const options = optionNames
      .map((option) => pickText(option, locale))
      .filter((text): text is string => Boolean(text))
    if (options.length > 0) {
      return options.join(" / ")
    }
  }

  return (
    pickText(record.selectedOptionName, locale) ||
    pickText(record.selectedValue, locale) ||
    pickText(record.optionName, locale) ||
    pickText(record.value, locale) ||
    pickText(record.label, locale) ||
    pickText(record.combinationLabel, locale)
  )
}

function partsFromModifierSelections(
  root: Record<string, unknown>,
  locale: string,
  parts: string[]
): void {
  const groups = root.modifierSelections
  if (!Array.isArray(groups)) {
    return
  }

  for (const group of groups) {
    if (!group || typeof group !== "object") {
      continue
    }
    const groupRecord = group as Record<string, unknown>
    const selected = groupRecord.selectedOptions
    if (!Array.isArray(selected)) {
      continue
    }
    for (const option of selected) {
      if (!option || typeof option !== "object") {
        continue
      }
      const optionRecord = option as Record<string, unknown>
      const optionName =
        pickText(optionRecord.optionName, locale) ||
        pickText(optionRecord.name, locale) ||
        pickText(optionRecord.label, locale) ||
        pickText(optionRecord.value, locale)
      pushUnique(parts, optionName)
    }
  }
}

function nestedVariantRecords(
  root: Record<string, unknown>
): Record<string, unknown>[] {
  const nestedKeys = [
    "selectedVariants",
    "variants",
    "variantOptions",
    "options"
  ] as const
  const out: Record<string, unknown>[] = []
  for (const key of nestedKeys) {
    const value = root[key]
    if (!Array.isArray(value)) {
      continue
    }
    for (const entry of value) {
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        out.push(entry as Record<string, unknown>)
      }
    }
  }
  return out
}

function partsFromLegacyRecords(
  records: Record<string, unknown>[],
  locale: string,
  parts: string[]
): void {
  for (const record of records) {
    pushLabelSegments(parts, optionFromVariantRecord(record, locale))
  }
}

/**
 * Option labels for an order line (checkout order: size / flavor / add-ons).
 *
 * Accepts every shape the orders API has sent for this field — a modern object
 * with `combinationLabel` + `modifierSelections`, a legacy array of
 * `{ variantName, optionName }`, nested `selectedVariants`, or a JSON string of
 * any of those. Only the SELECTED option is emitted, never the group name, and
 * pre-joined labels are split back apart so the result matches what the cart
 * showed at checkout. Duplicates are dropped case-insensitively.
 * @param variantDetails - The line's `variantDetails`, in any wire shape
 * @param locale - Active locale for localized option records; defaults to `en`
 * @returns Option labels in display order, or `[]` when the payload carries none
 * @example collectOrderItemCustomizationParts({ combinationLabel: "large / egg" }) // -> ["large", "egg"]
 */
export function collectOrderItemCustomizationParts(
  variantDetails: unknown,
  locale = "en"
): string[] {
  const parsed = parseVariantDetailsRaw(variantDetails)
  const records = detailRecords(parsed)
  if (!records.length) {
    return []
  }

  const parts: string[] = []
  const isArrayPayload = Array.isArray(parsed)

  if (isArrayPayload) {
    partsFromLegacyRecords(records, locale, parts)
    return parts
  }

  const root = records[0]
  if (!root) {
    return []
  }

  pushLabelSegments(parts, pickText(root.combinationLabel, locale))
  partsFromModifierSelections(root, locale, parts)
  partsFromLegacyRecords(nestedVariantRecords(root), locale, parts)

  if (parts.length === 0) {
    partsFromLegacyRecords([root], locale, parts)
  }

  return parts
}

/**
 * The one-line customization subtitle for an order row.
 * @param variantDetails - The line's `variantDetails`, in any wire shape
 * @param locale - Active locale for localized option records; defaults to `en`
 * @returns Options joined with `" / "`, or `undefined` when there are none
 * @example orderItemCustomizationSummary({ combinationLabel: "Large" }) // -> "Large"
 */
export function orderItemCustomizationSummary(
  variantDetails: unknown,
  locale = "en"
): string | undefined {
  const parts = collectOrderItemCustomizationParts(variantDetails, locale)
  return parts.length > 0 ? parts.join(" / ") : undefined
}

/**
 * Subtitle lines for OrderSummaryCard — one checkout-style line:
 * "large / egg / extra cheicken"
 *
 * Always zero or one entry. It returns an array rather than the string because
 * the card renders a list, and an empty array is what "render nothing" looks
 * like there.
 * @param variantDetails - The line's `variantDetails`, in any wire shape
 * @param locale - Active locale for localized option records; defaults to `en`
 * @returns A single-entry array, or `[]` when the line has no customization
 */
export function linesFromOrderVariantDetails(
  variantDetails: unknown,
  locale = "en"
): string[] {
  const summary = orderItemCustomizationSummary(variantDetails, locale)
  return summary ? [summary] : []
}
