// 🎯 Master Configuration - Change this to rebrand entire app!
export {
  APP_BRAND,
  BRAND_COLOR_PALETTES,
  default as APP_CONFIG,
} from "./appConfig";
export type {
  AppBrand,
  AppConfig,
  BrandColorPalette,
} from "./appConfig.types";
export { APP_BRAND_IDS } from "./appConfig.types";
export { env } from "./env";
export type { AppVariant } from "./env";

// Theme & Design System (reads from APP_CONFIG)
export {
  baseColors,
  default as colors,
  darkColors,
  getThemeColors,
  lightColors,
  workspaceColors,
} from "./colors";
export {
  default as fonts,
  getFontsForLanguage,
  loadFonts,
  type FontName,
  type FontToken,
} from "./fonts";
export { default as fontSizes } from "./fontSizes";
export {
  getSheetModalHeaderContainerStyle,
  getSheetModalTitleTypography,
  SHEET_MODAL_HEADER_TOP_SPACING,
} from "./sheetModalTypography";
export {
  CARD_SHADOW,
  CARD_SHADOW_POPOVER,
  ORDER_CARD_SHADOW,
} from "./cardShadow";
export { default as iconSizes } from "./iconSizes";
export {
  textAndroidSafe,
  textFlexInRow,
  textRowHeader,
  textRowTrailing,
} from "./textLayout";
export {
  EMPTY_STATE_IMAGE_DIMENSION,
  EMPTY_STATE_IMAGE_SIZE,
  SCREEN_FIRST_HEADING_TOP_SPACING,
  SECTION_HEADING_BOTTOM_SPACING,
} from "./layout";
export { getViewAllTypography } from "./viewAllTypography";
export { Icons, Images, type IconKey, type ImageKey } from "./images";
export { getGoogleMapsApiKey } from "./googleMapsApiKey";
