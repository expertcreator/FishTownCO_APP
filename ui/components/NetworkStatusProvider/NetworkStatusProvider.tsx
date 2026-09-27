import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import React, { useEffect, useRef } from "react";
import { AppState, type AppStateStatus, Modal, Platform } from "react-native";
import { Toastify } from "@/ui/components/Toast";
import { useNetworkStore } from "@/ui/stores/networkStore";
import { useTranslation } from "@/ui/translations";
import {
  isNetInfoCandidateOnline,
  isNetInfoLinkOffline,
  NETWORK_PROBE_TIMEOUT_MS,
  NETWORK_PROBE_URL,
  NETWORK_STABLE_MS,
  probeNetworkReachability,
} from "@/ui/utils/networkConnectivity";
import { OfflineScreen } from "./OfflineScreen";

const TOAST_VISIBILITY_MS = 5000;

type NetworkStatusProviderProps = {
  children?: React.ReactNode;
};

/**
 * Subscribes to network state via @react-native-community/netinfo,
 * requires a short stable window + reachability probe before clearing offline,
 * and shows a full-screen overlay while connectivity is unusable.
 * Mount once at app root so the whole app can use useNetworkStore / useIsOffline.
 * @param props - Provider props
 * @param props.children - App tree under the overlay
 * @returns Provider element wrapping children and the offline modal
 */
export function NetworkStatusProvider({
  children,
}: NetworkStatusProviderProps) {
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
      // iOS HTTP reachability flaps `isInternetReachable` and retriggered
      // the offline overlay. Interface state is enough; we probe ourselves.
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
        probeNetworkReachability(NETWORK_PROBE_URL, NETWORK_PROBE_TIMEOUT_MS)
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
        if (currently === true) {
          previousConnectedRef.current = true;
          return;
        }
        scheduleRecoveryProbe();
        return;
      }

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
