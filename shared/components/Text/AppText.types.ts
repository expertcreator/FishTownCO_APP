import type { ReactNode } from "react";
import type { StyleProp, TextProps, TextStyle } from "react-native";

export interface AppTextProps
  extends Pick<
    TextProps,
    | "numberOfLines"
    | "adjustsFontSizeToFit"
    | "ellipsizeMode"
    | "minimumFontScale"
    | "onTextLayout"
  > {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  color?: string;
  fontSize?: number;
  fontWeight?: TextStyle["fontWeight"];
  textAlign?: TextStyle["textAlign"];
}
