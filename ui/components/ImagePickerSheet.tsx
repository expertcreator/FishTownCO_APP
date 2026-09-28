import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pickImage } from "@/features/common/utils/imagePicker";
import { pickDocument } from "@/features/common/utils/pickDocument";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";
import { OutlineButton, TextLink } from "./Buttons";
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
            { paddingBottom: Math.max(insets.bottom, Platform.OS === "ios" ? 20 : 12) },
          ]}
        >
          <View style={styles.handle} />

          <Pressable
            onPress={handleGallerySelection}
            style={({ pressed }) => [
              styles.galleryButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t("imagePicker.choose-from-library")}
          >
            <LinearGradient
              colors={[colors.teal, colors.navy]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <AppText style={styles.galleryText}>
                {t("imagePicker.choose-from-library")}
              </AppText>
              <Ionicons name="cloud-upload-outline" size={22} color={colors.white} />
            </LinearGradient>
          </Pressable>

          <OutlineButton
            label={t("imagePicker.take-photo")}
            icon="camera-outline"
            onPress={handleCameraSelection}
            style={styles.cameraButton}
          />

          {allowDocuments ? (
            <OutlineButton
              label={t("imagePicker.choose-document")}
              icon="document-text-outline"
              onPress={handleDocumentSelection}
            />
          ) : null}

          <TextLink onPress={onClose} align="center">
            {t("common.cancel")}
          </TextLink>
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
      backgroundColor: colors.card,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 20,
      paddingTop: 10,
      gap: 12,
    },
    handle: {
      alignSelf: "center",
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 14,
    },
    galleryButton: {
      borderRadius: 14,
      overflow: "hidden",
      minHeight: 54,
    },
    gradient: {
      minHeight: 54,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    galleryText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: "700",
    },
    cameraButton: {
      borderColor: colors.orange,
    },
    pressed: { opacity: 0.9 },
  });
}
