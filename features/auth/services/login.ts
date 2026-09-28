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
 * Signs in with email and password via Firebase Auth.
 * @param input - Email and password
 * @returns Signed-in user uid and email
 * @throws {Error} When Firebase Auth sign-in fails
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    email,
    input.password
  );
  const user = credential.user;
  return {
    uid: user.uid,
    email: user.email ?? email,
  };
}
