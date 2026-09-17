import type { StyleProp, TextStyle, ViewStyle } from "react-native";

export type ToastPosition = "top" | "bottom";

/** Semantic toast kinds rendered by the shared provider. */
export type ToastTone = "success" | "error" | "info" | "warn";

/**
 * Optional per-brand / per-app visual overrides.
 * Omit fields to keep the default brand-neutral palette.
 */
export type ToastThemeOverride = {
  /** Card surface (default white). */
  backgroundColor?: string;
  /** Primary message color. */
  textColor?: string;
  /** Secondary message color. */
  textSecondaryColor?: string;
  /** Soft outer shadow color. */
  shadowColor?: string;
  /** Border around the card. */
  borderColor?: string;
  /** Override accent / icon colors per tone. */
  tones?: Partial<
    Record<
      ToastTone,
      {
        accent?: string;
        icon?: string;
        iconBackground?: string;
      }
    >
  >;
};

export type ToastifyConfig = {
  position?: ToastPosition;
  autoHide?: boolean;
  visibilityTime?: number;
  topOffset?: number;
  bottomOffset?: number;
  width?: number;
  animationIn?: string;
  animationOut?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  /** Brand / app visual tweaks without forking the component. */
  theme?: ToastThemeOverride;
};

export type ShowToastOptions = {
  position?: ToastPosition;
  visibilityTime?: number;
  autoHide?: boolean;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  /**
   * `default` — always use the root Toastify provider (legacy behavior).
   * `sellSheet` — force the in-sheet host when Sell Sheet is open.
   * Omit — auto-route to Sell Sheet host when the sheet is open.
   */
  presentationLayer?: "default" | "sellSheet";
};
