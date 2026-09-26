import { doc, getDoc } from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
} from "@/features/common/firebase";
import { mapCrewMemberDoc } from "@/features/crew/services/mapCrewMemberDoc";
import type { CrewMember } from "@/features/crew/types/crew";

/**
 * Loads one crew member by id for the signed-in user.
 * @param id - Firestore document id under `users/{uid}/crew`
 * @returns Crew member, or null when missing
 * @throws {Error} When signed out or the Firestore read fails
 */
export async function fetchCrewMember(
  id: string
): Promise<CrewMember | null> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const snap = await getDoc(
    doc(firebaseFirestore, "users", user.uid, "crew", id)
  );
  if (!snap.exists()) {
    return null;
  }

  return mapCrewMemberDoc(snap);
}
