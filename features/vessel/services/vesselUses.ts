import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "@react-native-firebase/firestore";
import { firebaseFirestore } from "@/features/common/firebase";
import type { PickerOption } from "@/ui/components/OptionsPickerModal";

const COLLECTION = "vesselUses";

/** Shown when a vessel use has no saved icon, or the name is not a real icon. */
export const DEFAULT_VESSEL_USE_ICON = "compass-outline";

export type VesselUseOption = PickerOption & {
  icon: string;
};

/**
 * Returns a saved vessel-use icon when it is a real Ionicons name.
 * @param icon - Value stored on the use document
 * @returns Glyph name safe to pass to `Ionicons`
 */
export function toVesselUseIcon(
  icon: string | null | undefined
): keyof typeof Ionicons.glyphMap {
  const name = icon?.trim() ?? "";
  if (name && name in Ionicons.glyphMap) {
    return name as keyof typeof Ionicons.glyphMap;
  }
  return DEFAULT_VESSEL_USE_ICON;
}

/**
 * Loads vessel uses from Firestore `vesselUses`.
 * @returns Use picker options
 * @throws {Error} When Firestore read fails
 */
export async function fetchVesselUses(): Promise<VesselUseOption[]> {
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
        icon: toVesselUseIcon(data.icon),
      };
    })
    .filter((option) => option.label.length > 0)
    .sort((a, b) => a.order - b.order)
    .map(({ id, label, icon }) => ({ id, label, icon }));
}
