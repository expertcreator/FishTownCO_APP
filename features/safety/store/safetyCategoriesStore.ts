import { create } from "zustand";
import {
  fetchSafetyCategories,
  upsertSafetyCategorySeed,
  type SafetyCategory,
} from "@/features/safety/services/safetyCategories";

type SafetyCategoriesState = {
  categories: SafetyCategory[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  /**
   * Seeds Firestore category docs (when signed in), then loads them into memory.
   * @returns Promise that resolves when load finishes
   */
  loadCategories: () => Promise<void>;
};

/**
 * In-memory cache of Firestore safety categories (loaded on splash / login).
 */
export const useSafetyCategoriesStore = create<SafetyCategoriesState>(
  (set, get) => ({
    categories: [],
    isLoading: false,
    isLoaded: false,
    error: null,

    loadCategories: async () => {
      if (get().isLoading) return;
      set({ isLoading: true, error: null });
      try {
        try {
          await upsertSafetyCategorySeed();
        } catch {
          
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
          categories: [],
          isLoaded: true,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load categories",
        });
      }
    },
})
);
