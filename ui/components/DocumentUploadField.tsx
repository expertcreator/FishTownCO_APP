import { useState } from "react";
import { isImageUpload } from "@/features/common/media/uploadUserFile";
import { ImagePickerSheet } from "./ImagePickerSheet";
import { UploadDropzone } from "./UploadDropzone";

export type DocumentUploadValue = {
  uri: string;
  name: string;
  mimeType: string;
};

type DocumentUploadFieldProps = {
  /** Selected file URI. Empty when nothing is chosen. */
  uri: string | null;
  /** Original file name shown beside a document icon. */
  fileName?: string;
  /** MIME type used to decide image preview vs document icon. */
  mimeType?: string;
  /** Label shown before a file is chosen. */
  emptyLabel: string;
  /** Label used when a file has no name. */
  filledLabel: string;
  /** Secondary line under the title on the card layout. */
  hint?: string;
  /**
   * `card` matches the tall Add photo tile.
   * `row` is the compact document button.
   */
  layout?: "row" | "card";
  /** Accessibility label for the close control. */
  removeAccessibilityLabel: string;
  /**
   * Called with the picked file, or null when it is cleared.
   * @param file - Selected file, or null
   */
  onChange: (file: DocumentUploadValue | null) => void;
};

/**
 * PDF or image upload field used by crew, safety, vessel, and wallet.
 * `card` uses the same tall tile as Add photo. `row` stays a compact button.
 * A photo shows the image with a close button. A document shows an icon and name.
 * @param props - Field props
 * @returns Document upload field
 */
export function DocumentUploadField({
  uri,
  fileName = "",
  mimeType = "",
  emptyLabel,
  filledLabel,
  hint,
  layout = "row",
  removeAccessibilityLabel,
  onChange,
}: DocumentUploadFieldProps) {
  const [open, setOpen] = useState(false);
  const hasFile = Boolean(uri?.trim());
  const showImage = hasFile && isImageUpload(mimeType, fileName);
  const title = hasFile ? fileName.trim() || filledLabel : emptyLabel;

  return (
    <>
      <UploadDropzone
        variant={layout === "card" ? "photo" : "document"}
        title={title}
        hint={layout === "card" && !hasFile ? hint : undefined}
        icon="document-text-outline"
        imageUri={showImage ? uri : null}
        onPress={() => setOpen(true)}
        onRemove={
          hasFile
            ? () => {
                onChange(null);
              }
            : undefined
        }
        removeAccessibilityLabel={removeAccessibilityLabel}
      />
      <ImagePickerSheet
        visible={open}
        allowDocuments
        onClose={() => setOpen(false)}
        onImageSelected={(nextUri, file) => {
          onChange({
            uri: nextUri,
            name:
              file?.name?.trim() ||
              nextUri.split("/").pop()?.split("?")[0] ||
              filledLabel,
            mimeType: file?.mimeType ?? "",
          });
          setOpen(false);
        }}
      />
    </>
  );
}
