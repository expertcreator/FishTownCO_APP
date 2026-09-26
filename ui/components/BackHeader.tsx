import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type BackHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
};

/**
 * Prototype header: back arrow and title on one row (Fishtownco layout).
 * @param props - Header props
 * @param props.title - Screen title
 * @param props.subtitle - Optional supporting line under the title row
 * @param props.onBack - Optional back handler
 * @param props.right - Optional trailing action (e.g. edit)
 * @returns Header element
 */
export function BackHeader({ title, subtitle, onBack, right }: BackHeaderProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          onPress={onBack ?? (() => router.back())}
          hitSlop={12}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </Pressable>
        <AppText style={styles.title} numberOfLines={2}>
          {title}
        </AppText>
        <View style={styles.right}>
          {right ?? <View style={styles.rightSpacer} />}
        </View>
      </View>
      {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
    </View>
  );
}

/**
 * Builds back-header styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { marginBottom: 14 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 40,
    },
    back: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -6,
    },
    pressed: { opacity: 0.7 },
    title: {
      flex: 1,
      color: colors.navy,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    right: {
      minWidth: 36,
      alignItems: "flex-end",
      justifyContent: "center",
    },
    rightSpacer: { width: 36, height: 36 },
    subtitle: {
      color: colors.muted,
      fontSize: 14,
      marginTop: 8,
      marginLeft: 30,
      lineHeight: 20,
    },
  });
}
