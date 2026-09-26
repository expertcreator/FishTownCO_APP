import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type InlineActionProps = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
};

/**
 * Compact teal text action with optional icon (e.g. Use current location).
 * @param props - Action props
 * @param props.label - Action label
 * @param props.onPress - Press handler
 * @param props.icon - Leading icon when not loading
 * @param props.loading - Shows a busy icon and disables press
 * @param props.disabled - Disables the action
 * @returns Inline action element
 */
export function InlineAction({
  label,
  onPress,
  icon = "locate-outline",
  loading = false,
  disabled = false,
}: InlineActionProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.row,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons
        name={loading ? "hourglass-outline" : icon}
        size={16}
        color={colors.teal}
      />
      <AppText style={styles.label}>{label}</AppText>
    </Pressable>
  );
}

/**
 * Builds inline-action styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    label: {
      color: colors.teal,
      fontSize: 13,
      fontWeight: "700",
    },
    pressed: { opacity: 0.75 },
    disabled: { opacity: 0.55 },
  });
}
