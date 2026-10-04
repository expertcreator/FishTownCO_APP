import { uploadUserMedia } from "@/features/common/media/uploadUserMedia";

/**
 * Uploads a vessel hero photo to Storage.
 * @param localUri - Local image URI from the camera or gallery
 * @returns Full and thumb download URLs
 * @throws {Error} When signed out or the upload fails
 */
export async function uploadVesselPhoto(localUri: string) {
  return uploadUserMedia({
    localUri,
    folder: "vessel/photo",
  });
}
