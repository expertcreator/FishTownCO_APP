import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type StickyFormFooterProps = {
  children: ReactNode;
  error?: string | null;
};

/**
 * Fixed bottom form footer for primary CTA + validation error (non-scrolling).
 * @param props - Footer props
 * @param props.children - Usually the primary action button
 * @param props.error - Optional validation / submit error shown above the CTA
 * @returns Sticky form footer element
 */
export function StickyFormFooter({ children, error }: StickyFormFooterProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
      pointerEvents="box-none"
    >
      {error ? <AppText style={styles.error}>{error}</AppText> : null}
      {children}
    </View>
  );
}

/**
 * Builds sticky-footer styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: 20,
      paddingTop: 12,
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      gap: 8,
    },
    error: {
      color: colors.statusOverdueText,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
    },
  });
}
