import type { ComponentProps, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { Ionicons } from "@expo/vector-icons";

export type FloatingActionButtonIconName = ComponentProps<
  typeof Ionicons
>["name"];

export type FloatingActionButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  iconName?: FloatingActionButtonIconName;
  iconSize?: number;
  iconColor?: string;
  children?: ReactNode;
  badgeCount?: number;
  disabled?: boolean;
  size?: number;
  bottom?: number;
  end?: number;
  start?: number;
  /** Lift by the bottom safe-area inset (home indicator). Pass `false` when `bottom`/`style` already includes tab chrome. */
  avoidTabBar?: boolean;
  style?: StyleProp<ViewStyle>;
};
