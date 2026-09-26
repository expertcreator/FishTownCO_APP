import { signInWithEmailAndPassword } from "@react-native-firebase/auth";
import { firebaseAuth } from "@/features/common/firebase";

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = {
  uid: string;
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
 * Signs in with email and password via Firebase Auth.
 * @param input - Email and password
 * @returns Signed-in user uid and email
 * @throws {Error} When Firebase Auth sign-in fails
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();

  console.log("[login] start", {
    email,
    passwordLength: input.password.length,
    currentUser: firebaseAuth.currentUser?.uid ?? null,
  });

  try {
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      email,
      input.password
    );
    const user = credential.user;
    console.log("[login] success", {
      uid: user.uid,
      email: user.email,
    });
    return {
      uid: user.uid,
      email: user.email ?? email,
    };
  } catch (error) {
    console.error("[login] failed", serializeError(error));
    console.error("[login] raw error", error);
    throw error;
  }
}
