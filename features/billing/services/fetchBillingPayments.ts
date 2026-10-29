import { collection, getDocs } from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
} from "@/features/common/firebase";
import { mapBillingDoc } from "@/features/billing/services/mapBillingDoc";
import type { BillingRow } from "@/features/billing/types/billing";

/**
 * Loads billing payments for the signed-in user from Firestore.
 * Path: `users/{uid}/billing`.
 * @returns Billing rows newest-first
 * @throws {Error} When signed out or the Firestore read fails
 */
export async function fetchBillingPayments(): Promise<BillingRow[]> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const snapshot = await getDocs(
    collection(firebaseFirestore, "users", user.uid, "billing")
  );
  return snapshot.docs
    .map(mapBillingDoc)
    .sort((a, b) => Date.parse(b.dateIso) - Date.parse(a.dateIso));
}
