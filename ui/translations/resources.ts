import ar from "@/assets/messages/ar.json" with { type: "json" };
import en from "@/assets/messages/en.json" with { type: "json" };
import ur from "@/assets/messages/ur.json" with { type: "json" };
import rmu from "@/assets/messages/rmu.json" with { type: "json" };

export const resources = {
  en: { translation: en },
  ar: { translation: ar },
  ur: { translation: ur },
  rmu: { translation: rmu },
} as const;

export type Locale = keyof typeof resources;

type TranslationWithMeta = {
  meta?: {
    direction?: "ltr" | "rtl";
  };
};

// Pick direction from JSON meta field (ar and ur are RTL)
export function getDirection(locale: Locale): "ltr" | "rtl" {
  const translation = resources[locale]?.translation as TranslationWithMeta;
  return (
    translation?.meta?.direction ||
    (locale === "ar" || locale === "ur" ? "rtl" : "ltr")
  );
}
