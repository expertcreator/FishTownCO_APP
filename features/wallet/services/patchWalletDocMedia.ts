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
import { WALLET_DOCS_QUERY_KEY } from "@/features/wallet/hooks/useWalletDocs";

export type PatchWalletMediaInput = {
  id: string;
  downloadURL: string;
  thumbURL: string;
  storagePath: string;
  mediaStatus: "ready" | "failed";
};

/**
 * Patches wallet media URLs after a background Storage upload.
 * @param input - Document id and media fields
 * @returns Updated document path
 * @throws {Error} When signed out or the Firestore update fails
 */
export async function patchWalletDocMedia(
  input: PatchWalletMediaInput
): Promise<{ path: string }> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const path = `users/${user.uid}/wallet/${input.id}`;
  console.log("[patchWalletDocMedia] start", {
    path,
    mediaStatus: input.mediaStatus,
  });

  try {
    await updateDoc(
      doc(firebaseFirestore, "users", user.uid, "wallet", input.id),
      {
        downloadURL: input.downloadURL || null,
        thumbURL: input.thumbURL || null,
        storagePath: input.storagePath || null,
        mediaStatus: input.mediaStatus,
        updatedAt: serverTimestamp(),
      }
    );

    console.log("[patchWalletDocMedia] success", { path });
    await queryClient.invalidateQueries({ queryKey: WALLET_DOCS_QUERY_KEY });
    return { path };
  } catch (error) {
    console.error("[patchWalletDocMedia] failed", {
      path,
      code: (error as { code?: string })?.code,
      message: (error as { message?: string })?.message,
      error,
    });
    throw error;
  }
}
