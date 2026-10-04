import { deleteUser } from "@react-native-firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "@react-native-firebase/firestore";
import {
  firebaseAuth,
  firebaseFirestore,
  queryClient,
} from "@/features/common/firebase";

const USER_COLLECTIONS = ["safety", "wallet", "crew", "billing"] as const;

/**
 * Deletes the signed-in Firebase account and the user's Firestore records.
 * @returns Promise that resolves when the auth user is deleted
 * @throws {Error} When no user is signed in, or Firebase Auth rejects the delete
 */
export async function deleteAccount(): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user) {
    throw new Error("NOT_SIGNED_IN");
  }

  const uid = user.uid;
  try {
    await wipeUserData(uid);
  } catch {
    // Auth deletion still runs when a Firestore record is already gone.
  }
  await deleteUser(user);
  queryClient.clear();
}

/**
 * Removes the signed-in user's known Firestore documents.
 * @param uid - Firebase user id
 * @returns Promise that resolves when the writes finish
 */
async function wipeUserData(uid: string): Promise<void> {
  await Promise.all(
    USER_COLLECTIONS.map(async (name) => {
      const snapshot = await getDocs(
        collection(firebaseFirestore, "users", uid, name)
      );
      await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
    })
  );
  await deleteDoc(doc(firebaseFirestore, "users", uid, "vessel", "profile"));
  await deleteDoc(doc(firebaseFirestore, "users", uid));
}
