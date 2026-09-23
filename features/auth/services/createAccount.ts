import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "@react-native-firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";
import {
  firebaseAuth,
  firebaseFirestore,
  userPath,
} from "@/features/common/firebase";

export type CreateAccountInput = {
  name: string;
  email: string;
  password: string;
};

export type CreateAccountResult = {
  uid: string;
  email: string;
  name: string;
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
    userInfo: e.userInfo,
    stack: e.stack,
  };
}

/**
 * Creates a Firebase Auth user and writes their profile doc at `users/{uid}`.
 * @param input - Display name, email, and password
 * @returns Created user ids and profile fields
 * @throws {Error} When Auth or Firestore write fails (Firebase error `code` preserved when present)
 */
export async function createAccount(
  input: CreateAccountInput
): Promise<CreateAccountResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  console.log("[createAccount] start", {
    name,
    email,
    passwordLength: input.password.length,
    hasAuth: Boolean(firebaseAuth),
    hasFirestore: Boolean(firebaseFirestore),
    currentUser: firebaseAuth.currentUser?.uid ?? null,
  });

  try {
    console.log("[createAccount] step: createUserWithEmailAndPassword");
    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      email,
      input.password
    );
    const user = credential.user;
    console.log("[createAccount] auth user created", {
      uid: user.uid,
      email: user.email,
    });

    console.log("[createAccount] step: updateProfile");
    await updateProfile(user, { displayName: name });
    console.log("[createAccount] profile displayName updated");

    const path = userPath(user.uid);
    console.log("[createAccount] step: setDoc", { path });
    await setDoc(doc(firebaseFirestore, path), {
      name,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log("[createAccount] firestore profile written", { path });

    return {
      uid: user.uid,
      email: user.email ?? email,
      name,
    };
  } catch (error) {
    console.error("[createAccount] failed", serializeError(error));
    console.error("[createAccount] raw error", error);
    throw error;
  }
}
