import { waitForAuthUser } from "@/features/safety/services/prefetchSafetyCategories";
import { useCrewCertificateTypesStore } from "@/features/crew/store/crewCertificateTypesStore";

/**
 * Seeds + loads crew certificate types during splash when a user session exists.
 * @returns Promise that resolves when prefetch finishes (or is skipped)
 */
export async function prefetchCrewCertificateTypes(): Promise<void> {
  
  const user = await waitForAuthUser();
  if (!user) {
    
    return;
  }

  await useCrewCertificateTypesStore.getState().loadTypes();
  
}
