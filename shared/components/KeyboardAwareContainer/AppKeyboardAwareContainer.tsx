import type React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";
import { styles } from "./KeyboardAwareContainer.style";
import type { KeyboardAwareContainerProps } from "./KeyboardAwareContainer.type";

const DEFAULT_BOTTOM_OFFSET = moderateScale(Platform.OS === "android" ? 12 : 8);
const DEFAULT_EXTRA_KEYBOARD_SPACE = moderateScale(
  Platform.OS === "android" ? 48 : 36
);

const KeyboardAwareContainer: React.FC<KeyboardAwareContainerProps> = ({
  children,
  style,
  contentContainerStyle,
  safeAreaStyle,
  useSafeAreaWrapper = true,
  fillParent = true,
  keyboardDismissMode = "on-drag",
  bottomOffset = DEFAULT_BOTTOM_OFFSET,
  extraKeyboardSpace = DEFAULT_EXTRA_KEYBOARD_SPACE,
}) => {
  const scrollView = (
    <KeyboardAwareScrollView
      style={StyleSheet.flatten([fillParent && { flex: 1 }, style])}
      contentContainerStyle={[styles.scrollViewContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={keyboardDismissMode}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
      enabled
      bottomOffset={bottomOffset}
      extraKeyboardSpace={extraKeyboardSpace}
      nestedScrollEnabled={Platform.OS === "android"}
    >
      {children}
    </KeyboardAwareScrollView>
  );

  // A flex:1 wrapper would collapse the scroll view inside a content-driven parent.
  if (!fillParent) {
    return scrollView;
  }

  if (useSafeAreaWrapper) {
    return (
      <SafeAreaView style={[styles.safeArea, safeAreaStyle]}>
        {scrollView}
      </SafeAreaView>
    );
  }

  return <View style={[styles.safeArea, safeAreaStyle]}>{scrollView}</View>;
};

export default KeyboardAwareContainer;
