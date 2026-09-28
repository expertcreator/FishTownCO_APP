import { uploadUserMedia } from "@/features/common/media/uploadUserMedia";
import { patchCrewMemberMedia } from "@/features/crew/services/patchCrewMemberMedia";

/**
 * Uploads a crew member photo in the background and patches Firestore URLs.
 * Never throws to the caller. Failures are marked on the document.
 * @param memberId - Crew Firestore document id
 * @param localUri - Local image URI selected on the form
 * @returns Promise that resolves when the upload attempt finishes
 */
export async function uploadCrewMediaInBackground(
  memberId: string,
  localUri: string
): Promise<void> {

  try {
    const result = await uploadUserMedia({
      localUri,
      folder: `crew/${memberId}`,
    });

    await patchCrewMemberMedia({
      id: memberId,
      downloadURL: result.downloadURL,
      thumbURL: result.thumbURL,
      storagePath: result.storagePath,
      mediaStatus: "ready",
    });

  } catch {

    try {
      await patchCrewMemberMedia({
        id: memberId,
        downloadURL: "",
        thumbURL: "",
        storagePath: "",
        mediaStatus: "failed",
      });
    } catch {

    }
  }
}
