import {
  doc,
  getDoc,
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

export type PatchCrewCertificateMediaInput = {
  memberId: string;
  certificateId: string;
  downloadURL: string;
  thumbURL: string;
  storagePath: string;
  mediaStatus: Extract<MediaStatus, "ready" | "failed">;
};

/**
 * Patches one crew certificate's media URLs after a background Storage upload.
 * @param input - Member id, certificate id, and media fields
 * @returns Updated document path
 * @throws {Error} When signed out, missing, or the Firestore update fails
 */
export async function patchCrewCertificateMedia(
  input: PatchCrewCertificateMediaInput
): Promise<{ path: string }> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const path = `users/${user.uid}/crew/${input.memberId}`;

  try {
    const ref = doc(
      firebaseFirestore,
      "users",
      user.uid,
      "crew",
      input.memberId
    );
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error("CREW_NOT_FOUND");
    }

    const data = snap.data() as Record<string, unknown>;
    const rawCerts = Array.isArray(data.certificates)
      ? [...(data.certificates as Record<string, unknown>[])]
      : [];
    const index = rawCerts.findIndex(
      (cert) => String(cert.id ?? "") === input.certificateId
    );
    if (index < 0) {
      throw new Error("CERTIFICATE_NOT_FOUND");
    }

    rawCerts[index] = {
      ...rawCerts[index],
      downloadURL: input.downloadURL || null,
      thumbURL: input.thumbURL || null,
      storagePath: input.storagePath || null,
      mediaStatus: input.mediaStatus,
      hasAttachment: input.mediaStatus === "ready",
      localUri:
        input.mediaStatus === "ready"
          ? null
          : (rawCerts[index]?.localUri ?? null),
    };

    await updateDoc(ref, {
      certificates: rawCerts,
      updatedAt: serverTimestamp(),
    });

    await queryClient.invalidateQueries({ queryKey: CREW_MEMBERS_QUERY_KEY });
    await queryClient.invalidateQueries({
      queryKey: ["crew", "member", input.memberId],
    });
    return { path };
  } catch (error) {

    throw error;
  }
}
