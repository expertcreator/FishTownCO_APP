import { signOut } from "@react-native-firebase/auth";
import { firebaseAuth } from "@/features/common/firebase";
import { getAuthErrorCode } from "@/features/auth/utils/mapAuthError";

/**
 * Signs the current user out of Firebase Auth.
 * Already-signed-out is treated as success (`auth/no-current-user`).
 * @returns Promise that resolves when sign-out completes
 * @throws {Error} When Firebase Auth sign-out fails for another reason
 */
export async function logout(): Promise<void> {
  const currentUser = firebaseAuth.currentUser;

  if (!currentUser) {
    
    return;
  }

  try {
    await signOut(firebaseAuth);
    
  } catch (error) {
    const code = getAuthErrorCode(error);
    if (code === "auth/no-current-user") {
      
      return;
    }

    throw error;
  }
}
