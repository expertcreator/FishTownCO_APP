import { waitForAuthUser } from "@/features/safety/services/prefetchSafetyCategories";
import { useCrewCertificateTypesStore } from "@/features/crew/store/crewCertificateTypesStore";

/**
 * Seeds + loads crew certificate types during splash when a user session exists.
 * @returns Promise that resolves when prefetch finishes (or is skipped)
 */
export async function prefetchCrewCertificateTypes(): Promise<void> {
  console.log("[prefetchCrewCertificateTypes] start");
  const user = await waitForAuthUser();
  if (!user) {
    console.log(
      "[prefetchCrewCertificateTypes] skipped — no auth session on splash"
    );
    return;
  }

  await useCrewCertificateTypesStore.getState().loadTypes();
  console.log("[prefetchCrewCertificateTypes] done", {
    count: useCrewCertificateTypesStore.getState().types.length,
  });
}
