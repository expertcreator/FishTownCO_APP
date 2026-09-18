import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import { KeyboardAwareContainer } from "./KeyboardAwareContainer";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ("top" | "right" | "bottom" | "left")[];
};

/**
 * Cream-backed screen shell. Scrolling screens use Foori's keyboard-aware container.
 * @param props - Screen props
 * @param props.children - Screen content
 * @param props.scroll - Whether content scrolls
 * @param props.style - Optional outer style
 * @param props.contentStyle - Optional content style
 * @param props.edges - Safe-area edges to apply
 * @returns Screen element
 */
export function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
  edges = ["top", "left", "right", "bottom"],
}: ScreenProps) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      {scroll ? (
        <KeyboardAwareContainer
          useSafeAreaWrapper={false}
          style={styles.flex}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardDismissMode="on-drag"
        >
          {children}
        </KeyboardAwareContainer>
      ) : (
        <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 8,
  },
});
