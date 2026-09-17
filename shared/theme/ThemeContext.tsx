import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, useColorScheme } from "react-native";
import {
  getFontsForLanguage,
  setFontsLanguage,
  type FontToken,
} from "../constants/fonts";
import { darkColors, getThemeColors, lightColors } from "../constants/colors";
import { mmkv } from "../stores/mmkvStorage";
import { useI18nStore } from "../translations/store";

export type ColorScheme = "light" | "dark";
export type ThemePreference = "system" | ColorScheme;

export type ThemeColors = {
  primary: string;
  primary1: string;
  secondary: string;
  red: string;
  green: string;
  blue: string;
  yellow: string;
  star: string;
  purple: string;
  pink: string;
  indigo: string;
  background: string;
  /** POS / auth page fill — teal-charcoal in dark, soft sky in light. */
  posHomeBackground: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  inputBackground: string;
  overlay: string;
  shadow: string;
  disabled: string;
  placeholder: string;
};

export type ThemeContextType = {
  colors: ThemeColors;
  colorScheme: ColorScheme;
  isDark: boolean;
  isLight: boolean;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
  fonts: FontToken;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

const THEME_STORAGE_KEY = "app_theme_preference";

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const language = useI18nStore((state) => state.language ?? "en");
  const lang = language?.split("-")[0] || "en";
  const fonts = useMemo(() => getFontsForLanguage(lang), [lang]);
  // Sync default fonts export for components that import fonts directly
  setFontsLanguage(language);

  // Load saved theme preference from MMKV storage
  const getSavedThemePreference = (): ThemePreference => {
    const saved = mmkv.getString(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
    return "system";
  };

  // User preference: "system" to follow device, or explicit "light"/"dark"
  const [themePreference, setStoredThemePreference] =
    useState<ThemePreference>(getSavedThemePreference());

  const setThemePreference = (pref: ThemePreference) => {
    mmkv.set(THEME_STORAGE_KEY, pref);
    setStoredThemePreference(pref);
  };

  // Initialize current scheme based on saved preference
  const getInitialScheme = (): ColorScheme => {
    const savedPreference = getSavedThemePreference();
    if (savedPreference === "system") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return savedPreference;
  };

  const [currentScheme, setCurrentScheme] = useState<ColorScheme>(
    getInitialScheme()
  );

  // Listen for system theme changes when preference is "system"
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themePreference === "system") {
        const newScheme = colorScheme === "dark" ? "dark" : "light";
        setCurrentScheme(newScheme);
      }
    });

    return () => subscription?.remove();
  }, [themePreference]);

  // Update when system color scheme changes and preference is "system"
  useEffect(() => {
    if (themePreference === "system") {
      const newScheme = systemColorScheme === "dark" ? "dark" : "light";
      setCurrentScheme(newScheme);
    }
  }, [systemColorScheme, themePreference]);

  // When user changes preference to explicit scheme, update current scheme
  useEffect(() => {
    if (themePreference !== "system") {
      setCurrentScheme(themePreference);
    }
  }, [themePreference]);

  const colors = currentScheme === "dark" ? darkColors : lightColors;
  const isDark = currentScheme === "dark";
  const isLight = currentScheme === "light";

  const toggleTheme = () => {
    setStoredThemePreference((prev) => {
      let newPreference: ThemePreference;
      // If following system, flip based on current computed scheme and stick to explicit preference
      if (prev === "system") {
        newPreference = currentScheme === "dark" ? "light" : "dark";
      } else {
        // If explicit, just flip
        newPreference = prev === "dark" ? "light" : "dark";
      }
      // Save to MMKV storage for persistence
      mmkv.set(THEME_STORAGE_KEY, newPreference);
      return newPreference;
    });
  };

  const value: ThemeContextType = {
    colors,
    colorScheme: currentScheme,
    isDark,
    isLight,
    themePreference,
    setThemePreference,
    toggleTheme,
    fonts,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Hook to get theme-aware styles
export const useThemedStyles = <T extends Record<string, unknown>>(
  styleFunction: (colors: ThemeColors, isDark: boolean) => T
): T => {
  const { colors, isDark } = useTheme();
  return styleFunction(colors, isDark);
};

// Hook to get theme-aware colors in your existing pattern
export const useColors = () => {
  const { isDark } = useTheme();
  return getThemeColors(isDark);
};

/** Hook to get locale-aware fonts (AR/UR use Arabic script fonts). */
export const useFonts = (): FontToken => {
  const { fonts } = useTheme();
  return fonts;
};
