import { getDownloadURL, putFile, ref } from "@react-native-firebase/storage";
import { firebaseStorage, getCurrentUser } from "@/features/common/firebase";
import { uploadUserMedia } from "@/features/common/media/uploadUserMedia";

export type UploadUserFileInput = {
  localUri: string;
  folder: string;
  fileName?: string;
  mimeType?: string;
};

export type UploadUserFileResult = {
  downloadURL: string;
  thumbURL: string;
  storagePath: string;
  fileName: string;
};

/**
 * Returns true when the file should be stored as an image.
 * @param mimeType - MIME type from the picker
 * @param fileName - Original file name
 * @returns Whether image compression should run
 */
export function isImageUpload(mimeType?: string, fileName?: string): boolean {
  const mime = mimeType?.trim().toLowerCase() ?? "";
  if (mime.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|heic|gif)$/i.test(fileName ?? "");
}

/**
 * Normalizes a local file URI for React Native Firebase `putFile`.
 * @param uri - Local URI
 * @returns Path suitable for putFile
 */
function toPutFilePath(uri: string): string {
  if (uri.startsWith("file://")) return uri.replace("file://", "");
  return uri;
}

/**
 * Uploads a picked image or PDF under the signed-in user.
 * Images are compressed. Other files are stored as-is.
 * @param input - Local file and destination folder
 * @returns Download URL and storage path
 * @throws {Error} When signed out or the upload fails
 */
export async function uploadUserFile(
  input: UploadUserFileInput
): Promise<UploadUserFileResult> {
  const fileName = input.fileName?.trim() || "document";
  if (isImageUpload(input.mimeType, fileName)) {
    const image = await uploadUserMedia({
      localUri: input.localUri,
      folder: input.folder,
    });
    return {
      downloadURL: image.downloadURL,
      thumbURL: image.thumbURL,
      storagePath: image.storagePath,
      fileName,
    };
  }

  const user = getCurrentUser();
  if (!user?.uid) throw new Error("NOT_SIGNED_IN");

  const folder = input.folder.replace(/^\/+|\/+$/g, "");
  const safeName = fileName.replace(/[^\w.\-]+/g, "_") || "document.pdf";
  const storagePath = `users/${user.uid}/${folder}/${safeName}`;
  const fileRef = ref(firebaseStorage, storagePath);
  await putFile(fileRef, toPutFilePath(input.localUri), {
    contentType: input.mimeType?.trim() || "application/pdf",
  });
  const downloadURL = await getDownloadURL(fileRef);
  return {
    downloadURL,
    thumbURL: "",
    storagePath,
    fileName,
  };
}
