import { env } from "@/shared/constants";
import { useNetworkStore } from "@/shared/stores/networkStore";
import {
  isNetInfoCandidateOnline,
  isNetInfoLinkOffline,
  NETWORK_PROBE_TIMEOUT_MS,
  probeApiReachability,
} from "@/shared/utils/networkConnectivity";
import NetInfo from "@react-native-community/netinfo";

/**
 * Runs NetInfo + API probe verification and updates the network store.
 * Used by the offline Refresh button and recovery flows.
 * @returns Whether the network is usable after verification
 */
export async function verifyNetworkUsability(): Promise<boolean> {
  const store = useNetworkStore.getState();
  store.setVerifying(true);

  try {
    const state = await NetInfo.fetch();
    // Interface down only — do not trust iOS `isInternetReachable === false`.
    if (isNetInfoLinkOffline(state) || !isNetInfoCandidateOnline(state)) {
      store.setNetworkState(false);
      return false;
    }

    const reachable = await probeApiReachability(
      env.apiUrl,
      NETWORK_PROBE_TIMEOUT_MS
    );
    store.setNetworkState(reachable);
    return reachable;
  } finally {
    useNetworkStore.getState().setVerifying(false);
  }
}
