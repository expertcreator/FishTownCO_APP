/**
 * Maps a free-text delivery address into the order jsonb shape.
 * @param address - Typed address
 * @returns Locale record, or undefined when blank
 * @example
 * deliveryAddressToJsonb("12 High St")
 * // { en: "12 High St", ar: "12 High St", ur: "12 High St" }
 */
export function deliveryAddressToJsonb(
  address: string | null | undefined
): Record<string, string> | undefined {
  const text = String(address ?? "").trim()
  if (!text) {
    return
  }
  return { en: text, ar: text, ur: text }
}
