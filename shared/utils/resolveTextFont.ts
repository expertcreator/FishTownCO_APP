import APP_CONFIG from "@/shared/constants/appConfig";
import type { Language } from "@/shared/translations/translations";
import type { ReactNode } from "react";

const ARABIC_SCRIPT_REGEX =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const LATIN_UI_LANGUAGES = new Set<Language>(["en", "rmu"]);

const FONT_TO_ARABIC: Record<string, string> = (() => {
  const base = APP_CONFIG.fontFamily;
  const ar = APP_CONFIG.fontFamilyAr ?? base;
  return {
    [base.heading]: ar.heading,
    [base.title]: ar.title,
    [base.subTitle]: ar.subTitle,
    [base.button]: ar.button,
    [base.caption]: ar.caption,
    "Inter-Light": ar.caption,
    "Inter-Regular": ar.subTitle,
    "Inter-Medium": ar.title,
    "Inter-SemiBold": ar.button,
    "Roboto-SemiBold": ar.heading,
    "SofiaPro-Light": ar.caption,
    "SofiaPro-Regular": ar.subTitle,
    "SofiaPro-Medium": ar.title,
    "SofiaPro-SemiBold": ar.button,
  };
})();

export function containsArabicScript(text: string): boolean {
  return ARABIC_SCRIPT_REGEX.test(text);
}

export function getTextFromChildren(children: ReactNode): string {
  if (children == null || typeof children === "boolean") {
    return "";
  }
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join("");
  }
  if (typeof children === "object" && children !== null && "props" in children) {
    const props = (children as { props?: { children?: ReactNode } }).props;
    return getTextFromChildren(props?.children);
  }
  return "";
}

export function resolveFontFamilyForText(
  fontFamily: string | undefined,
  text: string,
  uiLanguage: Language
): string | undefined {
  if (!(fontFamily && LATIN_UI_LANGUAGES.has(uiLanguage))) {
    return fontFamily;
  }
  if (!containsArabicScript(text)) {
    return fontFamily;
  }
  return FONT_TO_ARABIC[fontFamily] ?? fontFamily;
}
