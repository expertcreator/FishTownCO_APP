import type { ReactNode } from "react";
import type { ScrollViewProps, StyleProp, ViewStyle } from "react-native";

export type KeyboardAwareContainerProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  safeAreaStyle?: StyleProp<ViewStyle>;
  /**
   * When false, uses a plain View instead of SafeAreaView. Use when a parent
   * screen (e.g. one SafeAreaView) already applies insets to avoid double top/bottom padding.
   */
  useSafeAreaWrapper?: boolean;
  fillParent?: boolean;
  keyboardDismissMode?: ScrollViewProps["keyboardDismissMode"];
  bottomOffset?: number;
  extraKeyboardSpace?: number;
};
