import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  fetchSafetyCategories,
  upsertSafetyCategorySeed,
  type SafetyCategory,
} from "@/features/safety/services/safetyCategories";
import {
  createZustandMMKVStorage,
  waitForPersistHydration,
} from "@/ui/stores/mmkvStorage";

type SafetyCategoriesState = {
  categories: SafetyCategory[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  /**
   * Refreshes safety categories from Firestore.
   * Keeps the last saved list when the refresh fails.
   * @returns Promise that resolves when load finishes
   */
  loadCategories: () => Promise<void>;
};

/**
 * Safety categories saved on device and refreshed from Firestore on splash.
 */
export const useSafetyCategoriesStore = create<SafetyCategoriesState>()(
  persist(
    (set, get) => ({
      categories: [],
      isLoading: false,
      isLoaded: false,
      error: null,

      loadCategories: async () => {
        if (get().isLoading) return;
        await waitForPersistHydration(useSafetyCategoriesStore.persist);
        if (get().isLoading) return;
        const saved = get().categories;
        set({ isLoading: true, error: null });
        try {
          try {
            await upsertSafetyCategorySeed();
          } catch {
            // Seed write can fail; the saved list and the following read still apply.
          }

          const categories = await fetchSafetyCategories();
          set({
            categories,
            isLoaded: true,
            isLoading: false,
            error:
              categories.length === 0
                ? "No categories found in Firestore"
                : null,
          });
        } catch (error) {
          set({
            categories: saved,
            isLoaded: true,
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to load categories",
          });
        }
      },
    }),
    {
      name: "fishtownco-safety-categories",
      storage: createZustandMMKVStorage<Pick<SafetyCategoriesState, "categories">>(),
      partialize: (state) => ({ categories: state.categories }),
    }
  )
);
