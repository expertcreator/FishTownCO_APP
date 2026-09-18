import { reloadAppAsync } from "expo";
import { useCallback, useEffect, useMemo } from "react";
import { useI18nStore } from "./store";
import {
  getDirection,
  isRTL,
  setRTL,
  translate,
  type Language,
} from "./translations";

// Re-export Language type
export type { Language };

// Re-export store
export { useI18nStore };

/**
 * Custom hook for language state
 */
export const useLanguage = () => {
  const language = useI18nStore((state) => state.language ?? "en");
  const setLanguage = useI18nStore((state) => state.setLanguage);

  return { language, setLanguage };
};

/**
 * Selector hook for language value only
 */
export const useCurrentLanguage = () =>
  useI18nStore((state) => state.language ?? "en");

/**
 * Custom hook providing translation functionality
 */
export const useTranslation = () => {
  const { language, setLanguage: setLanguageStore } = useLanguage();

  // Apply RTL when language changes
  useEffect(() => {
    setRTL(language);
  }, [language]);

  /**
   * Translation function
   * @param key - Translation key (supports dot notation for nested keys)
   * @param defaultValueOrParams - Either a default fallback string or interpolation params
   * @param params - Interpolation params (only used if second arg is defaultValue)
   */
  const t = useCallback(
    (
      key: string,
      defaultValueOrParams?: string | Record<string, string | number>,
      params?: Record<string, string | number>
    ): string => {
      // If second arg is a string, treat it as defaultValue
      if (typeof defaultValueOrParams === "string") {
        return translate(key, language, defaultValueOrParams, params);
      }
      // Otherwise treat it as params (backward compatible)
      return translate(key, language, undefined, defaultValueOrParams);
    },
    [language]
  );

  /**
   * Persist language, sync i18n/RTL, and reload only when direction (LTR/RTL) changes.
   * Reloading on every pick (e.g. English → Roman Urdu) can race onboarding
   * completion and drop the saved language before Home mounts.
   */
  const changeLanguage = useCallback(
    async (newLanguage: Language) => {
      if (language === newLanguage) {
        return;
      }

      const directionChanged = isRTL(language) !== isRTL(newLanguage);

      setLanguageStore(newLanguage);
      setRTL(newLanguage);

      if (!directionChanged) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 150));

      try {
        await reloadAppAsync();
      } catch {
        // Reload unavailable (e.g. dev) — language already updated in memory + storage
      }
    },
    [language, setLanguageStore]
  );

  const rtl = isRTL(language);
  const direction = getDirection(language);

  // Backward compatible i18n object
  const i18n = useMemo(
    () => ({
      language,
      dir: direction,
      changeLanguage,
    }),
    [language, direction, changeLanguage]
  );

  return {
    t,
    language,
    setLanguage: changeLanguage,
    isRTL: rtl,
    direction,
    i18n,
  };
};
