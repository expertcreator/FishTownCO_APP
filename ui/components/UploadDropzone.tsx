import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type UploadDropzoneVariant = "default" | "photo" | "document";

type UploadDropzoneProps = {
  title: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /**
   * `photo` = Add Crew / tall dashed teal tile.
   * `document` = compact certificate upload button.
   * `default` = generic dashed dropzone.
   */
  variant?: UploadDropzoneVariant;
  /** Optional local preview URI (photo / document image). */
  imageUri?: string | null;
  /** Clears the preview when provided. */
  onRemove?: () => void;
  /** Accessibility label for the remove control. */
  removeAccessibilityLabel?: string;
};

/**
 * Upload control matching prototype Add Crew / Add Document patterns.
 * Supports tall photo tiles, compact document buttons, and image previews.
 * @param props - Dropzone props
 * @param props.title - Primary prompt text
 * @param props.hint - Optional secondary hint (photo / default variants)
 * @param props.icon - Leading icon
 * @param props.onPress - Press handler
 * @param props.variant - Visual layout variant
 * @param props.imageUri - Optional preview image URI
 * @param props.onRemove - Optional remove-preview handler
 * @param props.removeAccessibilityLabel - A11y label for remove
 * @returns Upload dropzone element
 */
export function UploadDropzone({
  title,
  hint,
  icon,
  onPress,
  variant = "default",
  imageUri,
  onRemove,
  removeAccessibilityLabel = "Remove",
}: UploadDropzoneProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const resolvedIcon =
    icon ??
    (variant === "photo"
      ? "camera-outline"
      : variant === "document"
        ? "document-text-outline"
        : "cloud-upload-outline");

  if (variant === "document") {
    return (
      <View style={styles.documentWrap}>
        <Pressable
          onPress={onPress}
          android_ripple={{ color: "rgba(31,138,138,0.12)" }}
          style={({ pressed }) => [
            styles.documentBtn,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={title}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.documentThumb}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name={resolvedIcon} size={18} color={colors.teal} />
          )}
          <AppText style={styles.documentTitle} numberOfLines={1}>
            {title}
          </AppText>
        </Pressable>
        {imageUri && onRemove ? (
          <Pressable
            onPress={onRemove}
            hitSlop={8}
            style={({ pressed }) => [
              styles.documentRemove,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={removeAccessibilityLabel}
          >
            <AppText style={styles.documentRemoveText}>
              {removeAccessibilityLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (variant === "photo") {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={
          imageUri ? undefined : { color: "rgba(31,138,138,0.12)" }
        }
        style={({ pressed }) => [
          styles.photoBox,
          imageUri ? styles.photoPreviewBox : null,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {imageUri ? (
          <>
            <Image
              source={{ uri: imageUri }}
              style={styles.photoPreviewImage}
              resizeMode="cover"
            />
            {onRemove ? (
              <Pressable
                onPress={onRemove}
                hitSlop={8}
                style={styles.photoRemoveBtn}
                accessibilityRole="button"
                accessibilityLabel={removeAccessibilityLabel}
              >
                <Ionicons name="close" size={16} color={colors.white} />
              </Pressable>
            ) : null}
          </>
        ) : (
          <>
            <Ionicons name={resolvedIcon} size={32} color={colors.teal} />
            <AppText style={styles.photoTitle}>{title}</AppText>
            {hint ? <AppText style={styles.photoHint}>{hint}</AppText> : null}
          </>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(13,44,65,0.08)" }}
      style={({ pressed }) => [styles.box, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Ionicons name={resolvedIcon} size={28} color={colors.muted} />
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
    photoBox: {
      width: "100%",
      minHeight: 124,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: "rgba(31, 138, 138, 0.4)",
      borderRadius: 12,
      backgroundColor: colors.softTeal,
      paddingVertical: 24,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      overflow: "hidden",
    },
    photoPreviewBox: {
      paddingVertical: 0,
      paddingHorizontal: 0,
      borderStyle: "solid",
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    photoPreviewImage: {
      ...StyleSheet.absoluteFill,
      width: undefined,
      height: undefined,
    },
    photoRemoveBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2,
    },
    photoTitle: {
      color: colors.navy,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
    },
    photoHint: {
      color: colors.teal,
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
    },
    documentWrap: {
      gap: 8,
    },
    documentBtn: {
      minHeight: 45,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.card,
      paddingVertical: 10,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      overflow: "hidden",
    },
    documentThumb: {
      width: 22,
      height: 22,
      borderRadius: 4,
    },
    documentTitle: {
      flexShrink: 1,
      color: colors.navy,
      fontSize: 12,
      fontWeight: "700",
    },
    documentRemove: {
      alignSelf: "flex-start",
    },
    documentRemoveText: {
      color: colors.statusOverdueText,
      fontSize: 12,
      fontWeight: "700",
    },
    pressed: { opacity: 0.88 },
  });
}
