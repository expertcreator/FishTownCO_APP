import { onAuthStateChanged } from "@react-native-firebase/auth";
import { firebaseAuth } from "@/features/common/firebase";
import { useSafetyCategoriesStore } from "@/features/safety/store/safetyCategoriesStore";

type AuthUser = NonNullable<typeof firebaseAuth.currentUser> | null;

/**
 * Waits briefly for a restored Firebase Auth session (or timeout).
 * @param timeoutMs - Max wait before resolving with current user / null
 * @returns Signed-in user or null
 */
export function waitForAuthUser(timeoutMs = 2500): Promise<AuthUser> {
  return new Promise((resolve) => {
    if (firebaseAuth.currentUser) {
      resolve(firebaseAuth.currentUser);
      return;
    }

    let settled = false;
    const finish = (user: AuthUser) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolve(user);
    };

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      finish(user);
    });

    const timer = setTimeout(() => {
      finish(firebaseAuth.currentUser);
    }, timeoutMs);
  });
}

/**
 * Seeds + loads safety categories during splash when a user session exists.
 * @returns Promise that resolves when prefetch finishes (or is skipped)
 */
export async function prefetchSafetyCategories(): Promise<void> {
  
  const user = await waitForAuthUser();
  if (!user) {
    
    return;
  }

  await useSafetyCategoriesStore.getState().loadCategories();
  
}
