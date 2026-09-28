import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  fetchVesselUses,
  type VesselUseOption,
} from "@/features/vessel/services/vesselUses";
import {
  createZustandMMKVStorage,
  waitForPersistHydration,
} from "@/ui/stores/mmkvStorage";

type VesselUsesState = {
  uses: VesselUseOption[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  /**
   * Refreshes vessel uses from Firestore.
   * Keeps the last saved list when the refresh fails.
   * @returns Promise that resolves when load finishes
   */
  loadUses: () => Promise<void>;
};

/**
 * Vessel uses saved on device and refreshed from Firestore on splash.
 */
export const useVesselUsesStore = create<VesselUsesState>()(
  persist(
    (set, get) => ({
      uses: [],
      isLoading: false,
      isLoaded: false,
      error: null,

      loadUses: async () => {
        if (get().isLoading) return;
        await waitForPersistHydration(useVesselUsesStore.persist);
        if (get().isLoading) return;
        const saved = get().uses;
        set({ isLoading: true, error: null });
        try {
          const uses = await fetchVesselUses();
          set({
            uses,
            isLoaded: true,
            isLoading: false,
            error: uses.length === 0 ? "No vessel uses found in Firestore" : null,
          });
        } catch (error) {
          set({
            uses: saved,
            isLoaded: true,
            isLoading: false,
            error:
              error instanceof Error ? error.message : "Failed to load vessel uses",
          });
        }
      },
    }),
    {
      name: "fishtownco-vessel-uses",
      storage: createZustandMMKVStorage<Pick<VesselUsesState, "uses">>(),
      partialize: (state) => ({ uses: state.uses }),
    }
  )
);
