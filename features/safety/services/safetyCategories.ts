import {
  collection,
  doc,
  getDocs,
  setDoc,
} from "@react-native-firebase/firestore";
import { firebaseFirestore, getCurrentUser } from "@/features/common/firebase";
import { SAFETY_CATEGORY_SEED } from "@/features/safety/data/safetyCategorySeed";
import type { PickerOption } from "@/ui/components/OptionsPickerModal";

const COLLECTION = "safetyCategories";

/**
 * Upserts seed category documents into Firestore `safetyCategories`.
 * Requires a signed-in user and write permission on that collection.
 * @returns Number of docs upserted
 * @throws {Error} When Firestore write fails
 */
export async function upsertSafetyCategorySeed(): Promise<number> {
  const user = getCurrentUser();
  if (!user?.uid) {
    console.log("[upsertSafetyCategorySeed] skipped — not signed in");
    return 0;
  }

  console.log("[upsertSafetyCategorySeed] start");
  await Promise.all(
    SAFETY_CATEGORY_SEED.map((item) =>
      setDoc(
        doc(firebaseFirestore, COLLECTION, item.id),
        {
          name: item.label,
          label: item.label,
          order: item.order,
        },
        { merge: true }
      )
    )
  );
  console.log("[upsertSafetyCategorySeed] done", {
    count: SAFETY_CATEGORY_SEED.length,
  });
  return SAFETY_CATEGORY_SEED.length;
}

/**
 * Loads safety categories from Firestore only (no static UI fallback).
 * @returns Category picker options from `safetyCategories`
 * @throws {Error} When Firestore read fails
 */
export async function fetchSafetyCategories(): Promise<PickerOption[]> {
  console.log("[fetchSafetyCategories] start");
  const snapshot = await getDocs(collection(firebaseFirestore, COLLECTION));

  const options = snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() as {
        name?: string;
        label?: string;
        order?: number;
      };
      return {
        id: docSnap.id,
        label: (data.name ?? data.label ?? docSnap.id).trim(),
        order: typeof data.order === "number" ? data.order : 999,
      };
    })
    .filter((o) => o.label.length > 0)
    .sort((a, b) => a.order - b.order)
    .map(({ id, label }) => ({ id, label }));

  console.log("[fetchSafetyCategories] success", { count: options.length });
  return options;
}
