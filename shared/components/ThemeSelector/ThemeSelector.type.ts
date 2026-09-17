import type { StyleProp, ViewStyle } from "react-native";

export type ThemeSelectorVariant =
  | "default"
  | "compact"
  | "toggle"
  | "segmented"
  | "preference";

export type ThemeSegmentIcon = "sunny" | "moon" | "auto";

export type ThemeSelectorProps = {
  variant?: ThemeSelectorVariant;
  style?: StyleProp<ViewStyle>;
};
