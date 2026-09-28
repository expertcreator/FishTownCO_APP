import {
  addDoc,
  collection,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { SAFETY_ITEMS_QUERY_KEY } from "@/features/safety/hooks/useSafetyItems";

export type AddSafetyItemInput = {
  itemType: string;
  name: string;
  makeModel?: string;
  serial?: string;
  locationAboard: string;
  lastServiceDate?: string;
  nextDueDate: string;
  nextDueDateIso: string;
  expiryDate?: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Local item photo URI; uploaded in the background after create. */
  photoLocalUri?: string | null;
  /** Local certificate image URI; uploaded in the background after create. */
  certLocalUri?: string | null;
};

export type AddSafetyItemResult = {
  id: string;
  path: string;
};

/**
 * Creates a safety item under `users/{uid}/safety`.
 * @param input - Safety item fields matching the prototype form
 * @returns Created document id and console path
 * @throws {Error} When the user is signed out or Firestore write fails
 */
export async function addSafetyItem(
  input: AddSafetyItemInput
): Promise<AddSafetyItemResult> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const safetyCollection = collection(
    firebaseFirestore,
    "users",
    user.uid,
    "safety"
  );
  const consolePath = `users/${user.uid}/safety`;

  const hasPhoto = Boolean(input.photoLocalUri?.trim());
  const hasCert = Boolean(input.certLocalUri?.trim());

  try {
    const ref = await addDoc(safetyCollection, {
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
      photoLocalUri: input.photoLocalUri?.trim() || null,
      photoDownloadURL: null,
      photoThumbURL: null,
      photoStoragePath: null,
      photoMediaStatus: hasPhoto ? "pending" : "none",
      certLocalUri: input.certLocalUri?.trim() || null,
      certDownloadURL: null,
      certThumbURL: null,
      certStoragePath: null,
      certMediaStatus: hasCert ? "pending" : "none",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const fullPath = `${consolePath}/${ref.id}`;

    await queryClient.invalidateQueries({ queryKey: SAFETY_ITEMS_QUERY_KEY });

    return { id: ref.id, path: fullPath };
  } catch (error) {
    
    throw error;
  }
}
