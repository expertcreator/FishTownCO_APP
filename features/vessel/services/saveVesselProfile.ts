import {
  doc,
  getDoc,
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
import type { VesselProfileInput } from "@/features/vessel/types/vessel";

/**
 * Creates or merges the signed-in user's vessel profile in Firestore.
 * Path: `users/{uid}/vessel/profile`.
 * @param input - Vessel fields to save
 * @returns Saved document path
 * @throws {Error} When signed out or the Firestore write fails
 */
export async function saveVesselProfile(
  input: VesselProfileInput
): Promise<{ path: string }> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const path = `users/${user.uid}/vessel/${VESSEL_DOC_ID}`;
  const ref = doc(firebaseFirestore, "users", user.uid, "vessel", VESSEL_DOC_ID);
  console.log("[saveVesselProfile] start", {
    path,
    name: input.name,
    type: input.type,
  });

  try {
    const existing = await getDoc(ref);
    const payload: Record<string, unknown> = {
      name: input.name.trim(),
      type: input.type.trim(),
      length: input.length.trim(),
      homePort: input.homePort.trim(),
      mmsi: input.mmsi.trim(),
      tonnage: input.tonnage?.trim() || null,
      flag: input.flag?.trim() || null,
      callSign: input.callSign?.trim() || null,
      registrationNo: input.registrationNo?.trim() || null,
      usage: input.usage?.trim() || null,
      yearBuilt: input.yearBuilt?.trim() || null,
      skipper: input.skipper?.trim() || null,
      engineHours: input.engineHours?.trim() || null,
      nextServiceIn: input.nextServiceIn?.trim() || null,
      photoUrl: input.photoUrl?.trim() || null,
      photoThumbUrl: input.photoThumbUrl?.trim() || null,
      updatedAt: serverTimestamp(),
    };
    if (!existing.exists()) {
      payload.createdAt = serverTimestamp();
    }

    await setDoc(ref, payload, { merge: true });

    console.log("[saveVesselProfile] success", { path });
    await queryClient.invalidateQueries({ queryKey: VESSEL_QUERY_KEY });
    return { path };
  } catch (error) {
    console.error("[saveVesselProfile] failed", {
      path,
      code: (error as { code?: string })?.code,
      message: (error as { message?: string })?.message,
      error,
    });
    throw error;
  }
}
