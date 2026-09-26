import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type FloatingActionButtonProps = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

/**
 * Floating action button (FAB) pinned above the tab bar.
 * @param props - FAB props
 * @param props.label - Button label
 * @param props.onPress - Press handler
 * @param props.icon - Leading icon (defaults to add)
 * @returns Floating action button element
 */
export function FloatingActionButton({
  label,
  onPress,
  icon = "add",
}: FloatingActionButtonProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { bottom: Math.max(insets.bottom, 12) + 8 }]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons name={icon} size={20} color={colors.white} />
        <AppText style={styles.label}>{label}</AppText>
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
      alignItems: "center",
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
