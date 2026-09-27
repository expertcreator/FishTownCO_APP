import type { PickerOption } from "@/ui/components/OptionsPickerModal";

/**
 * Seed documents written once into Firestore `crewCertificateTypes`.
 * Matches https://fishtownco.itoasis.co/ Add Crew certificate dropdown.
 */
export const CREW_CERTIFICATE_TYPE_SEED: Array<
  PickerOption & { order: number }
> = [
  { id: "medical-eng1", label: "Medical (ENG1 / MLS)", order: 1 },
  { id: "stcw-basic", label: "STCW Basic Safety Training", order: 2 },
  { id: "master-coc", label: "Master / Skipper CoC", order: 3 },
  { id: "gmdss", label: "GMDSS Radio Operator (SRC/LRC)", order: 4 },
  { id: "fire-fighting", label: "Advanced Fire Fighting", order: 5 },
  { id: "first-aid", label: "First Aid at Sea", order: 6 },
  { id: "survival", label: "Personal Survival Techniques", order: 7 },
  { id: "other", label: "Other Qualification", order: 8 },
];
