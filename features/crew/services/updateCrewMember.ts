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
import type { AddCrewMemberInput } from "@/features/crew/services/addCrewMember";
import { CREW_MEMBERS_QUERY_KEY } from "@/features/crew/hooks/useCrewMembers";

export type UpdateCrewMemberInput = AddCrewMemberInput & {
  id: string;
  /**
   * When true, clears photo media fields (user removed the photo).
   * When false/undefined and `localUri` is set, marks media pending for upload.
   */
  clearPhoto?: boolean;
};

/**
 * Updates an existing crew member under `users/{uid}/crew/{id}`.
 * @param input - Member id plus form fields
 * @returns Updated document id and console path
 * @throws {Error} When signed out or the Firestore update fails
 */
export async function updateCrewMember(
  input: UpdateCrewMemberInput
): Promise<{ id: string; path: string }> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const path = `users/${user.uid}/crew/${input.id}`;
  console.log("[updateCrewMember] start", {
    path,
    name: input.name,
  });

  const certificates = input.certificates.map((cert, index) => {
    const hasLocal = Boolean(cert.localUri?.trim());
    const hasRemote = Boolean(cert.downloadURL?.trim());
    return {
      id: cert.id?.trim() || `cert-${Date.now()}-${index}`,
      type: cert.type.trim(),
      title: (cert.title?.trim() || cert.type).trim(),
      issueDate: cert.issueDate?.trim() || null,
      expiryDate: cert.expiryDate.trim(),
      expiryDateIso: cert.expiryDateIso,
      hasAttachment: Boolean(cert.hasAttachment || hasLocal || hasRemote),
      localUri: cert.localUri?.trim() || null,
      downloadURL: cert.downloadURL?.trim() || null,
      thumbURL: cert.thumbURL?.trim() || null,
      storagePath: cert.storagePath?.trim() || null,
      mediaStatus:
        cert.mediaStatus ??
        (hasLocal ? "pending" : hasRemote ? "ready" : "none"),
    };
  });

  const primaryExpiryIso =
    certificates
      .map((c) => c.expiryDateIso)
      .filter(Boolean)
      .sort()[0] ?? null;

  const hasLocal = Boolean(input.localUri?.trim());
  const mediaPatch = input.clearPhoto
    ? {
        localUri: null,
        downloadURL: null,
        thumbURL: null,
        storagePath: null,
        mediaStatus: "none" as const,
      }
    : hasLocal
      ? {
          localUri: input.localUri?.trim() || null,
          mediaStatus: "pending" as const,
        }
      : {};

  try {
    await updateDoc(doc(firebaseFirestore, "users", user.uid, "crew", input.id), {
      name: input.name.trim(),
      role: input.role.trim(),
      phone: input.phone.trim(),
      email: input.email.trim().toLowerCase(),
      certificates,
      primaryExpiryIso,
      ...mediaPatch,
      updatedAt: serverTimestamp(),
    });

    console.log("[updateCrewMember] success", { path });
    await queryClient.invalidateQueries({ queryKey: CREW_MEMBERS_QUERY_KEY });
    await queryClient.invalidateQueries({
      queryKey: ["crew", "member", input.id],
    });

    return { id: input.id, path };
  } catch (error) {
    console.error("[updateCrewMember] failed", {
      path,
      code: (error as { code?: string })?.code,
      message: (error as { message?: string })?.message,
      error,
    });
    throw error;
  }
}
