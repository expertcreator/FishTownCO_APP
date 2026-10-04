import { deleteDoc, doc } from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { SAFETY_ITEMS_QUERY_KEY } from "@/features/safety/hooks/useSafetyItems";

/**
 * Deletes a safety item at `users/{uid}/safety/{id}`.
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
  await queryClient.invalidateQueries({ queryKey: SAFETY_ITEMS_QUERY_KEY });
  await queryClient.invalidateQueries({
    queryKey: ["safety", "item", itemId],
  });
}
