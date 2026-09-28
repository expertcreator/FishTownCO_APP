import {
  doc,
  getDoc,
  type QueryDocumentSnapshot,
} from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
} from "@/features/common/firebase";
import { mapWalletDoc } from "@/features/wallet/services/mapWalletDoc";
import type { WalletDoc } from "@/features/wallet/types/wallet";

/**
 * Loads one wallet document by id for the signed-in user.
 * @param id - Wallet document id
 * @returns Mapped wallet document
 * @throws {Error} When signed out, missing, or the read fails
 */
export async function fetchWalletDoc(id: string): Promise<WalletDoc> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }
  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error("MISSING_ID");
  }

  const ref = doc(firebaseFirestore, "users", user.uid, "wallet", trimmed);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("NOT_FOUND");
  }

  const mapped = mapWalletDoc(snap as unknown as QueryDocumentSnapshot);

  return mapped;
}
