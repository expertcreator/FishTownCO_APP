import { deleteDoc, doc } from "@react-native-firebase/firestore";
import { deleteUserFolder } from "@/features/auth/services/deleteUserStorage";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { CREW_MEMBERS_QUERY_KEY } from "@/features/crew/hooks/useCrewMembers";

/**
 * Deletes a crew member at `users/{uid}/crew/{id}`, then their photo and
 * certificate files under `users/{uid}/crew/{id}/` in the background.
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
  // File cleanup never blocks or fails the delete; account deletion removes any leftovers.
  void deleteUserFolder(user.uid, `crew/${memberId}`).catch(() => {});
  await queryClient.invalidateQueries({ queryKey: CREW_MEMBERS_QUERY_KEY });
  await queryClient.invalidateQueries({
    queryKey: ["crew", "member", memberId],
  });
}
