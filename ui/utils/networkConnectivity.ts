import type { NetInfoState } from "@react-native-community/netinfo";

/** How long NetInfo must look healthy before we attempt a reachability probe. */
export const NETWORK_STABLE_MS = 1500;

/** Abort probe if the host does not answer in time (slow / hung link). */
export const NETWORK_PROBE_TIMEOUT_MS = 5000;

/** Consecutive transport failures before forcing the offline overlay. */
export const NETWORK_TRANSPORT_FAILURE_THRESHOLD = 5;

/**
 * Lightweight public reachability check (no app API base URL required).
 * Any HTTP response proves the device can reach the internet.
 */
export const NETWORK_PROBE_URL = "https://clients3.google.com/generate_204";

/**
 * True when the interface itself is down (airplane / no Wi‑Fi or cellular).
 * @param state - Latest NetInfo snapshot
 * @returns Whether the device should be treated as offline immediately
 */
export function isNetInfoLinkOffline(state: NetInfoState): boolean {
  return state.isConnected === false;
}

/**
 * True when NetInfo reports an interface so we may probe.
 * @param state - Latest NetInfo snapshot
 * @returns Whether recovery verification should run
 */
export function isNetInfoCandidateOnline(state: NetInfoState): boolean {
  return state.isConnected === true;
}

/**
 * Probes a known host with a short timeout. Any HTTP response means the
 * network can reach the internet; abort / network errors mean unusable.
 * @param url - Probe URL
 * @param timeoutMs - Abort after this many ms
 * @returns Whether the probe succeeded
 */
export async function probeNetworkReachability(
  url: string = NETWORK_PROBE_URL,
  timeoutMs: number = NETWORK_PROBE_TIMEOUT_MS
): Promise<boolean> {
  const target = url.trim();
  if (!target) {
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(target, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "*/*" },
    });
    return response.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
