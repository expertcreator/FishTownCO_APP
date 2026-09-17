import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type BackButtonProps = {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
  backgroundColor?: string;
  size?: number;
  icon?: ReactNode;
};
