import {
  collection,
  getDocs,
  orderBy,
  query,
} from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
} from "@/features/common/firebase";
import { mapCrewMemberDoc } from "@/features/crew/services/mapCrewMemberDoc";
import type { CrewMember } from "@/features/crew/types/crew";

/**
 * Loads all crew members for the signed-in user from Firestore.
 * Path: `users/{uid}/crew`.
 * @returns Crew members with computed overdue / due-soon / ok status
 * @throws {Error} When signed out or the Firestore read fails
 */
export async function fetchCrewMembers(): Promise<CrewMember[]> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  try {
    const crewQuery = query(
      collection(firebaseFirestore, "users", user.uid, "crew"),
      orderBy("primaryExpiryIso", "asc")
    );
    const snapshot = await getDocs(crewQuery);
    const members = snapshot.docs.map(mapCrewMemberDoc);
    
    return members;
  } catch {
    
    const snapshot = await getDocs(
      collection(firebaseFirestore, "users", user.uid, "crew")
    );
    const members = snapshot.docs
      .map(mapCrewMemberDoc)
      .sort((a, b) => {
        const aTime = a.certificates[0]?.expiresIso
          ? Date.parse(a.certificates[0].expiresIso)
          : Number.POSITIVE_INFINITY;
        const bTime = b.certificates[0]?.expiresIso
          ? Date.parse(b.certificates[0].expiresIso)
          : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      });
    
    return members;
  }
}
