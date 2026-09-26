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
import { CREW_MEMBERS_QUERY_KEY } from "@/features/crew/hooks/useCrewMembers";

export type PatchCrewMemberMediaInput = {
  id: string;
  downloadURL: string;
  thumbURL: string;
  storagePath: string;
  mediaStatus: Extract<MediaStatus, "ready" | "failed">;
};

/**
 * Patches crew photo URLs after a background Storage upload.
 * @param input - Member id and media fields
 * @returns Updated document path
 * @throws {Error} When signed out or the Firestore update fails
 */
export async function patchCrewMemberMedia(
  input: PatchCrewMemberMediaInput
): Promise<{ path: string }> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const path = `users/${user.uid}/crew/${input.id}`;
  console.log("[patchCrewMemberMedia] start", {
    path,
    mediaStatus: input.mediaStatus,
  });

  try {
    await updateDoc(
      doc(firebaseFirestore, "users", user.uid, "crew", input.id),
      {
        downloadURL: input.downloadURL || null,
        thumbURL: input.thumbURL || null,
        storagePath: input.storagePath || null,
        mediaStatus: input.mediaStatus,
        updatedAt: serverTimestamp(),
      }
    );

    console.log("[patchCrewMemberMedia] success", { path });
    await queryClient.invalidateQueries({ queryKey: CREW_MEMBERS_QUERY_KEY });
    await queryClient.invalidateQueries({
      queryKey: ["crew", "member", input.id],
    });
    return { path };
  } catch (error) {
    console.error("[patchCrewMemberMedia] failed", {
      path,
      code: (error as { code?: string })?.code,
      message: (error as { message?: string })?.message,
      error,
    });
    throw error;
  }
}
