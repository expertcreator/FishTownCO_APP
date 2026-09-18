import type { ReactNode } from "react";
import {
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

type KeyboardAwareContainerProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  safeAreaStyle?: StyleProp<ViewStyle>;
  useSafeAreaWrapper?: boolean;
  fillParent?: boolean;
  keyboardDismissMode?: "none" | "on-drag" | "interactive";
};

/**
 * Scroll container that lifts content above the keyboard.
 * @param props - Container props
 * @param props.children - Scrollable content
 * @param props.style - Scroll view style
 * @param props.contentContainerStyle - Inner content style
 * @param props.safeAreaStyle - Style when the safe-area wrapper is on
 * @param props.useSafeAreaWrapper - Wrap in `SafeAreaView` (default true)
 * @param props.fillParent - Stretch to fill the parent
 * @param props.keyboardDismissMode - How dragging dismisses the keyboard
 * @returns Keyboard-aware scroll element
 */
export function KeyboardAwareContainer({
  children,
  style,
  contentContainerStyle,
  safeAreaStyle,
  useSafeAreaWrapper = true,
  fillParent = true,
  keyboardDismissMode = "on-drag",
}: KeyboardAwareContainerProps) {
  const scroll = (
    <KeyboardAwareScrollView
      style={[fillParent ? styles.fill : undefined, style]}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={keyboardDismissMode}
      showsVerticalScrollIndicator={false}
      bottomOffset={24}
    >
      {children}
    </KeyboardAwareScrollView>
  );

  if (!useSafeAreaWrapper) {
    return scroll;
  }

  return (
    <SafeAreaView style={[styles.fill, safeAreaStyle]}>{scroll}</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
