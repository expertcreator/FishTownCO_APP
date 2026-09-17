import { APP_BRAND } from "@/shared/constants/appConfig";
import type { Locale } from "@/shared/translations/resources";
import { getDirection, resources } from "@/shared/translations/resources";
import React from "react";
import { Text } from "react-native";

export type LanguageOption = {
  code: Locale;
  labelKey: string;
  direction: "ltr" | "rtl";
};

/** Native name for each language (shown in LanguageSheet regardless of app locale) */
export const LANGUAGE_NATIVE_NAMES: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  ur: "اردو",
  rmu: "Urdu",
} as const;

const LANGUAGE_ICONS: Partial<Record<Locale, React.ElementType>> = {
  // Emoji-based flags avoid missing asset issues and keep language icons consistent.
  en: () => React.createElement(Text, null, "🇬🇧"),
  ar: () => React.createElement(Text, null, "🇸🇦"),
  ur: () => React.createElement(Text, null, "🇵🇰"),
  rmu: () => React.createElement(Text, null, "🇵🇰"),
};

/**
 * Get the flag icon React element for a given language code.
 */
export const getLanguageIcon = (code: Locale, size = 24): React.ReactNode => {
  const IconComponent = LANGUAGE_ICONS[code];
  if (!IconComponent) {
    return null;
  }
  return React.createElement(
    Text,
    { style: { fontSize: Math.max(16, size - 2), lineHeight: size + 2 } },
    React.createElement(IconComponent)
  );
};

/**
 * Allowed languages for Fishtownco.
 */
function getAllowedLocalesByBrand(): Locale[] {
  if (APP_BRAND === "fishtownco") {
    return ["en"];
  }
  return Object.keys(resources) as Locale[];
}

export const LANGUAGE_OPTIONS: LanguageOption[] = getAllowedLocalesByBrand()
  .filter((code) => code in resources)
  .map((code) => ({
    code,
    labelKey: `languages.${code}`, // expects translation key like 'languages.en'
    direction: getDirection(code),
  }));
