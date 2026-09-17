/**
 * Master app configuration (fonts, sizes, icon sizes).
 * Brand colors for Fishtownco Vessel Companion.
 */

import type { AppBrand, AppConfig, BrandColorPalette } from "./appConfig.types";

/**
 * Resolves the active app brand. This repo is Fishtownco-only.
 * @returns Always `fishtownco`
 */
function resolveAppBrand(): AppBrand {
  return "fishtownco";
}

/** Active palette id. */
export const APP_BRAND: AppBrand = resolveAppBrand();

/**
 * Central color map for Fishtownco (cream / navy / teal / orange from design).
 */
export const BRAND_COLOR_PALETTES = {
  fishtownco: {
    primary: "#F06524",
    primary1: "#1B2A4A",
    secondary: "#2F6F6A",
    accent: "#F5F0E6",
    success: "#22C55E",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#38BDF8",
  },
} satisfies Record<AppBrand, BrandColorPalette>;

export const APP_CONFIG: AppConfig = {
  brand: APP_BRAND,
  colors: BRAND_COLOR_PALETTES[APP_BRAND],

  fontSizes: {
    h1: 30,
    h2: 28,
    h3: 22,
    h4: 20,
    h5: 18,
    h6: 16,
    p: 14,
    small: 12,
    tiny: 10,
  },

  fontFamily: {
    heading: "Roboto-SemiBold",
    title: "Inter-Medium",
    subTitle: "Inter-Regular",
    button: "Inter-SemiBold",
    caption: "Inter-Light",
    robotoMedium: "Roboto-Medium",
    robotoRegular: "Roboto-Regular",
    robotoLight: "Roboto-Light",
  },

  fontFamilyAr: {
    heading: "IBM-SemiBold",
    title: "Cairo-Medium",
    subTitle: "Cairo-Regular",
    button: "Cairo-SemiBold",
    caption: "Cairo-Light",
  },

  iconSizes: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    xxl: 32,
  },
};

export default APP_CONFIG;
