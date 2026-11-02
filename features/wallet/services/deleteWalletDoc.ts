import { deleteDoc, doc } from "@react-native-firebase/firestore";
import { deleteUserFolder } from "@/features/auth/services/deleteUserStorage";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { WALLET_DOCS_QUERY_KEY } from "@/features/wallet/hooks/useWalletDocs";

/**
 * Deletes a wallet document at `users/{uid}/wallet/{id}`, then its uploaded
 * files under `users/{uid}/wallet/{id}/` in the background.
 * @param docId - Firestore document id
 * @returns Promise that resolves when the document is removed
 * @throws {Error} When the user is signed out or the delete fails
 */
export async function deleteWalletDoc(docId: string): Promise<void> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  await deleteDoc(doc(firebaseFirestore, "users", user.uid, "wallet", docId));
  // File cleanup never blocks or fails the delete; account deletion removes any leftovers.
  void deleteUserFolder(user.uid, `wallet/${docId}`).catch(() => {});
  await queryClient.invalidateQueries({ queryKey: WALLET_DOCS_QUERY_KEY });
  await queryClient.invalidateQueries({
    queryKey: ["wallet", "doc", docId],
  });
}
