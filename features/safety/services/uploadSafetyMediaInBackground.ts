import { uploadUserFile } from "@/features/common/media/uploadUserFile";
import { uploadUserMedia } from "@/features/common/media/uploadUserMedia";
import {
  patchSafetyItemMedia,
  type SafetyMediaKind,
} from "@/features/safety/services/patchSafetyItemMedia";

/**
 * Uploads a safety photo or certificate in the background and patches Firestore.
 * Never throws to the caller. Failures are marked on the document.
 * @param itemId - Safety Firestore document id
 * @param kind - Photo or certificate slot
 * @param localUri - Local image or PDF URI selected on the form
 * @param file - Optional original name and MIME type for a certificate
 * @returns Promise that resolves when the upload attempt finishes
 */
export async function uploadSafetyMediaInBackground(
  itemId: string,
  kind: SafetyMediaKind,
  localUri: string,
  file?: { fileName?: string; mimeType?: string }
): Promise<void> {

  try {
    const result =
      kind === "certificate"
        ? await uploadUserFile({
            localUri,
            folder: `safety/${itemId}/${kind}`,
            fileName: file?.fileName,
            mimeType: file?.mimeType,
          })
        : await uploadUserMedia({
            localUri,
            folder: `safety/${itemId}/${kind}`,
          });

    await patchSafetyItemMedia({
      id: itemId,
      kind,
      downloadURL: result.downloadURL,
      thumbURL: result.thumbURL,
      storagePath: result.storagePath,
      mediaStatus: "ready",
    });

  } catch {

    try {
      await patchSafetyItemMedia({
        id: itemId,
        kind,
        downloadURL: "",
        thumbURL: "",
        storagePath: "",
        mediaStatus: "failed",
      });
    } catch {

    }
  }
}
