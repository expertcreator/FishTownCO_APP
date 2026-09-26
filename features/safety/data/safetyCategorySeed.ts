import type { PickerOption } from "@/ui/components/OptionsPickerModal";

/**
 * Seed documents written once into Firestore `safetyCategories`.
 * Not used as an in-app static picker list.
 */
export const SAFETY_CATEGORY_SEED: Array<PickerOption & { order: number }> = [
  { id: "life-saving", label: "Life-Saving Appliances", order: 1 },
  { id: "fire", label: "Fire Detection & Extinction", order: 2 },
  { id: "navigation", label: "Navigation & Telecommunications", order: 3 },
  { id: "statutory", label: "Statutory Certification", order: 4 },
  { id: "pyrotechnics", label: "Pyrotechnics & Distress Signals", order: 5 },
  { id: "medical", label: "Medical & First Aid", order: 6 },
  { id: "hull", label: "Hull & Machinery", order: 7 },
  { id: "mooring", label: "Ground Tackle & Mooring", order: 8 },
];
