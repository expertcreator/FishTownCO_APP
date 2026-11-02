import { deleteDoc, doc } from "@react-native-firebase/firestore";
import { deleteUserFolder } from "@/features/auth/services/deleteUserStorage";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { SAFETY_ITEMS_QUERY_KEY } from "@/features/safety/hooks/useSafetyItems";

/**
 * Deletes a safety item at `users/{uid}/safety/{id}`, then its photos under
 * `users/{uid}/safety/{id}/` in the background.
 * @param itemId - Firestore document id
 * @returns Promise that resolves when the item is removed
 * @throws {Error} When the user is signed out or the delete fails
 */
export async function deleteSafetyItem(itemId: string): Promise<void> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  await deleteDoc(
    doc(firebaseFirestore, "users", user.uid, "safety", itemId)
  );
  // File cleanup never blocks or fails the delete; account deletion removes any leftovers.
  void deleteUserFolder(user.uid, `safety/${itemId}`).catch(() => {});
  await queryClient.invalidateQueries({ queryKey: SAFETY_ITEMS_QUERY_KEY });
  await queryClient.invalidateQueries({
    queryKey: ["safety", "item", itemId],
  });
}
