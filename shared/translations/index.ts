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

export { getLanguageIcon, LANGUAGE_OPTIONS } from "./languages";

import { useI18nStore } from "./store";
import { getDirection, translate, type Language } from "./translations";

/**
 * Get the current language safely with fallback to 'en'
 */
const getLanguageSafe = (): Language => {
  const state = useI18nStore.getState();
  return state?.language || "en";
};

/**
 * Set the locale/language
 * @param locale - The locale code to set (e.g., 'en', 'ar')
 */
export const setLocale = (locale: Language): void => {
  useI18nStore.getState().setLanguage(locale);
};

/**
 * Translate function for use outside of React components
 */
export const t = (
  key: string,
  params?: Record<string, string | number>
): string => translate(key, getLanguageSafe(), undefined, params);

/**
 * i18n object for backward compatibility with code that imports i18n directly
 * This is a proxy that gets the current language from the store
 */
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
