import {
  doc,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { VESSEL_QUERY_KEY } from "@/features/vessel/hooks/useVesselProfile";
import { VESSEL_DOC_ID } from "@/features/vessel/services/fetchVesselProfile";

/**
 * Saves the selected build-checklist item ids onto the vessel profile.
 * Path: `users/{uid}/vessel/profile`.
 * @param checklistIds - Selected catalog item ids
 * @returns Saved document path
 * @throws {Error} When signed out or the Firestore write fails
 */
export async function saveVesselChecklist(
  checklistIds: string[]
): Promise<{ path: string }> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const path = `users/${user.uid}/vessel/${VESSEL_DOC_ID}`;
  const uniqueIds = [...new Set(checklistIds.map((id) => id.trim()).filter(Boolean))];

  try {
    await setDoc(
      doc(firebaseFirestore, "users", user.uid, "vessel", VESSEL_DOC_ID),
      {
        checklistIds: uniqueIds,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await queryClient.invalidateQueries({ queryKey: VESSEL_QUERY_KEY });
    return { path };
  } catch (error) {

    throw error;
  }
}
