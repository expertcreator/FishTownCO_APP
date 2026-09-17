import { Platform, type TextStyle, type ViewStyle } from "react-native";

export const textFlexInRow: TextStyle = {
  flex: 1,
  minWidth: 0,
};

export const textRowHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-start",
};

export const textRowTrailing: TextStyle = {
  flexShrink: 0,
};

export const textAndroidSafe: TextStyle = Platform.select({
  android: { includeFontPadding: true },
  default: {},
}) ?? {};
