export type PickedDocument = {
  uri: string;
  name: string;
  mimeType: string;
};

/**
 * Opens the system file picker for a PDF or image.
 * @returns The chosen file, or null when the user cancels
 * @throws {Error} When the document picker cannot open
 */
export async function pickDocument(): Promise<PickedDocument | null> {
  const DocumentPicker = await import("expo-document-picker");
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  const uri = asset.uri?.trim() ?? "";
  if (!uri) return null;

  return {
    uri,
    name: asset.name?.trim() || "document",
    mimeType: asset.mimeType?.trim() || "application/octet-stream",
  };
}
