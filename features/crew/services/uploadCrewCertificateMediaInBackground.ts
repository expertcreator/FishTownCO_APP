import { uploadUserFile } from "@/features/common/media/uploadUserFile";
import { patchCrewCertificateMedia } from "@/features/crew/services/patchCrewCertificateMedia";

/**
 * Uploads a crew certificate image in the background and patches Firestore.
 * Never throws to the caller. Failures are marked on the certificate.
 * @param memberId - Crew Firestore document id
 * @param certificateId - Certificate id within the member doc
 * @param localUri - Local image or PDF URI selected on the form
 * @param file - Optional original name and MIME type
 * @returns Promise that resolves when the upload attempt finishes
 */
export async function uploadCrewCertificateMediaInBackground(
  memberId: string,
  certificateId: string,
  localUri: string,
  file?: { fileName?: string; mimeType?: string }
): Promise<void> {

  try {
    const result = await uploadUserFile({
      localUri,
      folder: `crew/${memberId}/certificates/${certificateId}`,
      fileName: file?.fileName,
      mimeType: file?.mimeType,
    });

    await patchCrewCertificateMedia({
      memberId,
      certificateId,
      downloadURL: result.downloadURL,
      thumbURL: result.thumbURL,
      storagePath: result.storagePath,
      mediaStatus: "ready",
    });

  } catch {

    try {
      await patchCrewCertificateMedia({
        memberId,
        certificateId,
        downloadURL: "",
        thumbURL: "",
        storagePath: "",
        mediaStatus: "failed",
      });
    } catch {

    }
  }
}
