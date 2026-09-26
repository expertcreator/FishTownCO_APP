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
import { mapSafetyItemDoc } from "@/features/safety/services/mapSafetyItemDoc";
import type { SafetyItem } from "@/features/safety/types/safetyItem";

/**
 * Loads all safety items for the signed-in user from Firestore.
 * @returns Safety items with computed overdue / due-soon / ok status
 * @throws {Error} When signed out or the Firestore read fails
 */
export async function fetchSafetyItems(): Promise<SafetyItem[]> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  console.log("[fetchSafetyItems] start", { uid: user.uid });

  const safetyQuery = query(
    collection(firebaseFirestore, "users", user.uid, "safety"),
    orderBy("dueDateIso", "asc")
  );

  try {
    const snapshot = await getDocs(safetyQuery);
    const items = snapshot.docs.map(mapSafetyItemDoc);
    console.log("[fetchSafetyItems] success", { count: items.length });
    return items;
  } catch (error) {
    // Fallback when dueDateIso index / field is missing on older docs
    console.warn("[fetchSafetyItems] orderBy failed, falling back", error);
    const snapshot = await getDocs(
      collection(firebaseFirestore, "users", user.uid, "safety")
    );
    const items = snapshot.docs
      .map(mapSafetyItemDoc)
      .sort((a, b) => {
        const aTime = a.dueDateIso ? Date.parse(a.dueDateIso) : Number.POSITIVE_INFINITY;
        const bTime = b.dueDateIso ? Date.parse(b.dueDateIso) : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      });
    console.log("[fetchSafetyItems] fallback success", { count: items.length });
    return items;
  }
}
