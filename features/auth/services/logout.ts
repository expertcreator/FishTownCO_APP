import { signOut } from "@react-native-firebase/auth";
import { firebaseAuth } from "@/features/common/firebase";
import { getAuthErrorCode } from "@/features/auth/utils/mapAuthError";

/**
 * Serializes an unknown error for Metro / device logs.
 * @param error - Thrown value
 * @returns Plain object safe to log
 */
function serializeError(error: unknown): Record<string, unknown> {
  if (typeof error !== "object" || error === null) {
    return { value: String(error) };
  }
  const e = error as Record<string, unknown>;
  return {
    name: e.name,
    code: e.code,
    message: e.message,
    nativeErrorCode: e.nativeErrorCode,
    nativeErrorMessage: e.nativeErrorMessage,
    stack: e.stack,
  };
}

/**
 * Signs the current user out of Firebase Auth.
 * Already-signed-out is treated as success (`auth/no-current-user`).
 * @returns Promise that resolves when sign-out completes
 * @throws {Error} When Firebase Auth sign-out fails for another reason
 */
export async function logout(): Promise<void> {
  const currentUser = firebaseAuth.currentUser;
  console.log("[logout] start", {
    hasAuth: Boolean(firebaseAuth),
    uid: currentUser?.uid ?? null,
    email: currentUser?.email ?? null,
  });

  if (!currentUser) {
    console.log("[logout] skipped — no current user (already signed out)");
    return;
  }

  try {
    await signOut(firebaseAuth);
    console.log("[logout] success", {
      currentUserAfter: firebaseAuth.currentUser?.uid ?? null,
    });
  } catch (error) {
    const code = getAuthErrorCode(error);
    if (code === "auth/no-current-user") {
      console.log("[logout] treated as success", { code });
      return;
    }
    console.error("[logout] failed", serializeError(error));
    console.error("[logout] raw error", error);
    throw error;
  }
}
