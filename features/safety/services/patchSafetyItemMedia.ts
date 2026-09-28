import {
  doc,
  serverTimestamp,
  updateDoc,
} from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import type { MediaStatus } from "@/features/common/media/mediaStatus";
import { SAFETY_ITEMS_QUERY_KEY } from "@/features/safety/hooks/useSafetyItems";

export type SafetyMediaKind = "photo" | "certificate";

export type PatchSafetyItemMediaInput = {
  id: string;
  kind: SafetyMediaKind;
  downloadURL: string;
  thumbURL: string;
  storagePath: string;
  mediaStatus: Extract<MediaStatus, "ready" | "failed">;
};

/**
 * Builds Firestore field names for a safety media kind.
 * @param kind - Photo or certificate slot
 * @returns Field name map for that slot
 */
function mediaFields(kind: SafetyMediaKind) {
  if (kind === "certificate") {
    return {
      localUri: "certLocalUri",
      downloadURL: "certDownloadURL",
      thumbURL: "certThumbURL",
      storagePath: "certStoragePath",
      mediaStatus: "certMediaStatus",
    } as const;
  }
  return {
    localUri: "photoLocalUri",
    downloadURL: "photoDownloadURL",
    thumbURL: "photoThumbURL",
    storagePath: "photoStoragePath",
    mediaStatus: "photoMediaStatus",
  } as const;
}

/**
 * Patches safety photo or certificate URLs after a background Storage upload.
 * @param input - Item id, media kind, and URL fields
 * @returns Updated document path
 * @throws {Error} When signed out or the Firestore update fails
 */
export async function patchSafetyItemMedia(
  input: PatchSafetyItemMediaInput
): Promise<{ path: string }> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const path = `users/${user.uid}/safety/${input.id}`;
  const fields = mediaFields(input.kind);

  try {
    await updateDoc(
      doc(firebaseFirestore, "users", user.uid, "safety", input.id),
      {
        [fields.downloadURL]: input.downloadURL || null,
        [fields.thumbURL]: input.thumbURL || null,
        [fields.storagePath]: input.storagePath || null,
        [fields.mediaStatus]: input.mediaStatus,
        updatedAt: serverTimestamp(),
      }
    );

    await queryClient.invalidateQueries({ queryKey: SAFETY_ITEMS_QUERY_KEY });
    await queryClient.invalidateQueries({
      queryKey: ["safety", "item", input.id],
    });
    return { path };
  } catch (error) {

    throw error;
  }
}
