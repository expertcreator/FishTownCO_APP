import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type FieldProps = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secureToggle?: boolean;
  error?: string;
};

/**
 * Labeled text field, same role as Foori `AppTextInput` / `AppFormField`.
 * @param props - Field props
 * @param props.label - Uppercase field label
 * @param props.icon - Optional leading Ionicons name
 * @param props.secureToggle - Show eye toggle for passwords
 * @param props.error - Validation message shown under the field
 * @returns Field element
 */
export function Field({
  label,
  icon,
  secureToggle,
  secureTextEntry,
  style,
  error,
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
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    icon: { marginTop: 1 },
    input: {
      flex: 1,
      color: colors.navy,
      fontSize: 15,
      paddingVertical: 12,
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

