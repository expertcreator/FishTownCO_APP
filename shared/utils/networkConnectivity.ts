import { env } from "@/shared/constants";
import type { NetInfoState } from "@react-native-community/netinfo";

/** How long NetInfo must look healthy before we attempt a reachability probe. */
export const NETWORK_STABLE_MS = 1500;

/** Abort probe if the API does not answer in time (slow / hung link). */
export const NETWORK_PROBE_TIMEOUT_MS = 5000;

/** Consecutive transport failures before forcing the offline overlay. */
export const NETWORK_TRANSPORT_FAILURE_THRESHOLD = 5;

/**
 * True when the interface itself is down (airplane / no Wi‑Fi or cellular).
 * Does not use `isInternetReachable` — iOS flaps that flag and it is not
 * treated as instant offline.
 * @param state - Latest NetInfo snapshot
 * @returns Whether the device should be treated as offline immediately
 */
export function isNetInfoLinkOffline(state: NetInfoState): boolean {
  return state.isConnected === false;
}

/**
 * True when NetInfo reports an interface (Wi‑Fi / cellular) so we may probe.
 * `isInternetReachable` is ignored; iOS often reports false while the API works.
 * @param state - Latest NetInfo snapshot
 * @returns Whether recovery verification should run
 */
export function isNetInfoCandidateOnline(state: NetInfoState): boolean {
  return state.isConnected === true;
}

/**
 * Probes the API origin with a short timeout. Any HTTP response means the
 * network can reach our backend; abort / network errors mean unusable.
 * @param baseUrl - API base URL (trailing slash ok)
 * @param timeoutMs - Abort after this many ms
 * @returns Whether the probe succeeded
 */
export async function probeApiReachability(
  baseUrl: string = env.apiUrl,
  timeoutMs: number = NETWORK_PROBE_TIMEOUT_MS
): Promise<boolean> {
  const url = baseUrl.trim();
  if (!url) {
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "*/*" },
    });
    // 2xx–4xx prove the host answered; 5xx still means the link works.
    return response.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
