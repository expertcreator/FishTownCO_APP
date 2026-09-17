import type { StyleProp, ViewStyle } from "react-native";

export type HeaderWithBackButtonProps = {
  titleKey: string;
  fallback: string;
  style?: StyleProp<ViewStyle>;
};
