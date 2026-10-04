import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors, type ThemeColors } from "@/ui/theme";
import { KeyboardAwareContainer } from "./KeyboardAwareContainer";

type ScreenProps = {
  children: ReactNode;
  /** Stays pinned above the scrolling content. */
  header?: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ("top" | "right" | "bottom" | "left")[];
};

/**
 * Cream-backed screen shell. Scrolling screens use the shared keyboard-aware container.
 * @param props - Screen props
 * @param props.children - Screen content
 * @param props.header - Header pinned above the scroll content
 * @param props.scroll - Whether content scrolls
 * @param props.style - Optional outer style
 * @param props.contentStyle - Optional content style
 * @param props.edges - Safe-area edges to apply
 * @returns Screen element
 */
export function Screen({
  children,
  header,
  scroll = true,
  style,
  contentStyle,
  edges = ["top", "left", "right", "bottom"],
}: ScreenProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const contentStyles = [
    styles.content,
    header ? styles.contentUnderHeader : null,
    contentStyle,
  ];

  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      {header ? <View style={styles.header}>{header}</View> : null}
      {scroll ? (
        <KeyboardAwareContainer
          useSafeAreaWrapper={false}
          style={styles.flex}
          contentContainerStyle={contentStyles}
        >
          {children}
        </KeyboardAwareContainer>
      ) : (
        <View style={[contentStyles, styles.flex]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 8,
    zIndex: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 8,
  },
  contentUnderHeader: {
    paddingTop: 0,
  },
  });
}
