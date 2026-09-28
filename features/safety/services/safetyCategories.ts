import { Ionicons } from "@expo/vector-icons";
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

/** Shown when a category has no saved icon, or the name is not a real icon. */
export const DEFAULT_SAFETY_CATEGORY_ICON = "shield-checkmark-outline";

export type SafetyCategory = PickerOption & {
  icon: string;
};

/**
 * Returns a saved category icon when it is a real Ionicons name.
 * @param icon - Value stored on the category document
 * @returns Glyph name safe to pass to `Ionicons`
 */
export function toSafetyCategoryIcon(
  icon: string | null | undefined
): keyof typeof Ionicons.glyphMap {
  const name = icon?.trim() ?? "";
  if (name && name in Ionicons.glyphMap) {
    return name as keyof typeof Ionicons.glyphMap;
  }
  return DEFAULT_SAFETY_CATEGORY_ICON;
}

/**
 * Finds the icon saved on the matching safety category.
 * @param categoryLabel - Category label stored on the safety item
 * @param categories - Categories loaded from Firestore
 * @returns Saved icon, or the default shield
 */
export function resolveSafetyCategoryIcon(
  categoryLabel: string,
  categories: SafetyCategory[]
): keyof typeof Ionicons.glyphMap {
  const value = categoryLabel.trim().toLowerCase();
  const match = categories.find(
    (category) => category.label.trim().toLowerCase() === value
  );
  return toSafetyCategoryIcon(match?.icon);
}

/**
 * Upserts seed category documents into Firestore `safetyCategories`.
 * Requires a signed-in user and write permission on that collection.
 * @returns Number of docs upserted
 * @throws {Error} When Firestore write fails
 */
export async function upsertSafetyCategorySeed(): Promise<number> {
  const user = getCurrentUser();
  if (!user?.uid) {
    
    return 0;
  }

  await Promise.all(
    SAFETY_CATEGORY_SEED.map((item) =>
      setDoc(
        doc(firebaseFirestore, COLLECTION, item.id),
        {
          name: item.label,
          label: item.label,
          order: item.order,
          icon: item.icon,
        },
        { merge: true }
      )
    )
  );
  
  return SAFETY_CATEGORY_SEED.length;
}

/**
 * Loads safety categories from Firestore only (no static UI fallback).
 * @returns Category picker options from `safetyCategories`
 * @throws {Error} When Firestore read fails
 */
export async function fetchSafetyCategories(): Promise<SafetyCategory[]> {
  
  const snapshot = await getDocs(collection(firebaseFirestore, COLLECTION));

  const options = snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() as {
        name?: string;
        label?: string;
        order?: number;
        icon?: string;
      };
      return {
        id: docSnap.id,
        label: (data.name ?? data.label ?? docSnap.id).trim(),
        order: typeof data.order === "number" ? data.order : 999,
        icon: toSafetyCategoryIcon(data.icon),
      };
    })
    .filter((o) => o.label.length > 0)
    .sort((a, b) => a.order - b.order)
    .map(({ id, label, icon }) => ({ id, label, icon }));

  return options;
}
