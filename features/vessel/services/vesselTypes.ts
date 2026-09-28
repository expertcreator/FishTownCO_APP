import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "@react-native-firebase/firestore";
import { firebaseFirestore } from "@/features/common/firebase";
import type { PickerOption } from "@/ui/components/OptionsPickerModal";

const COLLECTION = "vesselTypes";

/** Shown when a vessel type has no saved icon, or the name is not a real icon. */
export const DEFAULT_VESSEL_TYPE_ICON = "boat-outline";

export type VesselTypeOption = PickerOption & {
  icon: string;
};

/**
 * Returns a saved vessel-type icon when it is a real Ionicons name.
 * @param icon - Value stored on the type document
 * @returns Glyph name safe to pass to `Ionicons`
 */
export function toVesselTypeIcon(
  icon: string | null | undefined
): keyof typeof Ionicons.glyphMap {
  const name = icon?.trim() ?? "";
  if (name && name in Ionicons.glyphMap) {
    return name as keyof typeof Ionicons.glyphMap;
  }
  return DEFAULT_VESSEL_TYPE_ICON;
}

/**
 * Loads vessel types from Firestore `vesselTypes`.
 * @returns Type picker options
 * @throws {Error} When Firestore read fails
 */
export async function fetchVesselTypes(): Promise<VesselTypeOption[]> {
  const snapshot = await getDocs(collection(firebaseFirestore, COLLECTION));

  return snapshot.docs
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
        icon: toVesselTypeIcon(data.icon),
      };
    })
    .filter((option) => option.label.length > 0)
    .sort((a, b) => a.order - b.order)
    .map(({ id, label, icon }) => ({ id, label, icon }));
}
