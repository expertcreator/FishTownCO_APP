import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createZustandMMKVStorage } from "@/ui/stores/mmkvStorage";

type OnboardingState = {
  hasCompletedOnboarding: boolean;
  /** Marks onboarding as finished so Welcome is not forced again. */
  completeOnboarding: () => void;
  /** Resets onboarding (dev/testing). */
  resetOnboarding: () => void;
};

/**
 * Persists whether the user finished the Fishtownco onboarding carousel.
 */
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
    }),
    {
      name: "fishtownco-onboarding",
      storage: createZustandMMKVStorage<
        Pick<OnboardingState, "hasCompletedOnboarding">
      >(),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);
