import { pickImage } from "@/shared/utils/imagePicker";
import { useTranslation } from "@/shared/translations";
import { useAlert } from "@/shared/components/alert";
import { useEffect, useRef, type FC } from "react";

export type ImagePickerSheetProps = {
  isVisible: boolean;
  onClose: () => void;
  onImageSelected: (imagePath: string) => void;
  enableCropping?: boolean;
  width?: number;
  height?: number;
};

type PickerSource = "gallery" | "camera";

const ImagePickerSheet: FC<ImagePickerSheetProps> = ({
  isVisible,
  onClose,
  onImageSelected,
  enableCropping = false,
  width = 400,
  height = 400,
}) => {
  const { t } = useTranslation();
  const { showAlert, clearAlert } = useAlert();
  const wasVisibleRef = useRef(false);
  const callbacksRef = useRef({ onClose, onImageSelected, t });
  callbacksRef.current = { onClose, onImageSelected, t };

  useEffect(() => {
    if (!isVisible) {
      if (wasVisibleRef.current) {
        clearAlert();
      }
      wasVisibleRef.current = false;
      return;
    }

    const justOpened = isVisible && !wasVisibleRef.current;
    wasVisibleRef.current = isVisible;

    if (!justOpened) {
      return;
    }

    const snapshot = {
      enableCropping,
      width,
      height,
    };

    const launchPicker = async (from: PickerSource) => {
      const {
        onImageSelected: onSelected,
        onClose: close,
        t: translate,
      } = callbacksRef.current;

      try {
        const results = await pickImage({
          from,
          cropping: snapshot.enableCropping,
          width: snapshot.width,
          height: snapshot.height,
        });

        if (results.length > 0) {
          onSelected(results[0]);
          return;
        }

        close();
      } catch {
        showAlert({
          title: translate("imagePicker.error-title", "Error"),
          message:
            from === "gallery"
              ? translate(
                  "imagePicker.gallery-error",
                  "Failed to select image from gallery. Please try again."
                )
              : translate(
                  "imagePicker.camera-error",
                  "Failed to take photo. Please check camera permissions."
                ),
          type: "error",
          buttons: [{ text: translate("ok", "OK"), onPress: close }],
        });
      }
    };

    const showOptions = () => {
      const { onClose: close, t: translate } = callbacksRef.current;

      showAlert({
        title: translate("imagePicker.add-photo", "Add photo"),
        type: "info",
        hideIcon: true,
        vibrate: false,
        autoCloseMs: 0,
        onDismiss: close,
        buttons: [
          {
            text: translate(
              "imagePicker.choose-from-library",
              "Choose from library"
            ),
            onPress: () => {
              launchPicker("gallery").catch(() => {});
            },
          },
          {
            text: translate("imagePicker.take-photo", "Take a Photo"),
            onPress: () => {
              launchPicker("camera").catch(() => {});
            },
          },
          {
            text: translate("common.cancel", "Cancel"),
            style: "cancel",
          },
        ],
      });
    };

    showOptions();
  }, [clearAlert, enableCropping, height, isVisible, showAlert, width]);

  return null;
};

export default ImagePickerSheet;
