import { Platform } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

/**
 * Web OAuth client from `google-services.json` (`client_type: 3`).
 * Used by Google Sign-In on Android to return an ID token Firebase accepts.
 */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  "687496220200-pkpn76udifim9j3kojekp45h2lgku84o.apps.googleusercontent.com";

let configured = false;

/**
 * Configures Google Sign-In for Android. Safe to call more than once.
 * @returns void
 */
export function configureGoogleSignIn(): void {
  if (configured || Platform.OS !== "android") {
    return;
  }

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
    scopes: ["profile", "email"],
  });
  configured = true;
}
