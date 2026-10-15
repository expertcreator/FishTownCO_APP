import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pickImage } from "@/features/common/utils/imagePicker";
import { pickDocument } from "@/features/common/utils/pickDocument";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";
import AppText from "./Text";

export type ImagePickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (
    imageUri: string,
    file?: { name?: string; mimeType?: string }
  ) => void;
  enableCropping?: boolean;
  width?: number;
  height?: number;
  /** Adds a PDF / file choice beside the photo options. */
  allowDocuments?: boolean;
};

/**
 * Camera / gallery bottom sheet matching the customer-app ImagePickerSheet flow.
 * @param props - Sheet props
 * @param props.visible - Whether the sheet is shown
 * @param props.onClose - Dismiss handler
 * @param props.onImageSelected - Called with the local image URI
 * @param props.enableCropping - Whether the system crop UI is enabled
 * @param props.width - Crop aspect width
 * @param props.height - Crop aspect height
 * @returns Image picker sheet modal
 */
export function ImagePickerSheet({
  visible,
  onClose,
  onImageSelected,
  enableCropping = false,
  width = 400,
  height = 400,
  allowDocuments = false,
}: ImagePickerSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  const isProcessingRef = useRef(false);
  const [pickerBusy, setPickerBusy] = useState(false);

  /**
   * Hides this sheet, then opens a system picker.
   * The parent selection target stays set until the picker returns.
   * @param pick - System picker
   * @param errorMessage - Alert body when the picker fails
   * @returns Promise that resolves when selection finishes
   */
  const runPicker = async (
    pick: () => Promise<void>,
    errorMessage: string
  ) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setPickerBusy(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 450));
      await pick();
    } catch {
      Alert.alert(t("imagePicker.error-title"), errorMessage);
    } finally {
      isProcessingRef.current = false;
      setPickerBusy(false);
      onClose();
    }
  };

  /**
   * Opens the gallery picker after hiding the sheet.
   * @returns Promise that resolves when selection finishes
   */
  const handleGallerySelection = () =>
    runPicker(async () => {
      const results = await pickImage({
        from: "gallery",
        cropping: enableCropping,
        width,
        height,
      });
      const imageUri = results[0];
      if (typeof imageUri === "string" && imageUri.trim().length > 0) {
        onImageSelected(imageUri, { mimeType: "image/jpeg" });
      }
    }, t("imagePicker.gallery-error"));

  /**
   * Opens the camera after hiding the sheet.
   * @returns Promise that resolves when capture finishes
   */
  const handleCameraSelection = () =>
    runPicker(async () => {
      const results = await pickImage({
        from: "camera",
        cropping: enableCropping,
        width,
        height,
      });
      const imageUri = results[0];
      if (typeof imageUri === "string" && imageUri.trim().length > 0) {
        onImageSelected(imageUri, { mimeType: "image/jpeg" });
      }
    }, t("imagePicker.camera-error"));

  /**
   * Opens the system document picker for a PDF or image.
   * @returns Promise that resolves when selection finishes
   */
  const handleDocumentSelection = () =>
    runPicker(async () => {
      const file = await pickDocument();
      if (file) {
        onImageSelected(file.uri, {
          name: file.name,
          mimeType: file.mimeType,
        });
      }
    }, t("imagePicker.document-error"));

  return (
    <Modal
      visible={visible && !pickerBusy}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText style={styles.title}>
              {allowDocuments
                ? t("imagePicker.title-file")
                : t("imagePicker.title")}
            </AppText>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={22} color={colors.navy} />
            </Pressable>
          </View>

          <View style={styles.options}>
            <Pressable
              onPress={handleGallerySelection}
              style={({ pressed }) => [
                styles.option,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("imagePicker.choose-from-library")}
            >
              <View style={[styles.iconWrap, styles.iconLibrary]}>
                <Ionicons name="images-outline" size={22} color={colors.teal} />
              </View>
              <AppText style={styles.optionLabel}>
                {t("imagePicker.choose-from-library")}
              </AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>

            <Pressable
              onPress={handleCameraSelection}
              style={({ pressed }) => [
                styles.option,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("imagePicker.take-photo")}
            >
              <View style={[styles.iconWrap, styles.iconCamera]}>
                <Ionicons name="camera-outline" size={22} color={colors.orange} />
              </View>
              <AppText style={styles.optionLabel}>
                {t("imagePicker.take-photo")}
              </AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>

            {allowDocuments ? (
              <Pressable
                onPress={handleDocumentSelection}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("imagePicker.choose-document")}
              >
                <View style={[styles.iconWrap, styles.iconDocument]}>
                  <Ionicons
                    name="document-text-outline"
                    size={22}
                    color={colors.navy}
                  />
                </View>
                <AppText style={styles.optionLabel}>
                  {t("imagePicker.choose-document")}
                </AppText>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Builds image-picker sheet styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(13,44,65,0.45)",
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
      paddingBottom: 14,
      gap: 12,
    },
    title: {
      flex: 1,
      color: colors.navy,
      fontSize: 18,
      fontWeight: "800",
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    options: {
      gap: 10,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 64,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    iconLibrary: {
      backgroundColor: colors.softTeal,
    },
    iconCamera: {
      backgroundColor: colors.softOrange,
    },
    iconDocument: {
      backgroundColor: colors.cardSoft,
    },
    optionLabel: {
      flex: 1,
      color: colors.navy,
      fontSize: 16,
      fontWeight: "700",
    },
    pressed: { opacity: 0.9 },
  });
}
