import { deleteDoc, doc } from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { WALLET_DOCS_QUERY_KEY } from "@/features/wallet/hooks/useWalletDocs";

/**
 * Deletes a wallet document at `users/{uid}/wallet/{id}`.
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
  await queryClient.invalidateQueries({ queryKey: WALLET_DOCS_QUERY_KEY });
  await queryClient.invalidateQueries({
    queryKey: ["wallet", "doc", docId],
  });
}
