import { env } from "@/shared/constants";
import { useNetworkStore } from "@/shared/stores/networkStore";
import { useTranslation } from "@/shared/translations";
import {
  isNetInfoCandidateOnline,
  isNetInfoLinkOffline,
  NETWORK_PROBE_TIMEOUT_MS,
  NETWORK_STABLE_MS,
  probeApiReachability,
} from "@/shared/utils/networkConnectivity";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import React, { useEffect, useRef } from "react";
import { AppState, type AppStateStatus, Modal, Platform } from "react-native";
import { Toastify } from "../Toast";
import { OfflineScreen } from "./OfflineScreen";

const TOAST_VISIBILITY_MS = 5000;

type NetworkStatusProviderProps = {
  children?: React.ReactNode;
};

/**
 * Subscribes to network state via @react-native-community/netinfo,
 * requires a short stable window + API probe before clearing offline,
 * and shows a full-screen overlay while connectivity is unusable.
 * Mount once at app root so the whole app can use useNetworkStore / useIsOffline.
 * @param props - Provider props
 * @param props.children - App tree under the overlay
 * @returns Provider element wrapping children and the offline modal
 */
export function NetworkStatusProvider({ children }: NetworkStatusProviderProps) {
  const { t } = useTranslation();
  const isOffline = useNetworkStore((s) => s.isConnected === false);
  const setNetworkState = useNetworkStore((s) => s.setNetworkState);
  const previousConnectedRef = useRef<boolean | null>(null);
  const stableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const probeInFlightRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const applyStateRef = useRef<(state: NetInfoState) => void>(() => {});

  useEffect(() => {
    if (isOffline) {
      previousConnectedRef.current = false;
    }
  }, [isOffline]);

  useEffect(() => {
    NetInfo.configure({
      // iOS HTTP reachability to the API flaps `isInternetReachable` and
      // retriggered the offline overlay. Interface state is enough; we probe.
      reachabilityShouldRun: () => false,
      shouldFetchWiFiSSID: false,
    });
  }, []);

  useEffect(() => {
    const clearStableTimer = () => {
      if (stableTimerRef.current) {
        clearTimeout(stableTimerRef.current);
        stableTimerRef.current = null;
      }
    };

    const announceIfRestored = (nextOnline: boolean) => {
      const wasConnected = previousConnectedRef.current;
      previousConnectedRef.current = nextOnline;
      if (wasConnected === false && nextOnline === true) {
        Toastify.success(t("network-welcome-back", "Welcome back"), {
          visibilityTime: TOAST_VISIBILITY_MS,
        });
      }
    };

    const markOffline = () => {
      clearStableTimer();
      setNetworkState(false);
      previousConnectedRef.current = false;
    };

    const scheduleRecoveryProbe = () => {
      clearStableTimer();
      stableTimerRef.current = setTimeout(() => {
        stableTimerRef.current = null;
        if (probeInFlightRef.current) {
          return;
        }
        probeInFlightRef.current = true;
        useNetworkStore.getState().setVerifying(true);
        probeApiReachability(env.apiUrl, NETWORK_PROBE_TIMEOUT_MS)
          .then((reachable) => {
            if (!reachable) {
              markOffline();
              return;
            }
            setNetworkState(true);
            announceIfRestored(true);
          })
          .catch(() => {
            markOffline();
          })
          .finally(() => {
            probeInFlightRef.current = false;
            useNetworkStore.getState().setVerifying(false);
          });
      }, NETWORK_STABLE_MS);
    };

    const applyState = (state: NetInfoState) => {
      if (isNetInfoLinkOffline(state)) {
        markOffline();
        return;
      }

      if (isNetInfoCandidateOnline(state)) {
        const currently = useNetworkStore.getState().isConnected;
        // Already verified online — stay online without re-probing on every NetInfo tick.
        if (currently === true) {
          previousConnectedRef.current = true;
          return;
        }
        // Offline or unknown: require stability + probe before clearing the overlay.
        scheduleRecoveryProbe();
        return;
      }

      // Connected unknown / incomplete — if we were offline, keep overlay and retry later.
      if (useNetworkStore.getState().isConnected === false) {
        scheduleRecoveryProbe();
      }
    };

    applyStateRef.current = applyState;

    NetInfo.fetch().then(applyState);
    const unsubscribe = NetInfo.addEventListener(applyState);

    const onAppStateChange = (nextState: AppStateStatus) => {
      const wasBackgrounded = appStateRef.current === "background";
      appStateRef.current = nextState;

      // Ignore iOS `inactive` (Control Center, notifications) — it was
      // re-fetching NetInfo and flipping the overlay on every return.
      if (wasBackgrounded && nextState === "active") {
        NetInfo.fetch().then(applyState);
      }
    };
    const appStateSub = AppState.addEventListener("change", onAppStateChange);

    return () => {
      clearStableTimer();
      unsubscribe();
      appStateSub.remove();
    };
  }, [setNetworkState, t]);

  // While blocked offline, periodically re-check so restore does not depend on a NetInfo flap.
  useEffect(() => {
    if (!isOffline) {
      return;
    }

    const intervalId = setInterval(() => {
      NetInfo.fetch()
        .then((state) => applyStateRef.current(state))
        .catch(() => {});
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isOffline]);

  return (
    <>
      {children}
      <Modal
        visible={isOffline}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          // Keep overlay until connectivity is restored and verified.
        }}
        hardwareAccelerated={Platform.OS === "android"}
      >
        <OfflineScreen />
      </Modal>
    </>
  );
}
