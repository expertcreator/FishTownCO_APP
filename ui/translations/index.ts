export {
  useCurrentLanguage,
  useI18nStore,
  useLanguage,
  useTranslation,
  type Language,
} from "./useTranslation";

export {
  getDirection,
  isRTL,
  setRTL,
  translate,
  translations,
} from "./translations";

import { useI18nStore } from "./store";
import { getDirection, translate, type Language } from "./translations";

/**
 * Gets the current language, falling back to English.
 * @returns Active language code
 */
const getLanguageSafe = (): Language => {
  const state = useI18nStore.getState();
  return state?.language || "en";
};

/**
 * Sets the locale outside React.
 * @param locale - Locale code
 * @returns void
 */
export const setLocale = (locale: Language): void => {
  useI18nStore.getState().setLanguage(locale);
};

/**
 * Translates a key outside React.
 * @param key - Translation key
 * @param params - Interpolation params
 * @returns Translated string
 */
export const t = (
  key: string,
  params?: Record<string, string | number>
): string => translate(key, getLanguageSafe(), undefined, params);

const i18n = {
  get language(): Language {
    return getLanguageSafe();
  },
  get dir(): "ltr" | "rtl" {
    return getDirection(getLanguageSafe());
  },
  t(key: string, params?: Record<string, string | number>): string {
    return translate(key, getLanguageSafe(), undefined, params);
  },
  changeLanguage(lng: Language) {
    useI18nStore.getState().setLanguage(lng);
  },
};

export default i18n;
