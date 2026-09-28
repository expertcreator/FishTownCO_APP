import type { PickerOption } from "@/ui/components/OptionsPickerModal";

/**
 * Seed documents written once into Firestore `safetyCategories`.
 * Not used as an in-app static picker list.
 */
export const SAFETY_CATEGORY_SEED: Array<
  PickerOption & { order: number; icon: string }
> = [
  { id: "life-saving", label: "Life-Saving Appliances", order: 1, icon: "help-buoy-outline" },
  { id: "fire", label: "Fire Detection & Extinction", order: 2, icon: "flame-outline" },
  { id: "navigation", label: "Navigation & Telecommunications", order: 3, icon: "radio-outline" },
  { id: "statutory", label: "Statutory Certification", order: 4, icon: "document-text-outline" },
  { id: "pyrotechnics", label: "Pyrotechnics & Distress Signals", order: 5, icon: "flash-outline" },
  { id: "medical", label: "Medical & First Aid", order: 6, icon: "medkit-outline" },
  { id: "hull", label: "Hull & Machinery", order: 7, icon: "construct-outline" },
  { id: "mooring", label: "Ground Tackle & Mooring", order: 8, icon: "boat-outline" },
];
