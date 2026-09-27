import { create } from "zustand";
import {
  fetchCrewCertificateTypes,
  upsertCrewCertificateTypeSeed,
} from "@/features/crew/services/crewCertificateTypes";
import type { PickerOption } from "@/ui/components/OptionsPickerModal";

type CrewCertificateTypesState = {
  types: PickerOption[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  /**
   * Seeds Firestore type docs (when signed in), then loads them into memory.
   * @returns Promise that resolves when load finishes
   */
  loadTypes: () => Promise<void>;
};

/**
 * In-memory cache of Firestore crew certificate types.
 */
export const useCrewCertificateTypesStore = create<CrewCertificateTypesState>(
  (set, get) => ({
    types: [],
    isLoading: false,
    isLoaded: false,
    error: null,

    loadTypes: async () => {
      if (get().isLoading) return;
      set({ isLoading: true, error: null });
      try {
        try {
          await upsertCrewCertificateTypeSeed();
        } catch (seedError) {
          console.warn(
            "[crewCertificateTypesStore] seed failed (check Firestore write rules)",
            seedError
          );
        }

        const types = await fetchCrewCertificateTypes();
        set({
          types,
          isLoaded: true,
          isLoading: false,
          error:
            types.length === 0
              ? "No certificate types found in Firestore"
              : null,
        });
      } catch (error) {
        console.error("[crewCertificateTypesStore] load failed", error);
        set({
          types: [],
          isLoaded: true,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load certificate types",
        });
      }
    },
  })
);
