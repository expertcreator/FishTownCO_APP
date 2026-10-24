import { resolveAppLaunchRoute } from "@/features/auth/utils/resolveAppLaunchRoute";
import { firebaseAuth } from "@/features/common/firebase";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { fetchVesselProfile } from "@/features/vessel/services/fetchVesselProfile";
import { canUseApp, fetchSubscriptionAccess } from "@/features/subscription/services/subscriptionAccess";
import { onAuthStateChanged } from "@react-native-firebase/auth";
import { Redirect, type Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

/** Keeps the native splash up long enough that it does not flash. */
const MIN_SPLASH_MS = 1000;

/**
 * App entry under the native splash.
 * Waits for onboarding hydration and Firebase Auth, then opens Welcome, Login,
 * Add Vessel, or Home. A signed-in user with no saved vessel returns to Add Vessel.
 * The splash stays up until that screen is ready, so the boot
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
      void (async () => {
        if (cancelled) return;
        try {
          let hasVessel = true;
          let requiresSubscription = false;
          if (hasCompletedOnboarding && user) {
            try {
              const profile = await fetchVesselProfile();
              hasVessel = Boolean(profile?.name.trim());
            } catch {
              hasVessel = true;
            }
            if (hasVessel) {
              try {
                const access = await fetchSubscriptionAccess();
                requiresSubscription = !canUseApp(access);
              } catch {
                requiresSubscription = false;
              }
            }
          }
          if (cancelled) return;
          setRedirectTo(
            resolveAppLaunchRoute(
              hasCompletedOnboarding,
              Boolean(user),
              hasVessel,
              requiresSubscription
            )
          );
        } catch {
          if (!cancelled) setRedirectTo("/welcome");
        } finally {
          if (!cancelled) setIsReady(true);
        }
      })();
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
