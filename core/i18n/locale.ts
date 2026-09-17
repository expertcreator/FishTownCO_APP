/**
 * The two locale decisions that are pure: which member of a localized record a
 * locale reads, and which Intl tag it formats dates and numbers with.
 *
 * **Zero imports, and that is the entire point of this module** (`mw-4-1`).
 * Both functions were copied verbatim out of `mobile-shared-module`'s
 * `shared/utils/i18n.ts`, which initialises i18next, loads four message JSONs
 * and reads persisted language through MMKV at import time — so anything that
 * wanted these two helpers inherited all of it. Order-display logic that is
 * otherwise pure could not be extracted while that was true.
 *
 * Nothing here may grow an import, not even a type-only one. The mobile file
 * re-exports these symbols, so a dependency added here is a dependency added to
 * every screen in three shipped apps.
 *
 * **This is not web's `getLocalizedValue`.** `src/shared/lib/utils.ts` has a
 * function of the same name with the arguments the other way round and a
 * different fallback chain, and `src/features/catalog/text.ts` has a third for
 * schema-parsed records. They are not interchangeable and none of them should
 * be routed through another; see the `mw-4-1` spec for why all three stand.
 */

/**
 * Picks the string a locale should read out of an API's localized object.
 *
 * The fallback chains are load-bearing and none of them is symmetric. Arabic
 * falls back to English rather than to Urdu; English falls back to Arabic
 * before the untagged `value`; and `rmu` (Roman Urdu) reads the `ur` member,
 * because the API uses that one key for both Urdu script and Roman Urdu copy in
 * many payloads. `value` is the last resort in every branch — it is what
 * endpoints that never got localized still send.
 *
 * A locale carrying a region (`en-US`) is reduced to its language subtag, and
 * an empty or absent locale is treated as English rather than as "no match",
 * so a missing language never blanks the UI.
 * @param obj - The localized record from an API payload, or nothing at all
 * @param locale - The active locale, with or without a region subtag
 * @returns The string to display, or `""` when the record carries nothing
 * @example getLocalizedValue({ ar: "دجاج", en: "Chicken" }, "ar") // -> "دجاج"
 * @example getLocalizedValue({ ur: "Chicken" }, "rmu") // -> "Chicken"
 */
export function getLocalizedValue(
  obj:
    | { en?: string; ar?: string; ur?: string; value?: string }
    | null
    | undefined,
  locale: string
): string {
  if (!obj) {
    return ""
  }
  const lang = locale?.split("-")[0] || "en"
  if (lang === "ar") {
    return obj.ar || obj.en || obj.value || ""
  }
  // API uses `ur` for both Urdu script and Roman Urdu copy in many payloads
  if (lang === "ur" || lang === "rmu") {
    return obj.ur || obj.en || obj.value || ""
  }
  return obj.en || obj.ar || obj.value || ""
}

/**
 * Maps a locale onto the Intl tag its dates and numbers should be formatted in.
 *
 * The region is chosen for us rather than taken from the caller: Urdu means
 * Pakistan and Arabic means Egypt, because those are the markets the copy is
 * written for. Everything else — including Roman Urdu, which is Latin script
 * and must not get Eastern Arabic digits — formats as `en-US`.
 * @param locale - The active locale, with or without a region subtag
 * @returns An Intl-compatible locale tag
 * @example getLocaleTag("ur") // -> "ur-PK"
 * @example getLocaleTag("rmu") // -> "en-US"
 */
export function getLocaleTag(locale: string): string {
  const lang = locale?.split("-")[0] || "en"
  if (lang === "ur") {
    return "ur-PK"
  }
  if (lang === "ar") {
    return "ar-EG"
  }
  return "en-US"
}
