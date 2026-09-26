import { uploadUserMedia } from "@/features/common/media/uploadUserMedia";
import { patchCrewMemberMedia } from "@/features/crew/services/patchCrewMemberMedia";

/**
 * Uploads a crew member photo in the background and patches Firestore URLs.
 * Never throws to the caller — failures are logged and marked on the doc.
 * @param memberId - Crew Firestore document id
 * @param localUri - Local image URI selected on the form
 * @returns Promise that resolves when the upload attempt finishes
 */
export async function uploadCrewMediaInBackground(
  memberId: string,
  localUri: string
): Promise<void> {
  console.log("[uploadCrewMediaInBackground] start", { memberId });

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

    console.log("[uploadCrewMediaInBackground] ready", { memberId });
  } catch (error) {
    console.error("[uploadCrewMediaInBackground] failed", {
      memberId,
      error,
    });
    try {
      await patchCrewMemberMedia({
        id: memberId,
        downloadURL: "",
        thumbURL: "",
        storagePath: "",
        mediaStatus: "failed",
      });
    } catch (patchError) {
      console.error("[uploadCrewMediaInBackground] patch failed", patchError);
    }
  }
}
