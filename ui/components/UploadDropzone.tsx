import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type UploadDropzoneProps = {
  title: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

/**
 * Dashed upload area used on Add Safety / Add Document style forms.
 * @param props - Dropzone props
 * @param props.title - Primary prompt text
 * @param props.hint - Optional secondary hint
 * @param props.icon - Leading icon
 * @param props.onPress - Press handler
 * @returns Upload dropzone element
 */
export function UploadDropzone({
  title,
  hint,
  icon = "cloud-upload-outline",
  onPress,
}: UploadDropzoneProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(13,44,65,0.08)" }}
      style={({ pressed }) => [styles.box, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Ionicons name={icon} size={28} color={colors.muted} />
      <AppText style={styles.title}>{title}</AppText>
      {hint ? <AppText style={styles.hint}>{hint}</AppText> : null}
    </Pressable>
  );
}

/**
 * Builds upload-dropzone styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    box: {
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.cardSoft,
      paddingVertical: 22,
      paddingHorizontal: 16,
      alignItems: "center",
      gap: 6,
      overflow: "hidden",
    },
    title: {
      color: colors.navy,
      fontSize: 14,
      fontWeight: "700",
    },
    hint: {
      color: colors.muted,
      fontSize: 12,
      textAlign: "center",
    },
    pressed: { opacity: 0.85 },
  });
}
