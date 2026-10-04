import { waitForAuthUser } from "@/features/safety/services/prefetchSafetyCategories";
import { useSafetyCategoriesStore } from "@/features/safety/store/safetyCategoriesStore";
import { useVesselTypesStore } from "@/features/vessel/store/vesselTypesStore";
import { useVesselUsesStore } from "@/features/vessel/store/vesselUsesStore";

/**
 * Starts catalog loads without blocking navigation.
 * Vessel setup and Home read the stores as the lists arrive.
 * @returns void
 */
export function startSessionPrefetch(): void {
  void useSafetyCategoriesStore.getState().loadCategories();
  void prefetchVesselCatalogs();
}

/**
 * Loads vessel types and vessel uses when a user session exists.
 * @returns Promise that resolves when both catalogs finish (or are skipped)
 */
export async function prefetchVesselCatalogs(): Promise<void> {
  const user = await waitForAuthUser();
  if (!user) return;

  await Promise.all([
    useVesselTypesStore.getState().loadTypes(),
    useVesselUsesStore.getState().loadUses(),
  ]);
}
