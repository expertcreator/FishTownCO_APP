import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { colors } from "@/constants/theme";

type FieldProps = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secureToggle?: boolean;
};

/**
 * Labeled text field matching Fishtownco auth/setup forms.
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
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        {icon ? (
          <Ionicons name={icon} size={18} color={colors.muted} style={styles.icon} />
        ) : null}
        <TextInput
          {...rest}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          placeholderTextColor="#9AA7B5"
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

const styles = StyleSheet.create({
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
    backgroundColor: colors.white,
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
});
