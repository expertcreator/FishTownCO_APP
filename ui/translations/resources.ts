import en from "@/assets/messages/en.json" with { type: "json" };

export const resources = {
  en: { translation: en },
} as const;

export type Locale = keyof typeof resources;

type TranslationWithMeta = {
  meta?: {
    direction?: "ltr" | "rtl";
  };
};

/**
 * Reads text direction from the locale file. English is left-to-right.
 * @param locale - Active locale
 * @returns `ltr` or `rtl`
 */
export function getDirection(locale: Locale): "ltr" | "rtl" {
  const translation = resources[locale]?.translation as TranslationWithMeta;
  return translation?.meta?.direction || "ltr";
}
