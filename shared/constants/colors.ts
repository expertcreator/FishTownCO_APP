// Base colors that don't change between themes
import { APP_CONFIG } from "./appConfig";

/**
 * Converts a hex color to rgba with specified opacity
 * @param hex - Hex color string (e.g., "#E82A1C" or "E82A1C")
 * @param opacity - Opacity value between 0 and 1 (e.g., 0.18 for 18%)
 * @returns rgba color string (e.g., "rgba(232, 42, 28, 0.18)")
 */
export function hexToRgba(hex: string, opacity: number): string {
  // Remove # if present
  const cleanHex = hex.replace("#", "");

  // Parse RGB values
  const r = Number.parseInt(cleanHex.substring(0, 2), 16);
  const g = Number.parseInt(cleanHex.substring(2, 4), 16);
  const b = Number.parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export const baseColors = {
  primary: APP_CONFIG.colors.primary, // 👈 From appConfig
  primary1: APP_CONFIG.colors.primary1, // 👈 From appConfig
  secondary: APP_CONFIG.colors.secondary, // 👈 From appConfig
  red: APP_CONFIG.colors.error, // 👈 From appConfig
  green: APP_CONFIG.colors.success, // 👈 From appConfig
  blue: APP_CONFIG.colors.info, // 👈 From appConfig
  yellow: APP_CONFIG.colors.warning, // 👈 From appConfig
  star: "#FFE14D", // 👈 From appConfig (rating stars)
  purple: "#8B5CF6",
  pink: "#EC4899",
  indigo: "#6366F1",
  whitePure: "#FFFFFF",
};

// Light theme colors
export const lightColors = {
  ...baseColors,
  background: "#FFFFFF",
  surface: "#F6F6F6",
  card: "#FFFFFF",
  text: "#000000",
  textSecondary: "#858585",
  textTertiary: "#CCCCCC",
  border: "#E5E7EB",
  inputBackground: "rgba(0, 0, 0, 0.05)",
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "rgba(0, 0, 0, 0.1)",
  disabled: "#D1D5DB",
  placeholder: "#9CA3AF",
  posHomeBackground: "#F0F9FF",
  softlightgrey: "#ECECEC",
  searchBackground: "#FFFFFF",
  whitePure: "#FFFFFF",
  blackRed: "#000000",
  shadowColor1: "#F6F6F6",
  shadowColor2: "#F6F6F6",
  pink: baseColors.pink,
  saveBannerBackground: "#E1E1E180",
  dealsSectionBackground1: hexToRgba(APP_CONFIG.colors.primary, 0.5),
  dealsSectionBackground2: "#FFF4F6",
};

// Dark theme — teal-charcoal page (not pure black), matching Live Workspace Sell
export const darkColors = {
  ...baseColors,
  background: "#000000",
  surface: "#1A2424",
  card: "#1A2424",
  text: "#FFFFFF",
  textSecondary: "#9E9E9E",
  textTertiary: "#666666",
  border: "#2A3535",
  inputBackground: "rgba(255, 255, 255, 0.08)",
  overlay: "rgba(0, 0, 0, 0.7)",
  shadow: "rgba(0, 0, 0, 0.3)",
  disabled: "#4B5563",
  placeholder: "#6B7280",
  posHomeBackground: "#0E1616",
  softlightgrey: "#243030",
  searchBackground: "#1A2424",
  whitePure: "#FFFFFF",
  blackRed: baseColors.primary,
  shadowColor1: "#1A2424",
  shadowColor2: "rgba(236, 231, 231, 0.05)",
  pink: "#FFDFDF",
  saveBannerBackground: "#1A2424",
  dealsSectionBackground1: APP_CONFIG.colors.primary,
  dealsSectionBackground2: "#1A2424",
};

// Function to get theme-aware colors based on isDark parameter
export const getThemeColors = (isDark: boolean) => {
  const themeColors = isDark ? darkColors : lightColors;

  return {
    // Your existing color names that automatically adapt
    primary: baseColors.primary,
    primary1: baseColors.primary1,
    secondary: baseColors.secondary,
    white: themeColors.background, // Automatically white in light, dark background in dark
    black: themeColors.text, // Automatically black in light, white in dark
    gray: themeColors.textSecondary,
    lightGray: themeColors.border,
    red: baseColors.red,
    card: themeColors.card,
    green: baseColors.green,
    inputBackground: themeColors.inputBackground,
    lightGray2: themeColors.textSecondary,
    cardColor: themeColors.card,
    softlightgrey: themeColors.softlightgrey,
    // Additional theme-aware colors
    background: themeColors.background,
    posHomeBackground: themeColors.posHomeBackground,
    text: themeColors.text,
    textSecondary: themeColors.textSecondary,
    disabled: themeColors.disabled,
    border: themeColors.border,
    surface: themeColors.surface,
    shadow: themeColors.shadow,
    overlay: themeColors.overlay,
    searchBackground: themeColors.searchBackground,
    placeholder: themeColors.placeholder,
    yellow: baseColors.yellow,
    star: baseColors.star,
    whitePure: themeColors.whitePure,
    blackRed: themeColors.blackRed,
    primaryRed: baseColors.primary,
    shadowColor1: themeColors.shadowColor1,
    shadowColor2: themeColors.shadowColor2,
    pink: themeColors.pink,
    saveBannerBackground: themeColors.saveBannerBackground,
    dealsSectionBackground1: themeColors.dealsSectionBackground1,
    dealsSectionBackground2: themeColors.dealsSectionBackground2,
  };
};

/**
 * Back-compat workspace palette used by Board/Sell chrome.
 * Keep this small and derived from shared brand colors — feature files must not invent hex.
 */
const DOCK_INK = "#0F2F2E";
const SUCCESS_INK = "#15803D";
const KITCHEN_STATUS_INK = "#0F766E";
const TAB_BADGE = "#FF3B30";

export const workspaceColors = {
  headerGradient: [baseColors.primary1, baseColors.primary] as const,
  danger: baseColors.red,
  openGreen: baseColors.green,
  accentTeal: baseColors.secondary,
  accentMint: baseColors.primary,
  softMint: "#7FD9D3",
  needSub: "#FF9C93",
  dockBg: DOCK_INK,
  dockShadow: hexToRgba(DOCK_INK, 0.34),
  dockWash: hexToRgba(DOCK_INK, 0.08),
  dockWashBorder: hexToRgba(DOCK_INK, 0.1),
  variantChipBg: hexToRgba(baseColors.primary, 0.12),
  variantChipInk: baseColors.secondary,
  mintWash: hexToRgba(baseColors.primary, 0.08),
  mintWashStrong: hexToRgba(baseColors.primary, 0.09),
  tealWash: hexToRgba(baseColors.primary, 0.14),
  tealWashStrong: hexToRgba(baseColors.primary, 0.16),
  tealWashBorder: hexToRgba(baseColors.primary, 0.45),
  formPanelBorder: hexToRgba(baseColors.primary, 0.28),
  warnWash: hexToRgba(baseColors.yellow, 0.14),
  warnBorder: hexToRgba(baseColors.yellow, 0.35),
  warnInk: "#8A5A16",
  /** Amended / revision-waiting cream surface (artboard #64). */
  warnCream: "#FFF6EC",
  warnCreamBorder: "#F3DFC6",
  warnMutedInk: "#B08A50",
  /** Soft teal-gray panel (secondary CTAs on Live bill). */
  softPanel: "#F1F5F5",
  dangerInk: "#C0554D",
  dangerWash: hexToRgba(baseColors.red, 0.08),
  dangerWashStrong: hexToRgba(baseColors.red, 0.1),
  dangerWashMid: hexToRgba(baseColors.red, 0.14),
  dangerBorderSoft: hexToRgba(baseColors.red, 0.35),
  dangerBorderStrong: hexToRgba(baseColors.red, 0.55),
  printerOfflineInk: "#B4763A",
  caughtUpBg: hexToRgba(baseColors.primary, 0.08),
  caughtUpBorder: hexToRgba(baseColors.primary, 0.28),
  boardCardBorder: hexToRgba(DOCK_INK, 0.07),
  boardCardShadow: hexToRgba(DOCK_INK, 0.06),
  tableFreeBg: hexToRgba(baseColors.green, 0.08),
  tableFreeBorder: hexToRgba(baseColors.green, 0.3),
  tableFreeInk: SUCCESS_INK,
  whatsappInk: SUCCESS_INK,
  whatsappWash: hexToRgba(baseColors.green, 0.12),
  successWash: hexToRgba(SUCCESS_INK, 0.14),
  contactMutedInk: baseColors.primary1,
  kitchenStatusInk: KITCHEN_STATUS_INK,
  whitePure: baseColors.whitePure,
  whiteWash18: "rgba(255,255,255,0.18)",
  whiteWash28: "rgba(255,255,255,0.28)",
  whiteWash16: "rgba(255,255,255,0.16)",
  whiteWash14: "rgba(255,255,255,0.14)",
  whiteWash12: "rgba(255,255,255,0.12)",
  whiteWash72: "rgba(255,255,255,0.72)",
  /** Paid-bar subcopy (artboard 1a). */
  whiteWash75: "rgba(255,255,255,0.75)",
  /** Paid-bar undo progress fill (artboard 1a). */
  whiteWash80: "rgba(255,255,255,0.8)",
  /** Paid-bar footer link divider (artboard 1a). */
  paidLinkDivider: "#E4EBEB",
  tabBadge: TAB_BADGE,
  tabIdleDark: "rgba(235,235,245,0.55)",
  tabIndicatorDark: "rgba(255,255,255,0.14)",
  tabShadowLight: "rgba(0,0,0,0.08)",
  tabRippleDark: "rgba(255,255,255,0.12)",
  heroBorderLight: hexToRgba(DOCK_INK, 0.18),
  heroBorderDark: "rgba(255,255,255,0.18)",
  liveCalmRing: hexToRgba(baseColors.primary, 0.22),
  liveNeedRing: hexToRgba(baseColors.red, 0.22),
} as const;

/**
 * Live Workspace drawer-only colors (artboard 1a).
 * Reuse `workspaceColors` / `baseColors` for white washes, logo, badge, printer green.
 */
export const drawerColors = {
  gradient: ["#3E5F64", "#2B4A4E", "#173033"] as const,
  /** Solid fallback when blur isn't available; kept light so BlurView reads through. */
  scrim: hexToRgba("#0B1A1A", 0.28),
  blurTint: hexToRgba("#0B1A1A", 0.22),
  headerMuted: "rgba(255,255,255,0.6)",
  footerMuted: "rgba(255,255,255,0.62)",
  footerName: "rgba(255,255,255,0.82)",
  printerOffline: "rgba(255,255,255,0.35)",
} as const;

// Default static colors (for backward compatibility)
const colors = {
  primary: baseColors.primary,
  primary1: baseColors.primary1,
  secondary: baseColors.secondary,
  white: "#FFFFFF",
  black: "#000000",
  gray: "#858585",
  lightGray: "#E5E7EB",
  red: baseColors.red,
  green: baseColors.green,
  blue: baseColors.blue,
  yellow: baseColors.yellow,
  star: baseColors.star,
  purple: baseColors.purple,
  pink: baseColors.pink,
  indigo: baseColors.indigo,
  primaryRed: baseColors.primary,
  primaryRedLight: hexToRgba(baseColors.primary, 0.18), // Lighter/transparent version of primary red for date range in-between dates
  disabled: "#D1D5DB",
  inputBackground: "rgba(0, 0, 0, 0.25)",
  lightGray2: "#858585",
  lightGray3: "#E5E7EB",
  lightGray4: "#EFEFEF",
  blobColor: baseColors.primary,
  lightBackgroundGray: "#FBFBFB",
  cardColor: "#F6F6F6",
  posHomeBackground: "#F0F9FF",
  shadowColor1: "rgba(0, 0, 0, 0.1)",
  shadowColor2: "rgba(0, 0, 0, 0.05)",
  plum: "#C797EB",
};

export default colors;
