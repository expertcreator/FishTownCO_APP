import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type FloatingActionButtonProps = {
  /** Visible label. Omit or pass empty for an icon-only FAB. */
  label?: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Accessibility label when visible text is hidden. */
  accessibilityLabel?: string;
};

/**
 * Floating action button (FAB) pinned above the tab bar.
 * @param props - FAB props
 * @param props.label - Optional visible label (hidden when empty)
 * @param props.onPress - Press handler
 * @param props.icon - Leading icon (defaults to add)
 * @param props.accessibilityLabel - Screen-reader label when icon-only
 * @returns Floating action button element
 */
export function FloatingActionButton({
  label,
  onPress,
  icon = "add",
  accessibilityLabel,
}: FloatingActionButtonProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  const showLabel = Boolean(label?.trim());
  const a11y = accessibilityLabel?.trim() || label?.trim() || "Add";

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { bottom: Math.max(insets.bottom, 12) + 8 }]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.fab,
          !showLabel && styles.fabIconOnly,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={a11y}
      >
        <Ionicons name={icon} size={showLabel ? 20 : 28} color={colors.white} />
        {showLabel ? <AppText style={styles.label}>{label}</AppText> : null}
      </Pressable>
    </View>
  );
}

/**
 * Builds FAB styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    host: {
      position: "absolute",
      left: 20,
      right: 20,
      alignItems: "flex-end",
      zIndex: 20,
    },
    fab: {
      minHeight: 56,
      paddingHorizontal: 22,
      borderRadius: 999,
      backgroundColor: colors.orange,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      shadowColor: colors.navy,
      shadowOpacity: 0.22,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
    },
    fabIconOnly: {
      width: 56,
      paddingHorizontal: 0,
      marginRight: 4,
    },
    label: {
      color: colors.white,
      fontSize: 13,
      fontWeight: "800",
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
    },
  });
}
