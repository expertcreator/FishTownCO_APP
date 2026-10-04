import {
  GoogleAuthProvider,
  signInWithCredential,
} from "@react-native-firebase/auth";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";
import { firebaseAuth } from "@/features/common/firebase";
import { ensureUserProfile } from "@/features/auth/services/ensureUserProfile";
import { configureGoogleSignIn } from "@/features/auth/utils/configureGoogleSignIn";
import { isNewAuthUser } from "@/features/auth/utils/isNewAuthUser";

export type SocialLoginResult = {
  uid: string;
  email: string | null;
  /** True when this sign-in created the Firebase account. */
  isNewUser: boolean;
};

/**
 * Signs in with Google via native Google Sign-In + Firebase Auth credential.
 * @returns Signed-in user uid and email
 * @throws {Error} When cancelled (`GOOGLE_SIGNIN_CANCELLED`) or sign-in fails
 */
export async function loginWithGoogle(): Promise<SocialLoginResult> {
  configureGoogleSignIn();

  try {
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }

    const signInResult = await GoogleSignin.signIn();
    if (!isSuccessResponse(signInResult)) {
      throw new Error("GOOGLE_SIGNIN_CANCELLED");
    }

    let idToken =
      signInResult.data?.idToken ??
      (signInResult as { idToken?: string | null }).idToken ??
      null;

    if (!idToken) {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken ?? null;
    }

    if (!idToken) {
      throw new Error("GOOGLE_SIGNIN_NO_TOKEN");
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(firebaseAuth, credential);
    await ensureUserProfile();

    return {
      uid: result.user.uid,
      email: result.user.email,
      isNewUser: isNewAuthUser(result.user),
    };
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (
      code === "SIGN_IN_CANCELLED" ||
      code === "12501" ||
      (error instanceof Error && error.message === "GOOGLE_SIGNIN_CANCELLED")
    ) {
      throw new Error("GOOGLE_SIGNIN_CANCELLED");
    }

    throw error;
  }
}
