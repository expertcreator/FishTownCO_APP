import type { GeoAreaItem, GeoLocalizedName } from "./types"

/**
 * Picks a display string from geo localized copy.
 * @param name - Localized name map from discovery
 * @param locale - Active UI locale
 * @returns Locale match, then `en`, then the first non-empty value
 * @example
 * geoDisplayName({ en: "Lahore", ur: "لاہور" }, "ur")
 * // "لاہور"
 */
export function geoDisplayName(name: GeoLocalizedName, locale: string): string {
  const exact = name[locale]?.trim()
  if (exact) {
    return exact
  }
  const english = name.en?.trim()
  if (english) {
    return english
  }
  for (const value of Object.values(name)) {
    const trimmed = value.trim()
    if (trimmed) {
      return trimmed
    }
  }
  return ""
}

/**
 * Map pin for a live geo area.
 * @param area - Area with latitude and longitude
 * @returns Pin used by the location picker circle
 * @example
 * geoAreaMapPin({ latitude: 32.1, longitude: 74.2 })
 * // { latitude: 32.1, longitude: 74.2 }
 */
export function geoAreaMapPin(
  area: Pick<GeoAreaItem, "latitude" | "longitude">
): { latitude: number; longitude: number } {
  return { latitude: area.latitude, longitude: area.longitude }
}
