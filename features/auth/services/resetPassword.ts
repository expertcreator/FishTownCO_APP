import { sendPasswordResetEmail } from "@react-native-firebase/auth";
import { firebaseAuth } from "@/features/common/firebase";
import { getAuthErrorCode } from "@/features/auth/utils/mapAuthError";

export type ResetPasswordInput = {
  email: string;
};

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
 * Sends a Firebase Auth password-reset email for the given address.
 * Missing accounts are treated as success so we do not reveal whether the email exists.
 * @param input - Account email
 * @returns Promise that resolves when the reset email request finishes
 * @throws {Error} When Firebase Auth rejects the request for another reason
 */
export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const email = input.email.trim().toLowerCase();

  console.log("[resetPassword] start", {
    email,
    currentUser: firebaseAuth.currentUser?.uid ?? null,
  });

  try {
    await sendPasswordResetEmail(firebaseAuth, email);
    console.log("[resetPassword] success", { email });
  } catch (error) {
    const code = getAuthErrorCode(error);
    // Avoid email enumeration: same UX whether the user exists or not.
    if (code === "auth/user-not-found") {
      console.log("[resetPassword] no matching user — treated as success", {
        email,
      });
      return;
    }
    console.error("[resetPassword] failed", serializeError(error));
    console.error("[resetPassword] raw error", error);
    throw error;
  }
}
