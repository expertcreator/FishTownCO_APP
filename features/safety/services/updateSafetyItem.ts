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
import { SAFETY_ITEMS_QUERY_KEY } from "@/features/safety/hooks/useSafetyItems";
import type { AddSafetyItemInput } from "@/features/safety/services/addSafetyItem";

export type UpdateSafetyItemInput = AddSafetyItemInput & {
  id: string;
  /** Clears photo media when the user removed the photo. */
  clearPhoto?: boolean;
  /** Clears certificate media when the user removed the certificate image. */
  clearCertificate?: boolean;
};

/**
 * Updates an existing safety item under `users/{uid}/safety/{id}`.
 * @param input - Item id plus form fields matching the prototype edit screen
 * @returns Updated document id and console path
 * @throws {Error} When signed out or the Firestore update fails
 */
export async function updateSafetyItem(
  input: UpdateSafetyItemInput
): Promise<{ id: string; path: string }> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const path = `users/${user.uid}/safety/${input.id}`;
  console.log("[updateSafetyItem] start", {
    path,
    name: input.name,
    itemType: input.itemType,
  });

  const hasPhoto = Boolean(input.photoLocalUri?.trim());
  const hasCert = Boolean(input.certLocalUri?.trim());
  const mediaPatch = {
    ...(input.clearPhoto
      ? {
          photoLocalUri: null,
          photoDownloadURL: null,
          photoThumbURL: null,
          photoStoragePath: null,
          photoMediaStatus: "none" as const,
        }
      : hasPhoto
        ? {
            photoLocalUri: input.photoLocalUri?.trim() || null,
            photoMediaStatus: "pending" as const,
          }
        : {}),
    ...(input.clearCertificate
      ? {
          certLocalUri: null,
          certDownloadURL: null,
          certThumbURL: null,
          certStoragePath: null,
          certMediaStatus: "none" as const,
        }
      : hasCert
        ? {
            certLocalUri: input.certLocalUri?.trim() || null,
            certMediaStatus: "pending" as const,
          }
        : {}),
  };

  try {
    await updateDoc(doc(firebaseFirestore, "users", user.uid, "safety", input.id), {
      itemType: input.itemType.trim(),
      category: input.itemType.trim(),
      name: input.name.trim(),
      makeModel: input.makeModel?.trim() || null,
      serial: input.serial?.trim() || null,
      locationAboard: input.locationAboard.trim(),
      location: input.locationAboard.trim(),
      lastServiceDate: input.lastServiceDate?.trim() || null,
      nextDueDate: input.nextDueDate.trim(),
      dueDate: input.nextDueDate.trim(),
      dueDateIso: input.nextDueDateIso,
      expiryDate: input.expiryDate?.trim() || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      ...mediaPatch,
      updatedAt: serverTimestamp(),
    });

    console.log("[updateSafetyItem] success", { path });
    await queryClient.invalidateQueries({ queryKey: SAFETY_ITEMS_QUERY_KEY });
    await queryClient.invalidateQueries({
      queryKey: ["safety", "item", input.id],
    });

    return { id: input.id, path };
  } catch (error) {
    console.error("[updateSafetyItem] failed", {
      path,
      code: (error as { code?: string })?.code,
      message: (error as { message?: string })?.message,
      error,
    });
    throw error;
  }
}
