import {
  getDownloadURL,
  putFile,
  ref,
} from "@react-native-firebase/storage";
import { firebaseStorage, getCurrentUser } from "@/features/common/firebase";
import { compressImage } from "@/features/common/media/compressImage";

export type UploadUserMediaInput = {
  /** Local file URI (camera / gallery). */
  localUri: string;
  /** Storage path under the user, e.g. `wallet/{docId}`. */
  folder: string;
  /** Longest edge for the full image (default 1280). */
  maxEdge?: number;
  /** Longest edge for the thumb (default 512). */
  thumbEdge?: number;
};

export type UploadUserMediaResult = {
  downloadURL: string;
  thumbURL: string;
  storagePath: string;
  thumbPath: string;
};

/**
 * Normalizes a local file URI for React Native Firebase `putFile`.
 * @param uri - Local URI (often `file://...`)
 * @returns Path suitable for putFile
 */
function toPutFilePath(uri: string): string {
  if (uri.startsWith("file://")) {
    return uri.replace("file://", "");
  }
  return uri;
}

/**
 * Compresses a local image and uploads original + thumb to Firebase Storage.
 * Paths: `users/{uid}/{folder}/original.jpg` and `thumb.jpg`.
 * @param input - Local URI and folder under the user
 * @returns Download URLs and storage paths
 * @throws {Error} When signed out or upload fails
 */
export async function uploadUserMedia(
  input: UploadUserMediaInput
): Promise<UploadUserMediaResult> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const folder = input.folder.replace(/^\/+|\/+$/g, "");
  const basePath = `users/${user.uid}/${folder}`;
  const originalPath = `${basePath}/original.jpg`;
  const thumbPath = `${basePath}/thumb.jpg`;

  console.log("[uploadUserMedia] start", {
    basePath,
    localUri: input.localUri,
  });

  try {
    const fullUri = await compressImage(input.localUri, {
      maxEdge: input.maxEdge ?? 1280,
      quality: 0.7,
    });
    const thumbUri = await compressImage(input.localUri, {
      maxEdge: input.thumbEdge ?? 512,
      quality: 0.7,
    });

    const originalRef = ref(firebaseStorage, originalPath);
    const thumbRef = ref(firebaseStorage, thumbPath);
    const metadata = { contentType: "image/jpeg" as const };

    await putFile(originalRef, toPutFilePath(fullUri), metadata);
    await putFile(thumbRef, toPutFilePath(thumbUri), metadata);

    const downloadURL = await getDownloadURL(originalRef);
    const thumbURL = await getDownloadURL(thumbRef);

    console.log("[uploadUserMedia] success", {
      originalPath,
      thumbPath,
    });

    return {
      downloadURL,
      thumbURL,
      storagePath: originalPath,
      thumbPath,
    };
  } catch (error) {
    console.error("[uploadUserMedia] failed", {
      basePath,
      code: (error as { code?: string })?.code,
      message: (error as { message?: string })?.message,
      error,
    });
    throw error;
  }
}
