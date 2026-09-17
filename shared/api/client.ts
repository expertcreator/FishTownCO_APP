import type { AppType, DeviceType } from "@/constants";
import { getActiveAuthTokenSync } from "@/shared/stores/secureSessionStorage";
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

/** Outgoing request marked when sent with a session token — kept for app-level interceptors that need it. */
type RequestConfigWithSessionFlag = InternalAxiosRequestConfig & {
  _hadActiveSession?: boolean;
};

export interface ClientConfig extends AxiosRequestConfig {
  baseURL?: string;
  /**
   * Logical app type (customer / rider / admin / pos, etc.) — `AppType` request header.
   */
  appType?: AppType;
  platform?: DeviceType;
  /** Native/web surface: ios | android | web — sent as `DeviceType` header. */
  deviceType?: DeviceType;
  /**
   * Optional token provider for Authorization header.
   * Use this when the app keeps session in a store (e.g. Zustand/MMKV).
   * Falls back to Secure Store cache via getActiveAuthTokenSync() (staff session, else guest).
   */
  getAuthToken?: () => string | null;
}

/** Optional reporter for server/network failures (e.g. Sentry). Set by app bootstrap. */
let onServerOrNetworkError: ((error: unknown) => void) | undefined;

export function setServerErrorReporter(
  fn: typeof onServerOrNetworkError
): void {
  onServerOrNetworkError = fn;
}

export const createApiClient = (config?: ClientConfig): AxiosInstance => {
  const {
    appType,
    deviceType: deviceTypeHeader,
    getAuthToken,
    ...axiosRest
  } = config ?? {};

  const client = axios.create({
    timeout: 10_000,
    ...axiosRest,
    baseURL: axiosRest.baseURL ?? config?.baseURL,
  });

  // Request interceptor (auth headers + app metadata)
  client.interceptors.request.use((request: RequestConfigWithSessionFlag) => {
    // Inject auth headers (prefer app-provided token getter, fallback to SecureStore cache)
    const sessionId = getAuthToken?.() ?? getActiveAuthTokenSync();
    request._hadActiveSession = Boolean(sessionId);
    if (sessionId) {
      request.headers.set("Authorization", `Bearer ${sessionId}`);
    }

    // Inject app type / platform metadata headers
    if (appType) {
      request.headers.set("AppType", appType);
    }
    if (deviceTypeHeader) {
      const xPlatform =
        deviceTypeHeader === "ios" || deviceTypeHeader === "android"
          ? "mobile"
          : "web";

      request.headers.set("X-Platform", xPlatform);
      request.headers.set("DeviceType", deviceTypeHeader);
    }

    return request;
  });

  // Response interceptor: only reports server / network errors. Auto-logout-on-401 is intentionally removed —
  // session lifecycle is now handled per-feature (e.g. tenant access revoked, subscription 402).
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error)) {
        const st = error.response?.status;
        if (st === undefined || st >= 500) {
          onServerOrNetworkError?.(error);
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};
