import { onAuthStateChanged } from "@react-native-firebase/auth";
import { router, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { firebaseAuth } from "@/features/common/firebase";
import {
  canUseApp,
  fetchSubscriptionAccess,
  subscribeSubscriptionAccess,
  type SubscriptionAccess,
} from "@/features/subscription/services/subscriptionAccess";
import { fetchVesselProfile } from "@/features/vessel/services/fetchVesselProfile";

/**
 * Keeps an unpaid user on the payment screen once the 7-day trial is over.
 * A signed-in user with no vessel is sent to Add Vessel before the trial starts.
 * Add Vessel and the checklist stay reachable before the trial starts.
 * Auth screens stay reachable so logout and account deletion can finish.
 * @returns Nothing. Navigation happens as a side effect.
 */
export function SubscriptionLock() {
  const segments = useSegments();
  const [access, setAccess] = useState<SubscriptionAccess | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    /** Only the newest load may update state; an older one carries stale access. */
    let latestLoad = 0;

    const load = (uid: string | null) => {
      const loadId = ++latestLoad;
      if (!uid) {
        if (!cancelled) {
          setSignedIn(false);
          setAccess(null);
        }
        return;
      }
      void fetchSubscriptionAccess()
        .then((next) => {
          if (cancelled || loadId !== latestLoad) return;
          setSignedIn(true);
          setAccess(next);
        })
        .catch(() => {
          if (!cancelled && loadId === latestLoad) setAccess(null);
        });
    };

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      load(user?.uid ?? null);
    });
    const accessChanged = subscribeSubscriptionAccess((known) => {
      // Apply saved values now, so the redirect below never runs on the old access.
      if (known) {
        setAccess((current) => (current ? { ...current, ...known } : current));
      }
      load(firebaseAuth.currentUser?.uid ?? null);
    });
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") load(firebaseAuth.currentUser?.uid ?? null);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      accessChanged();
      appState.remove();
    };
  }, []);

  useEffect(() => {
    if (!signedIn || !access || canUseApp(access)) return;
    const root = segments[0];
    const child = segments[1];
    if (root === "(auth)") return;
    const onVesselSetup =
      root === "vessel" && (child === "edit" || child === "build-checklist");
    const trialNotStarted = !access.trialStartedAt;
    if (trialNotStarted && onVesselSetup) return;

    let cancelled = false;
    void (async () => {
      if (!trialNotStarted) {
        if (root !== "subscription") router.replace("/subscription");
        return;
      }
      let hasVessel = true;
      try {
        const profile = await fetchVesselProfile();
        hasVessel = Boolean(profile?.name.trim());
      } catch {
        hasVessel = true;
      }
      if (cancelled) return;
      if (!hasVessel) {
        if (!onVesselSetup) router.replace("/vessel/edit");
        return;
      }
      if (root !== "subscription") router.replace("/subscription");
    })();

    return () => {
      cancelled = true;
    };
  }, [access, segments, signedIn]);

  return null;
}
