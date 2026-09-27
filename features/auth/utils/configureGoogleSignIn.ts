import { Platform } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

/**
 * Web OAuth client from `google-services.json` (`client_type: 3`).
 * Required so Google Sign-In returns an ID token Firebase accepts.
 */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  "687496220200-pkpn76udifim9j3kojekp45h2lgku84o.apps.googleusercontent.com";

/** Optional iOS OAuth client from Google Cloud / Firebase. */
export const GOOGLE_IOS_CLIENT_ID = (
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? ""
).trim();

let configured = false;

/**
 * Configures Google Sign-In for the current platform. Safe to call more than once.
 * @returns void
 */
export function configureGoogleSignIn(): void {
  if (configured) {
    return;
  }

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    ...(Platform.OS === "ios" && GOOGLE_IOS_CLIENT_ID
      ? { iosClientId: GOOGLE_IOS_CLIENT_ID }
      : {}),
    offlineAccess: false,
    scopes: ["profile", "email"],
  });
  configured = true;
}
