import { create } from "zustand";
import { NETWORK_TRANSPORT_FAILURE_THRESHOLD } from "@/shared/utils/networkConnectivity";

type NetworkState = {
  /**
   * Usable connectivity for the app:
   * - `true` — verified online (or initial optimistic online)
   * - `false` — offline / unreachable / failed probe — show blocking overlay
   * - `null` — unknown (do not show overlay yet)
   */
  isConnected: boolean | null;
  /** True while Refresh / recovery probe is in flight. */
  isVerifying: boolean;
  setNetworkState: (isConnected: boolean | null) => void;
  setVerifying: (isVerifying: boolean) => void;
};

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: null,
  isVerifying: false,
  setNetworkState: (isConnected) => set({ isConnected }),
  setVerifying: (isVerifying) => set({ isVerifying }),
}));

/** Selector: true when we know the device is offline / unusable. */
export const useIsOffline = () => {
  const isConnected = useNetworkStore((s) => s.isConnected);
  return isConnected === false;
};

/** Selector: true when we know the device is online. */
export const useIsOnline = () => {
  const isConnected = useNetworkStore((s) => s.isConnected);
  return isConnected === true;
};

let transportFailureCount = 0;
let transportFailureResetTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Clears consecutive API transport-failure tracking after a successful response.
 * @returns void
 */
export function reportTransportSuccess(): void {
  transportFailureCount = 0;
  if (transportFailureResetTimer) {
    clearTimeout(transportFailureResetTimer);
    transportFailureResetTimer = null;
  }
}

/**
 * Records a network/timeout failure. After the threshold, forces the offline overlay
 * so the user is not left on half-loaded screens during a dead / hung link.
 * @returns void
 */
export function reportTransportFailure(): void {
  const { isConnected, setNetworkState } = useNetworkStore.getState();
  if (isConnected === false) {
    return;
  }

  transportFailureCount += 1;

  if (transportFailureResetTimer) {
    clearTimeout(transportFailureResetTimer);
  }
  transportFailureResetTimer = setTimeout(() => {
    transportFailureCount = 0;
    transportFailureResetTimer = null;
  }, 30_000);

  if (transportFailureCount >= NETWORK_TRANSPORT_FAILURE_THRESHOLD) {
    transportFailureCount = 0;
    setNetworkState(false);
  }
}
