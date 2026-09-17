import type { StyleProp, TextStyle } from "react-native";

export type ClickablePhoneNumberProps = {
  phoneNumber?: string | null;
  fallback?: string;
  textStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
  accessibilityLabel?: string;
};
