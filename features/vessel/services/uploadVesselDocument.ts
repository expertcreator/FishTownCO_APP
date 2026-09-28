import { uploadUserFile } from "@/features/common/media/uploadUserFile";

/**
 * Uploads a vessel document (PDF or photo) to Storage.
 * @param localUri - Local file URI from the picker
 * @param fileName - Original file name
 * @param mimeType - MIME type from the picker
 * @returns Download URL, storage path, and file name
 * @throws {Error} When signed out or the upload fails
 */
export async function uploadVesselDocument(
  localUri: string,
  fileName?: string,
  mimeType?: string
) {
  return uploadUserFile({
    localUri,
    folder: "vessel/document",
    fileName,
    mimeType,
  });
}
