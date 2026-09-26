import { patchWalletDocMedia } from "@/features/wallet/services/patchWalletDocMedia";
import { uploadUserMedia } from "@/features/common/media/uploadUserMedia";

/**
 * Uploads wallet media in the background and patches Firestore URLs.
 * Never throws to the caller — failures are logged and marked on the doc.
 * @param docId - Wallet Firestore document id
 * @param localUri - Local image URI selected on the form
 * @returns Promise that resolves when upload attempt finishes
 */
export async function uploadWalletMediaInBackground(
  docId: string,
  localUri: string
): Promise<void> {
  console.log("[uploadWalletMediaInBackground] start", { docId });

  try {
    const result = await uploadUserMedia({
      localUri,
      folder: `wallet/${docId}`,
    });

    await patchWalletDocMedia({
      id: docId,
      downloadURL: result.downloadURL,
      thumbURL: result.thumbURL,
      storagePath: result.storagePath,
      mediaStatus: "ready",
    });

    console.log("[uploadWalletMediaInBackground] ready", { docId });
  } catch (error) {
    console.error("[uploadWalletMediaInBackground] failed", {
      docId,
      error,
    });
    try {
      await patchWalletDocMedia({
        id: docId,
        downloadURL: "",
        thumbURL: "",
        storagePath: "",
        mediaStatus: "failed",
      });
    } catch (patchError) {
      console.error("[uploadWalletMediaInBackground] patch failed", patchError);
    }
  }
}
