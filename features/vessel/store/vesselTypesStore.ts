import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  fetchVesselTypes,
  type VesselTypeOption,
} from "@/features/vessel/services/vesselTypes";
import {
  createZustandMMKVStorage,
  waitForPersistHydration,
} from "@/ui/stores/mmkvStorage";

type VesselTypesState = {
  types: VesselTypeOption[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  /**
   * Refreshes vessel types from Firestore.
   * Keeps the last saved list when the refresh fails.
   * @returns Promise that resolves when load finishes
   */
  loadTypes: () => Promise<void>;
};

/**
 * Vessel types saved on device and refreshed from Firestore on splash.
 */
export const useVesselTypesStore = create<VesselTypesState>()(
  persist(
    (set, get) => ({
      types: [],
      isLoading: false,
      isLoaded: false,
      error: null,

      loadTypes: async () => {
        if (get().isLoading) return;
        await waitForPersistHydration(useVesselTypesStore.persist);
        if (get().isLoading) return;
        const saved = get().types;
        set({ isLoading: true, error: null });
        try {
          const types = await fetchVesselTypes();
          set({
            types,
            isLoaded: true,
            isLoading: false,
            error: types.length === 0 ? "No vessel types found in Firestore" : null,
          });
        } catch (error) {
          set({
            types: saved,
            isLoaded: true,
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to load vessel types",
          });
        }
      },
    }),
    {
      name: "fishtownco-vessel-types",
      storage: createZustandMMKVStorage<Pick<VesselTypesState, "types">>(),
      partialize: (state) => ({ types: state.types }),
    }
  )
);
