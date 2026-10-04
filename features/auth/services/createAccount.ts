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
 * Creates a Firebase Auth user and writes their profile doc at `users/{uid}`.
 * Leaves the new user signed in so they can continue into vessel setup.
 * @param input - Display name, email, and password
 * @returns Created user ids and profile fields
 * @throws {Error} When Auth or Firestore write fails (Firebase error `code` preserved when present)
 */
export async function createAccount(
  input: CreateAccountInput
): Promise<CreateAccountResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email,
    input.password
  );
  const user = credential.user;
  await updateProfile(user, { displayName: name });
  const path = userPath(user.uid);
  await setDoc(doc(firebaseFirestore, path), {
    name,
    email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    uid: user.uid,
    email: user.email ?? email,
    name,
  };
}
