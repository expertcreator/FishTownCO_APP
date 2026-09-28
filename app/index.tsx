import { resolveAppLaunchRoute } from "@/features/auth/utils/resolveAppLaunchRoute";
import { firebaseAuth } from "@/features/common/firebase";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { onAuthStateChanged } from "@react-native-firebase/auth";
import { Redirect, type Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

/** Keeps the native splash up long enough that it does not flash. */
const MIN_SPLASH_MS = 1000;

/**
 * App entry under the native splash.
 * Waits for onboarding hydration and Firebase Auth, then opens Welcome, Login,
 * or Home. The splash stays up until that screen is ready, so the boot
 * skeleton never appears in front of the bottom tabs.
 * @returns Redirect once the launch route is known
 */
export default function Index() {
  const hasCompletedOnboarding = useOnboardingStore(
    (s) => s.hasCompletedOnboarding
  );
  const [onboardingHydrated, setOnboardingHydrated] = useState(() =>
    useOnboardingStore.persist.hasHydrated()
  );
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [redirectTo, setRedirectTo] = useState<Href | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (onboardingHydrated) return;
    return useOnboardingStore.persist.onFinishHydration(() => {
      setOnboardingHydrated(true);
    });
  }, [onboardingHydrated]);

  useEffect(() => {
    if (!onboardingHydrated) return;

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (cancelled) return;
      try {
        setRedirectTo(
          resolveAppLaunchRoute(hasCompletedOnboarding, Boolean(user))
        );
      } catch {
        setRedirectTo("/welcome");
      } finally {
        setIsReady(true);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [hasCompletedOnboarding, onboardingHydrated]);

  const launchHref = isReady ? redirectTo : null;

  useEffect(() => {
    if (!launchHref || !minSplashElapsed) return;
    SplashScreen.hideAsync().catch(() => undefined);
  }, [launchHref, minSplashElapsed]);

  if (!launchHref || !minSplashElapsed) {
    return null;
  }

  return <Redirect href={launchHref} />;
}
