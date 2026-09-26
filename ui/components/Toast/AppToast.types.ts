import type { StyleProp, TextStyle, ViewStyle } from "react-native";

/** Toast placement on screen. */
export type ToastPosition = "top" | "bottom";

/** Semantic toast kinds rendered by the provider. */
export type ToastTone = "success" | "error" | "info" | "warn";

/**
 * Optional visual overrides for the toast card.
 */
export type ToastThemeOverride = {
  backgroundColor?: string;
  textColor?: string;
  textSecondaryColor?: string;
  shadowColor?: string;
  borderColor?: string;
};

/**
 * Provider-level toast configuration.
 */
export type ToastifyConfig = {
  position?: ToastPosition;
  autoHide?: boolean;
  visibilityTime?: number;
  topOffset?: number;
  bottomOffset?: number;
  theme?: ToastThemeOverride;
};

/**
 * Options for a single toast presentation.
 */
export type ShowToastOptions = {
  position?: ToastPosition;
  visibilityTime?: number;
  autoHide?: boolean;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};
