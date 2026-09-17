/**
 * Type definitions for App Configuration
 */

/** Fishtownco is the only brand in this app. */
export const APP_BRAND_IDS = ["fishtownco"] as const;
export type AppBrand = (typeof APP_BRAND_IDS)[number];

export type BrandColorPalette = {
  primary: string;
  primary1: string;
  secondary: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  info: string;
};

export type AppConfig = {
  /** Resolved white-label brand (from env). */
  brand: AppBrand;
  colors: BrandColorPalette;
  fontSizes: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    p: number;
    small: number;
    tiny: number;
  };
  fontFamily: {
    heading: string;
    title: string;
    subTitle: string;
    button: string;
    caption: string;
    robotoMedium: string;
    robotoRegular: string;
    robotoLight: string;
  };
  fontFamilyAr?: {
    heading: string;
    title: string;
    subTitle: string;
    button: string;
    caption: string;
  };
  iconSizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
};
