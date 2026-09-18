import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Appearance, useColorScheme } from "react-native";
import {
  getThemeColors,
  type ThemeColors,
} from "@/ui/constants/theme";
import { mmkv } from "@/ui/stores/mmkvStorage";

export type ColorScheme = "light" | "dark";
export type ThemePreference = "system" | ColorScheme;

type ThemeContextType = {
  colors: ThemeColors;
  colorScheme: ColorScheme;
  isDark: boolean;
  isLight: boolean;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "app_theme_preference";

type ThemeProviderProps = {
  children: ReactNode;
};

/**
 * Reads the saved theme preference. Missing or unknown values follow the system.
 * @returns Saved preference
 */
function getSavedThemePreference(): ThemePreference {
  const saved = mmkv.getString(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark" || saved === "system") {
    return saved;
  }
  return "system";
}

/**
 * Provides light/dark colors the same way Foori does: system scheme, or an explicit choice saved in MMKV.
 * @param props - Provider props
 * @param props.children - App tree
 * @returns Theme provider
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setStoredThemePreference] = useState<ThemePreference>(
    getSavedThemePreference
  );
  const [currentScheme, setCurrentScheme] = useState<ColorScheme>(() => {
    const saved = getSavedThemePreference();
    if (saved === "system") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return saved;
  });

  const setThemePreference = (pref: ThemePreference) => {
    mmkv.set(THEME_STORAGE_KEY, pref);
    setStoredThemePreference(pref);
  };

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themePreference === "system") {
        setCurrentScheme(colorScheme === "dark" ? "dark" : "light");
      }
    });
    return () => subscription.remove();
  }, [themePreference]);

  useEffect(() => {
    if (themePreference === "system") {
      setCurrentScheme(systemColorScheme === "dark" ? "dark" : "light");
    } else {
      setCurrentScheme(themePreference);
    }
  }, [systemColorScheme, themePreference]);

  const toggleTheme = () => {
    setStoredThemePreference((prev) => {
      const next: ThemePreference =
        prev === "system"
          ? currentScheme === "dark"
            ? "light"
            : "dark"
          : prev === "dark"
            ? "light"
            : "dark";
      mmkv.set(THEME_STORAGE_KEY, next);
      return next;
    });
  };

  const isDark = currentScheme === "dark";
  const value: ThemeContextType = {
    colors: getThemeColors(isDark),
    colorScheme: currentScheme,
    isDark,
    isLight: !isDark,
    themePreference,
    setThemePreference,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Reads the active theme. Throws if used outside `ThemeProvider`.
 * @returns Theme state and controls
 * @throws {Error} When called outside `ThemeProvider`
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Returns the active light or dark palette.
 * @returns Color tokens for the current scheme
 */
export function useColors(): ThemeColors {
  return useTheme().colors;
}
