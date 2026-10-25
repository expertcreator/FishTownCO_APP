import appleAuth from "@invertase/react-native-apple-authentication";
import { Platform } from "react-native";
import { firebaseAuth } from "@/features/common/firebase";

type AppleRevokeUser = {
  providerData: ReadonlyArray<{ providerId: string }>;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
};

const FUNCTION_BASE = "https://europe-west2-fishtownco-5093a.cloudfunctions.net";

/**
 * Sends the Apple authorization code to the server so it can keep a refresh token.
 * Sign-in still succeeds when the server has not been published yet.
 * @param authorizationCode - Code from the native Apple sign-in response
 * @returns Promise that resolves when the store attempt finishes
 */
export async function storeAppleAuthorizationCode(
  authorizationCode: string
): Promise<void> {
  const token = await currentIdToken();
  if (!token) return;
  const response = await fetch(`${FUNCTION_BASE}/storeAppleRefreshToken`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authorizationCode }),
  });
  if (!response.ok) {
    throw new Error("APPLE_TOKEN_STORE_FAILED");
  }
}

/**
 * Revokes Sign in with Apple before the Firebase account is deleted.
 * Email and Google accounts are left unchanged. An Apple account with no
 * stored token asks the device for a fresh authorization code first.
 * @param user - Signed-in Firebase user
 * @returns Promise that resolves when Apple has revoked the token, or the account is not Apple
 * @throws {Error} When Apple revocation fails or the user cancels the Apple prompt
 */
export async function revokeAppleSignInIfNeeded(
  user: AppleRevokeUser
): Promise<void> {
  const usesApple = user.providerData.some(
    (provider) => provider.providerId === "apple.com"
  );
  if (!usesApple) return;

  const idToken = await user.getIdToken();
  const stored = await postRevoke(idToken);
  if (stored.ok) return;
  if (stored.error !== "APPLE_TOKEN_MISSING" || Platform.OS !== "ios") {
    throw new Error(stored.error || "APPLE_REVOKE_FAILED");
  }

  const authorizationCode = await requestAppleAuthorizationCode();
  const refreshed = await postRevoke(idToken, authorizationCode);
  if (!refreshed.ok) {
    throw new Error(refreshed.error || "APPLE_REVOKE_FAILED");
  }
}

/**
 * Asks Apple for a new authorization code on this iPhone.
 * @returns Authorization code
 * @throws {Error} When Apple sign-in is cancelled or returns no code
 */
async function requestAppleAuthorizationCode(): Promise<string> {
  if (!appleAuth.isSupported) {
    throw new Error("APPLE_REVOKE_FAILED");
  }
  try {
    const response = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });
    const code = response.authorizationCode?.trim() ?? "";
    if (!code) {
      throw new Error("APPLE_CODE_MISSING");
    }
    return code;
  } catch (error) {
    const code = (error as { code?: string | number })?.code;
    if (
      code === appleAuth.Error.CANCELED ||
      code === "1001" ||
      (error instanceof Error && error.message === "APPLE_SIGNIN_CANCELLED")
    ) {
      throw new Error("APPLE_SIGNIN_CANCELLED");
    }
    if (error instanceof Error && error.message === "APPLE_CODE_MISSING") {
      throw error;
    }
    throw new Error("APPLE_REVOKE_FAILED");
  }
}

/**
 * Calls the revoke function with the current Firebase ID token.
 * @param idToken - Firebase ID token
 * @param authorizationCode - Fresh Apple code, when a stored token is missing
 * @returns Whether Apple accepted the revoke
 */
async function postRevoke(
  idToken: string,
  authorizationCode?: string
): Promise<{ ok: boolean; error: string }> {
  const response = await fetch(`${FUNCTION_BASE}/revokeAppleToken`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(authorizationCode ? { authorizationCode } : {}),
  });
  if (response.ok) return { ok: true, error: "" };
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return { ok: false, error: payload?.error || "APPLE_REVOKE_FAILED" };
}

/**
 * Reads an ID token for the signed-in user.
 * @returns ID token, or null when signed out
 */
async function currentIdToken(): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
