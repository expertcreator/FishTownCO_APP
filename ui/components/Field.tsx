import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { colors } from "@/constants/theme";
import AppText from "./Text";

type FieldProps = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secureToggle?: boolean;
};

/**
 * Labeled text field, same role as Foori `AppTextInput` / `AppFormField`.
 * @param props - Field props
 * @param props.label - Uppercase field label
 * @param props.icon - Optional leading Ionicons name
 * @param props.secureToggle - Show eye toggle for passwords
 * @returns Field element
 */
export function Field({
  label,
  icon,
  secureToggle,
  secureTextEntry,
  style,
  ...rest
}: FieldProps) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View style={styles.wrap}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={styles.inputRow}>
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
    </View>
  );
}
