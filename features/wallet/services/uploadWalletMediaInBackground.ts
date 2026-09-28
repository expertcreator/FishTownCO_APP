import { uploadUserFile } from "@/features/common/media/uploadUserFile";
import { patchWalletDocMedia } from "@/features/wallet/services/patchWalletDocMedia";

/**
 * Uploads wallet media in the background and patches Firestore URLs.
 * Never throws to the caller. Failures are marked on the document.
 * @param docId - Wallet Firestore document id
 * @param localUri - Local image or PDF URI selected on the form
 * @param file - Optional original name and MIME type
 * @returns Promise that resolves when upload attempt finishes
 */
export async function uploadWalletMediaInBackground(
  docId: string,
  localUri: string,
  file?: { fileName?: string; mimeType?: string }
): Promise<void> {

  try {
    const result = await uploadUserFile({
      localUri,
      folder: `wallet/${docId}`,
      fileName: file?.fileName,
      mimeType: file?.mimeType,
    });

    await patchWalletDocMedia({
      id: docId,
      downloadURL: result.downloadURL,
      thumbURL: result.thumbURL,
      storagePath: result.storagePath,
      mediaStatus: "ready",
    });

  } catch {

    try {
      await patchWalletDocMedia({
        id: docId,
        downloadURL: "",
        thumbURL: "",
        storagePath: "",
        mediaStatus: "failed",
      });
    } catch {

    }
  }
}
