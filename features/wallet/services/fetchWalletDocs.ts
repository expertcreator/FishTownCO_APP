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
import { mapWalletDoc } from "@/features/wallet/services/mapWalletDoc";
import type { WalletDoc } from "@/features/wallet/types/wallet";

/**
 * Loads all wallet documents for the signed-in user from Firestore.
 * Path: `users/{uid}/wallet`.
 * @returns Wallet documents with computed status
 * @throws {Error} When signed out or the Firestore read fails
 */
export async function fetchWalletDocs(): Promise<WalletDoc[]> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  console.log("[fetchWalletDocs] start", { uid: user.uid });

  try {
    const walletQuery = query(
      collection(firebaseFirestore, "users", user.uid, "wallet"),
      orderBy("expiryDateIso", "asc")
    );
    const snapshot = await getDocs(walletQuery);
    const docs = snapshot.docs.map(mapWalletDoc);
    console.log("[fetchWalletDocs] success", { count: docs.length });
    return docs;
  } catch (error) {
    console.warn("[fetchWalletDocs] orderBy failed, falling back", error);
    const snapshot = await getDocs(
      collection(firebaseFirestore, "users", user.uid, "wallet")
    );
    const docs = snapshot.docs
      .map(mapWalletDoc)
      .sort((a, b) => {
        const aTime = a.expiresIso
          ? Date.parse(a.expiresIso)
          : Number.POSITIVE_INFINITY;
        const bTime = b.expiresIso
          ? Date.parse(b.expiresIso)
          : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      });
    console.log("[fetchWalletDocs] fallback success", { count: docs.length });
    return docs;
  }
}
