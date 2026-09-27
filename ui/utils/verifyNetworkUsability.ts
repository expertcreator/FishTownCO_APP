import { useNetworkStore } from "@/ui/stores/networkStore";
import {
  isNetInfoCandidateOnline,
  isNetInfoLinkOffline,
  NETWORK_PROBE_TIMEOUT_MS,
  NETWORK_PROBE_URL,
  probeNetworkReachability,
} from "@/ui/utils/networkConnectivity";
import NetInfo from "@react-native-community/netinfo";

/**
 * Runs NetInfo + reachability probe verification and updates the network store.
 * Used by the offline Refresh button and recovery flows.
 * @returns Whether the network is usable after verification
 */
export async function verifyNetworkUsability(): Promise<boolean> {
  const store = useNetworkStore.getState();
  store.setVerifying(true);

  try {
    const state = await NetInfo.fetch();
    if (isNetInfoLinkOffline(state) || !isNetInfoCandidateOnline(state)) {
      store.setNetworkState(false);
      return false;
    }

    const reachable = await probeNetworkReachability(
      NETWORK_PROBE_URL,
      NETWORK_PROBE_TIMEOUT_MS
    );
    store.setNetworkState(reachable);
    return reachable;
  } finally {
    useNetworkStore.getState().setVerifying(false);
  }
}
