import { sendPasswordResetEmail } from "@react-native-firebase/auth";
import { firebaseAuth } from "@/features/common/firebase";
import { getAuthErrorCode } from "@/features/auth/utils/mapAuthError";

export type ResetPasswordInput = {
  email: string;
};

/**
 * Sends a Firebase Auth password-reset email for the given address.
 * Missing accounts are treated as success so we do not reveal whether the email exists.
 * @param input - Account email
 * @returns Promise that resolves when the reset email request finishes
 * @throws {Error} When Firebase Auth rejects the request for another reason
 */
export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const email = input.email.trim().toLowerCase();

  try {
    await sendPasswordResetEmail(firebaseAuth, email);
    
  } catch (error) {
    const code = getAuthErrorCode(error);
    // Avoid email enumeration: same UX whether the user exists or not.
    if (code === "auth/user-not-found") {
      
      return;
    }

    throw error;
  }
}
