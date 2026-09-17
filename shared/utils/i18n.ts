import i18n, { type Resource } from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "@/assets/messages/ar.json" with { type: "json" };
import en from "@/assets/messages/en.json" with { type: "json" };
import rmu from "@/assets/messages/rmu.json" with { type: "json" };
import ur from "@/assets/messages/ur.json" with { type: "json" };
import { Language } from "../translations";
import { Locale } from "../translations/resources";
import { readPersistedLanguage } from "../translations/store";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  ur: { translation: ur },
  rmu: { translation: rmu },
} satisfies Resource;

function isSupportedLocale(value: unknown): value is Locale {
  return typeof value === "string" && Object.hasOwn(resources, value);
}

const persistedLanguage = readPersistedLanguage();
const initialLanguage: Locale = isSupportedLocale(persistedLanguage)
  ? persistedLanguage
  : "en";

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;

/**
 * @deprecated Use setLanguage instead. Kept for backward compatibility.
 */
export function setLocale(locale: Locale) {
  i18n.changeLanguage(locale);
}

export function t(
  key: string,
  params?: Record<string, string | number>
): string {
  return i18n.t(key, params);
}

export function hasKey(key: string): boolean {
  return i18n.exists(key);
}

export function getLocalizedLabel(
  label: Partial<Record<Locale, string>> | null | undefined
): string {
  if (!label) {
    return "";
  }
  const current = label[i18n.language as unknown as Locale];
  if (current) {
    return current;
  }
  return label.en ?? label.ar ?? label.ur ?? "";
}

/**
 * `getLocalizedValue` and `getLocaleTag` now live in `@/core/i18n` (mw-4-1).
 *
 * They are pure, but this module is not: importing it initialises i18next,
 * loads four message JSONs and reads persisted language through MMKV. That made
 * every consumer of those two helpers — including otherwise-portable order
 * display logic — impossible to share with the web app.
 *
 * Re-exported rather than moved so all 43 call sites keep importing
 * `@/shared/utils/i18n` unchanged and no app is forced to bump a pin. An app
 * that takes this commit must take a `core` pin carrying `@/core/i18n` with it,
 * or `@/core/i18n` will not resolve and the bundle will fail.
 *
 * Those 43 call sites still load i18next, the four message JSONs and MMKV,
 * because they still import this module. Pointing them straight at
 * `@/core/i18n` is `mw-4-13`, and it is a ticket for whoever owns this app —
 * not something the web side does on mobile's behalf.
 */
export { getLocaleTag, getLocalizedValue } from "@/core/i18n";

// Re-export useTranslation hook and getDirection
export { getDirection } from "@/shared/translations/translations";
export { useTranslation } from "@/shared/translations/useTranslation";

// Re-export Language and Locale types
export type { Locale } from "@/shared/translations/resources";
export type { Language };
