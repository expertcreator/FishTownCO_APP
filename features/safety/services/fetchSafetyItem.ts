import { doc, getDoc } from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
} from "@/features/common/firebase";
import { mapSafetyItemDoc } from "@/features/safety/services/mapSafetyItemDoc";
import type { SafetyItem } from "@/features/safety/types/safetyItem";

/**
 * Loads one safety item by id for the signed-in user.
 * @param id - Firestore document id under `users/{uid}/safety`
 * @returns Safety item, or null when missing
 * @throws {Error} When signed out or the Firestore read fails
 */
export async function fetchSafetyItem(
  id: string
): Promise<SafetyItem | null> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const snap = await getDoc(
    doc(firebaseFirestore, "users", user.uid, "safety", id)
  );
  if (!snap.exists()) {
    return null;
  }

  return mapSafetyItemDoc(snap);
}
