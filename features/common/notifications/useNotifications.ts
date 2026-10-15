import { onAuthStateChanged } from "@react-native-firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";
import Constants from "expo-constants";
import * as Device from "expo-device";
import type { NotificationBehavior } from "expo-notifications";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import {
  firebaseAuth,
  firebaseFirestore,
  userPath,
} from "@/features/common/firebase";
import { mmkv } from "@/ui/stores/mmkvStorage";

const DEVICE_ID_KEY = "pushDeviceId";

/**
 * Reads a trimmed string from notification data.
 * @param data - Notification content data map
 * @param key - Field name
 * @returns Trimmed string, or undefined when missing
 */
function readNotificationString(
  data: Record<string, unknown>,
  key: string
): string | undefined {
  const value = data[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

/**
 * Returns a stable id for this install, created once and kept in local storage.
 * @returns Device id used as the Firestore device document id
 */
function getDeviceId(): string {
  const existing = mmkv.getString(DEVICE_ID_KEY);
  if (existing?.trim()) return existing.trim();
  const created = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  mmkv.set(DEVICE_ID_KEY, created);
  return created;
}

/**
 * Reads the EAS project id from the Expo config.
 * @returns Project id, or null when it is missing
 */
function resolveExpoProjectId(): string | null {
  const fromConfig = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof fromConfig === "string" && fromConfig.trim()) {
    return fromConfig.trim();
  }
  const eas = (
    Constants as typeof Constants & {
      easConfig?: { projectId?: string };
    }
  ).easConfig;
  const fromEas = eas?.projectId;
  if (typeof fromEas === "string" && fromEas.trim()) {
    return fromEas.trim();
  }
  return null;
}

/**
 * Creates the high-importance Android channel used for push alerts.
 * @returns Promise that resolves when the channel exists or the platform skips it
 */
export async function initNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  const channel = {
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250] as [number, number, number, number],
    lightColor: "#FF231F7C",
  };
  await Notifications.setNotificationChannelAsync("default", {
    ...channel,
    name: "Notifications",
  });
  await Notifications.setNotificationChannelAsync("default_high", {
    ...channel,
    name: "default_high",
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldPlaySound: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldSetBadge: false,
    }) satisfies NotificationBehavior,
});

initNotificationChannel().catch(() => undefined);

/**
 * Asks for push permission. Skips simulators and returns the granted state.
 * @returns True when the user has allowed notifications
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

/**
 * Clears the launcher badge.
 * @returns Promise that resolves when the badge is cleared or the call fails
 */
export async function clearAppIconBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0).catch(() => undefined);
}

/**
 * Gets the Expo push token for this physical device.
 * @returns Expo push token, or null when permission, project id, or the device blocks it
 */
export async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[Notification] Expo push token skipped: not a physical device");
    return null;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) {
    console.log("[Notification] Expo push token skipped: permission not granted");
    return null;
  }

  const projectId = resolveExpoProjectId();
  if (!projectId) {
    console.log("[Notification] Expo push token skipped: missing Expo project id");
    return null;
  }

  try {
    await initNotificationChannel();
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log("[Notification] Expo push token:", data);
    return data;
  } catch (error) {
    console.log(
      "[Notification] Expo push token failed:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Saves the Expo push token under `users/{uid}/devices/{deviceId}`.
 * @returns Promise that resolves when the token is stored or the step is skipped
 */
export async function setupNotifications(): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user?.uid) return;

  const token = await getPushToken();
  if (!token) return;

  const deviceId = getDeviceId();
  const deviceName = Device.deviceName ?? Device.modelName ?? "unknown-device";
  const path = userPath(user.uid, "devices", deviceId);

  await setDoc(
    doc(firebaseFirestore, path),
    {
      token,
      deviceType: Platform.OS === "ios" ? "ios" : "android",
      deviceName,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Registers the push token after login or signup. Failures stay silent.
 * @returns void
 */
export function registerPushTokenAfterAuth(): void {
  setupNotifications().catch(() => undefined);
}

/**
 * Opens the screen named in a notification payload.
 * @param data - Notification data
 * @returns void
 */
function openFromNotificationData(
  data: Record<string, unknown> | undefined
): void {
  if (!data) return;

  const safetyItemId = readNotificationString(data, "safetyItemId");
  const walletDocId = readNotificationString(data, "walletDocId");
  const crewId = readNotificationString(data, "crewId");
  const screen = readNotificationString(data, "screen");

  if (!safetyItemId && !walletDocId && !crewId && !screen) return;

  clearAppIconBadge().catch(() => undefined);

  if (safetyItemId) {
    router.push(`/safety/${safetyItemId}`);
    return;
  }
  if (walletDocId) {
    router.push(`/wallet/${walletDocId}`);
    return;
  }
  if (crewId) {
    router.push(`/crew/${crewId}`);
    return;
  }

  switch (screen) {
    case "vessel":
      router.push("/(tabs)/vessel");
      break;
    case "safety":
      router.push("/(tabs)/safety");
      break;
    case "wallet":
      router.push("/(tabs)/wallet");
      break;
    case "crew":
      router.push("/crew");
      break;
    case "home":
      router.push("/(tabs)/home");
      break;
    default:
      break;
  }
}

/**
 * Requests notification permission, stores the Expo push token after sign-in,
 * and routes notification taps.
 * @returns Empty hook surface; listeners run as a side effect
 */
export function useNotifications(): void {
  const [uid, setUid] = useState<string | null>(
    firebaseAuth.currentUser?.uid ?? null
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const handledResponseIdRef = useRef<string | null>(null);

  const routeFromNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const id = response.notification.request.identifier;
      if (handledResponseIdRef.current === id) return;
      handledResponseIdRef.current = id;
      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      openFromNotificationData(data);
    },
    []
  );

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (user) => {
      setUid(user?.uid ?? null);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      requestNotificationPermissions().catch(() => undefined);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!uid) {
      clearAppIconBadge().catch(() => undefined);
      return;
    }

    const timer = setTimeout(() => {
      setupNotifications().catch(() => undefined);
    }, 1200);

    return () => clearTimeout(timer);
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    let isMounted = true;

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!isMounted || !response) return;
        routeFromNotificationResponse(response);
      })
      .catch(() => undefined);

    const received = Notifications.addNotificationReceivedListener(() => {
      if (!firebaseAuth.currentUser) {
        clearAppIconBadge().catch(() => undefined);
      }
    });
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        routeFromNotificationResponse(response);
      });

    return () => {
      isMounted = false;
      received.remove();
      responseListener.current?.remove();
      responseListener.current = null;
    };
  }, [uid, routeFromNotificationResponse]);
}
