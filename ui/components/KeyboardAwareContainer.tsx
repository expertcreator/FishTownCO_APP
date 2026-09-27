import type { ReactNode } from "react";
import {
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
  /** Kept for API compatibility; scrolling never dismisses the keyboard. */
  keyboardDismissMode?: "none" | "on-drag" | "interactive";
  /**
   * Extra space above the keyboard when focusing a field.
   * Keep this >= sticky footer height so inputs are not covered by Save.
   */
  bottomOffset?: number;
  /** Called when the user starts dragging the scroll view. */
  onScrollBeginDrag?: (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => void;
};

/** Default clearance for screens that use `StickyFormFooter` under the scroll view. */
const DEFAULT_BOTTOM_OFFSET = 96;

/**
 * Scroll container that lifts content above the keyboard.
 * Scrolling does not dismiss the keyboard (matches product requirement).
 * @param props - Container props
 * @param props.children - Scrollable content
 * @param props.style - Scroll view style
 * @param props.contentContainerStyle - Inner content style
 * @param props.safeAreaStyle - Style when the safe-area wrapper is on
 * @param props.useSafeAreaWrapper - Wrap in `SafeAreaView` (default true)
 * @param props.fillParent - Stretch to fill the parent
 * @param props.keyboardDismissMode - Ignored for dismiss-on-scroll; always `none`
 * @param props.bottomOffset - Space kept above the keyboard for sticky footers
 * @param props.onScrollBeginDrag - Optional scroll-begin handler
 * @returns Keyboard-aware scroll element
 */
export function KeyboardAwareContainer({
  children,
  style,
  contentContainerStyle,
  safeAreaStyle,
  useSafeAreaWrapper = true,
  fillParent = true,
  bottomOffset = DEFAULT_BOTTOM_OFFSET,
  onScrollBeginDrag,
}: KeyboardAwareContainerProps) {
  const scroll = (
    <KeyboardAwareScrollView
      style={[fillParent ? styles.fill : undefined, style]}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      showsVerticalScrollIndicator={false}
      bottomOffset={bottomOffset}
      onScrollBeginDrag={onScrollBeginDrag}
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
