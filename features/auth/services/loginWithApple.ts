import appleAuth from "@invertase/react-native-apple-authentication";
import {
  AppleAuthProvider,
  signInWithCredential,
  updateProfile,
} from "@react-native-firebase/auth";
import { Platform } from "react-native";
import { firebaseAuth } from "@/features/common/firebase";
import { ensureUserProfile } from "@/features/auth/services/ensureUserProfile";
import type { SocialLoginResult } from "@/features/auth/services/loginWithGoogle";
import { isNewAuthUser } from "@/features/auth/utils/isNewAuthUser";

/**
 * Signs in with Apple via native Apple Auth + Firebase Auth credential.
 * iOS only.
 * @returns Signed-in user uid and email
 * @throws {Error} When unavailable, cancelled (`APPLE_SIGNIN_CANCELLED`), or sign-in fails
 */
export async function loginWithApple(): Promise<SocialLoginResult> {
  if (Platform.OS !== "ios") {
    throw new Error("APPLE_SIGNIN_UNSUPPORTED");
  }
  if (!appleAuth.isSupported) {
    throw new Error("APPLE_SIGNIN_UNSUPPORTED");
  }

  try {
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    const { identityToken, nonce } = appleAuthRequestResponse;
    if (!identityToken) {
      throw new Error("APPLE_SIGNIN_NO_TOKEN");
    }

    const credential = AppleAuthProvider.credential(identityToken, nonce);
    const result = await signInWithCredential(firebaseAuth, credential);

    const displayName = [
      appleAuthRequestResponse.fullName?.givenName,
      appleAuthRequestResponse.fullName?.familyName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (displayName && !result.user.displayName) {
      try {
        await updateProfile(result.user, { displayName });
      } catch {

      }
    }

    await ensureUserProfile();

    return {
      uid: result.user.uid,
      email: result.user.email,
      isNewUser: isNewAuthUser(result.user),
    };
  } catch (error) {
    const code = (error as { code?: string | number })?.code;
    if (
      code === appleAuth.Error.CANCELED ||
      code === "1001" ||
      (error instanceof Error && error.message === "APPLE_SIGNIN_CANCELLED")
    ) {
      throw new Error("APPLE_SIGNIN_CANCELLED");
    }

    throw error;
  }
}
