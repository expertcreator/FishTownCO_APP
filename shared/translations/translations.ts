import { I18nManager } from "react-native";

import arabicTranslations from "@/assets/messages/ar.json" with {
  type: "json",
};
import englishTranslations from "@/assets/messages/en.json" with {
  type: "json",
};
import romanUrduTranslations from "@/assets/messages/rmu.json" with {
  type: "json",
};
import urduTranslations from "@/assets/messages/ur.json" with { type: "json" };

const translations: Record<string, unknown> = {
  en: englishTranslations,
  ar: arabicTranslations,
  ur: urduTranslations,
  rmu: romanUrduTranslations,
};

export type Language = "en" | "ar" | "ur" | "rmu";

/**
 * Get nested value from object using dot notation
 * e.g., getNestedValue(obj, "auth.otp-title") returns obj.auth["otp-title"]
 */
const getNestedValue = (obj: unknown, path: string): string | undefined => {
  const keys = path.split(".");
  let current = obj as Record<string, unknown>;

  for (const key of keys) {
    if (current === undefined || current === null) {
      return;
    }
    current = current[key] as Record<string, unknown>;
  }

  return typeof current === "string" ? current : undefined;
};

/**
 * Translate a key to the specified language
 * Supports nested keys with dot notation (e.g., "auth.otp-title")
 * Supports interpolation with {{param}} syntax
 * Falls back to defaultValue if provided, otherwise the key itself
 */
export const translate = (
  key: string,
  language: Language,
  defaultValue?: string,
  params?: Record<string, string | number>
): string => {
  const langTranslations = translations[language] as Record<string, unknown>;

  // Try nested key lookup first, then flat key lookup, then defaultValue, then key
  const translatedValue =
    getNestedValue(langTranslations, key) ??
    (langTranslations?.[key] as string);
  let result = translatedValue ?? defaultValue ?? key;

  // Handle interpolation - replace {{param}} with actual values
  // Using split/join for literal string replacement (avoids regex metacharacter issues)
  if (params && typeof result === "string") {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      const token = `{${paramKey}}`;
      result = result.split(token).join(String(paramValue));
    }
  }

  return result;
};

/**
 * Check if the language is RTL (Right-to-Left)
 */
export const isRTL = (language: Language): boolean => language === "ar";

/**
 * Get text direction for the language
 */
export const getDirection = (language: Language): "ltr" | "rtl" =>
  isRTL(language) ? "rtl" : "ltr";

/**
 * Set the RTL layout direction for the app
 * Note: App needs restart for RTL changes to take effect
 */
export const setRTL = (language: Language): void => {
  const rtl = isRTL(language);
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }
};

export { translations };
