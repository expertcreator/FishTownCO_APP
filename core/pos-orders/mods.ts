export interface BillLineModVariant {
  group?: string | null
  value?: string | null
}

export interface FormatBillLineModsInput {
  combinationLabel?: string | null
  variants?: BillLineModVariant[] | null
}

const COMBO_LABEL_SPLIT = /\s*[·|/]\s*/

function uniqueParts(parts: string[]): string[] {
  const unique: string[] = []
  const seen = new Set<string>()
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) {
      continue
    }
    const key = trimmed.toLowerCase()
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    unique.push(trimmed)
  }
  return unique
}

function variantGroupLabel(part: string): string {
  const colon = part.indexOf(": ")
  return colon >= 0 ? part.slice(0, colon).trim() : ""
}

function variantValueOnly(part: string): string {
  const colon = part.indexOf(": ")
  return colon >= 0 ? part.slice(colon + 2).trim() : part.trim()
}

/**
 * Stacked modifier lines for a live bill item.
 * Prefers variant rows; falls back to splitting a combination label.
 * @param input - Combination label and already-localized variant rows
 * @returns Unique modifier lines
 */
export function listBillLineMods(input: FormatBillLineModsInput): string[] {
  const parts: string[] = []
  for (const variant of input.variants ?? []) {
    const value = variant.value?.trim() ?? ""
    if (!value) {
      continue
    }
    const group = variant.group?.trim() ?? ""
    if (group && group.toLowerCase() !== value.toLowerCase()) {
      parts.push(`${group}: ${value}`)
    } else {
      parts.push(value)
    }
  }
  const uniqueFromVariants = uniqueParts(parts)
  if (uniqueFromVariants.length > 0) {
    return uniqueFromVariants
  }

  const combo = input.combinationLabel?.trim()
  if (!combo) {
    return []
  }
  return uniqueParts(combo.split(COMBO_LABEL_SPLIT))
}

/**
 * Operator-facing variant subline for live bills.
 * Drops blank/duplicate picks and prefers a stored combination label.
 * @param input - Combination label and already-localized variant rows
 * @returns Compact modifier string, or empty
 * @example
 * formatBillLineMods({
 *   variants: [
 *     { value: "Chipotle Sauce" },
 *     { value: "Chipotle Sauce" },
 *     { value: "Cheese" }
 *   ]
 * })
 * // "Chipotle Sauce · Cheese"
 */
export function formatBillLineMods(input: FormatBillLineModsInput): string {
  const combo = input.combinationLabel?.trim()
  if (combo) {
    const comboParts = uniqueParts(combo.split(COMBO_LABEL_SPLIT))
    if (comboParts.length > 0) {
      return comboParts.join(" · ")
    }
  }

  const parts: string[] = []
  for (const variant of input.variants ?? []) {
    const value = variant.value?.trim() ?? ""
    if (!value) {
      continue
    }
    const group = variant.group?.trim() ?? ""
    if (group && group.toLowerCase() !== value.toLowerCase()) {
      parts.push(`${group}: ${value}`)
    } else {
      parts.push(value)
    }
  }

  const unique = uniqueParts(parts)
  if (unique.length === 0) {
    return ""
  }
  if (unique.length === 1) {
    return unique[0] ?? ""
  }

  const valuesOnly = unique.map(variantValueOnly)
  const uniqueValues = [
    ...new Set(valuesOnly.map((value) => value.toLowerCase()))
  ]
  if (uniqueValues.length === 1) {
    return valuesOnly[0] ?? ""
  }

  const groups = unique.map(variantGroupLabel).filter(Boolean)
  const uniqueGroups = [...new Set(groups)]
  if (
    uniqueGroups.length === unique.length &&
    valuesOnly.every(
      (value) => value.toLowerCase() === valuesOnly[0]?.toLowerCase()
    )
  ) {
    return valuesOnly[0] ?? ""
  }

  return unique.join(" · ")
}
