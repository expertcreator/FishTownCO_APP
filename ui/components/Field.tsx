import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

export type FieldTrailingAction = {
  /** Ionicons glyph shown as the icon-only button. */
  icon: keyof typeof Ionicons.glyphMap;
  /** Accessibility label for the icon button. */
  accessibilityLabel: string;
  /** Press handler. */
  onPress: () => void;
  /** Shows a spinner instead of the icon. */
  loading?: boolean;
  /** Disables the action. */
  disabled?: boolean;
};

type FieldProps = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secureToggle?: boolean;
  error?: string;
  /** Optional icon-only buttons rendered on the right of the input. */
  trailingActions?: FieldTrailingAction[];
};

/**
 * Labeled text field, same role as Foori `AppTextInput` / `AppFormField`.
 * @param props - Field props
 * @param props.label - Uppercase field label
 * @param props.icon - Optional leading Ionicons name
 * @param props.secureToggle - Show eye toggle for passwords
 * @param props.error - Validation message shown under the field
 * @param props.trailingActions - Optional icon-only buttons on the right
 * @returns Field element
 */
export function Field({
  label,
  icon,
  secureToggle,
  secureTextEntry,
  style,
  error,
  trailingActions,
  ...rest
}: FieldProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View style={styles.wrap}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        {icon ? (
          <Ionicons name={icon} size={18} color={colors.muted} style={styles.icon} />
        ) : null}
        <TextInput
          {...rest}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          placeholderTextColor={colors.muted}
          style={[styles.input, style]}
        />
        {secureToggle ? (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={10}>
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        ) : null}
        {trailingActions?.map((action) => {
          const isDisabled = Boolean(action.disabled || action.loading);
          return (
            <Pressable
              key={`${action.icon}-${action.accessibilityLabel}`}
              onPress={action.onPress}
              disabled={isDisabled}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel}
              style={({ pressed }) => [
                styles.trailingBtn,
                pressed && !isDisabled && styles.trailingBtnPressed,
                isDisabled && styles.trailingBtnDisabled,
              ]}
            >
              {action.loading ? (
                <ActivityIndicator size="small" color={colors.teal} />
              ) : (
                <Ionicons name={action.icon} size={22} color={colors.teal} />
              )}
            </Pressable>
          );
        })}
      </View>
      {error ? <AppText style={styles.error}>{error}</AppText> : null}
    </View>
  );
}

/**
 * Builds field styles for the active palette.
 * @param colors - Active theme colors
 * @returns Field styles
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { gap: 8 },
    label: {
      color: colors.navy,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    inputRow: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      backgroundColor: colors.card,
      paddingLeft: 14,
      paddingRight: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    icon: { marginTop: 1 },
    input: {
      flex: 1,
      color: colors.navy,
      fontSize: 15,
      paddingVertical: 12,
      paddingRight: 4,
    },
    trailingBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    trailingBtnPressed: {
      backgroundColor: colors.cardSoft,
      opacity: 0.9,
    },
    trailingBtnDisabled: {
      opacity: 0.45,
    },
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
