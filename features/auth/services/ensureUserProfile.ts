import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";
import {
  firebaseAuth,
  firebaseFirestore,
  userPath,
} from "@/features/common/firebase";

/**
 * Ensures a Firestore profile exists for the signed-in Firebase user.
 * Creates a minimal `users/{uid}` doc when missing (social first login).
 * @returns Profile path
 * @throws {Error} When signed out or the Firestore write fails
 */
export async function ensureUserProfile(): Promise<{ path: string }> {
  const user = firebaseAuth.currentUser;
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const path = userPath(user.uid);
  const ref = doc(firebaseFirestore, path);
  const existing = await getDoc(ref);

  if (existing.exists()) {
    return { path };
  }

  const email = (user.email ?? "").trim().toLowerCase();
  const name =
    user.displayName?.trim() ||
    (email.includes("@") ? email.split("@")[0] : "") ||
    "Skipper";

  console.log("[ensureUserProfile] creating", { path, name, email });
  await setDoc(ref, {
    name,
    email: email || null,
    providerIds: user.providerData.map((p) => p.providerId),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { path };
}
