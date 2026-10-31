import { deleteDoc, doc } from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { CREW_MEMBERS_QUERY_KEY } from "@/features/crew/hooks/useCrewMembers";

/**
 * Deletes a crew member at `users/{uid}/crew/{id}`.
 * @param memberId - Firestore crew document id
 * @returns Promise that resolves when the member is removed
 * @throws {Error} When the user is signed out or the delete fails
 */
export async function deleteCrewMember(memberId: string): Promise<void> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  await deleteDoc(doc(firebaseFirestore, "users", user.uid, "crew", memberId));
  await queryClient.invalidateQueries({ queryKey: CREW_MEMBERS_QUERY_KEY });
  await queryClient.invalidateQueries({
    queryKey: ["crew", "member", memberId],
  });
}
