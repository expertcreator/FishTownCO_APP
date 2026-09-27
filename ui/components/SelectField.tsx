import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type SelectFieldProps = {
  label: string;
  /** Optional muted suffix next to the label (e.g. "(if applicable)"). */
  labelHint?: string;
  value: string;
  placeholder: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Trailing icon; defaults to chevron-down. */
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  loading?: boolean;
  onPress: () => void;
};

/**
 * Read-only pressable field used for pickers (category, location, date).
 * Matches Foori-style tappable inputs with press feedback.
 * @param props - Select field props
 * @param props.label - Uppercase field label
 * @param props.labelHint - Optional muted label suffix
 * @param props.value - Selected value shown in the row
 * @param props.placeholder - Placeholder when empty
 * @param props.icon - Optional leading icon
 * @param props.trailingIcon - Optional trailing icon (default chevron-down)
 * @param props.error - Validation message
 * @param props.loading - Shows a busy state on the trailing icon
 * @param props.onPress - Opens the picker
 * @returns Pressable select field
 */
export function SelectField({
  label,
  labelHint,
  value,
  placeholder,
  icon,
  trailingIcon = "chevron-down",
  error,
  loading = false,
  onPress,
}: SelectFieldProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const hasValue = Boolean(value.trim());

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <AppText style={styles.label}>{label}</AppText>
        {labelHint ? (
          <AppText style={styles.labelHint}>{labelHint}</AppText>
        ) : null}
      </View>
      <Pressable
        onPress={onPress}
        disabled={loading}
        android_ripple={{ color: "rgba(13,44,65,0.08)" }}
        style={({ pressed }) => [
          styles.inputRow,
          error ? styles.inputError : null,
          pressed && !loading && styles.pressed,
          loading && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {icon ? (
          <Ionicons name={icon} size={18} color={colors.muted} style={styles.icon} />
        ) : null}
        <AppText
          style={[styles.value, !hasValue && styles.placeholder]}
          numberOfLines={1}
        >
          {hasValue ? value : placeholder}
        </AppText>
        <Ionicons
          name={loading ? "hourglass-outline" : trailingIcon}
          size={18}
          color={colors.muted}
        />
      </Pressable>
      {error ? <AppText style={styles.error}>{error}</AppText> : null}
    </View>
  );
}

/**
 * Builds select-field styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { gap: 8 },
    labelRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
      flexWrap: "wrap",
    },
    label: {
      color: colors.navy,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    labelHint: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "500",
    },
    inputRow: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      backgroundColor: colors.card,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      overflow: "hidden",
    },
    pressed: {
      opacity: 0.88,
      backgroundColor: colors.cardSoft,
      transform: [{ scale: 0.99 }],
    },
    disabled: { opacity: 0.6 },
    icon: { marginTop: 1 },
    value: {
      flex: 1,
      color: colors.navy,
      fontSize: 15,
      paddingVertical: 12,
    },
    placeholder: { color: colors.muted },
    inputError: {
      borderColor: colors.statusOverdueText,
    },
    error: {
      color: colors.statusOverdueText,
      fontSize: 12,
      fontWeight: "600",
    },
  });
}
