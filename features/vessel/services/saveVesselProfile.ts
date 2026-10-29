import { doc, serverTimestamp, setDoc } from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { VESSEL_QUERY_KEY } from "@/features/vessel/hooks/useVesselProfile";
import { VESSEL_DOC_ID } from "@/features/vessel/services/fetchVesselProfile";
import type { VesselProfile, VesselProfileInput } from "@/features/vessel/types/vessel";

/**
 * Creates or merges the signed-in user's vessel profile in Firestore.
 * Path: `users/{uid}/vessel/profile`.
 * @param input - Vessel fields to save
 * @param options - Set `isNew` when this is the first save so createdAt is written
 * @returns Saved document path
 * @throws {Error} When signed out or the Firestore write fails
 */
export async function saveVesselProfile(
  input: VesselProfileInput,
  options?: { isNew?: boolean }
): Promise<{ path: string }> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const path = `users/${user.uid}/vessel/${VESSEL_DOC_ID}`;
  const ref = doc(firebaseFirestore, "users", user.uid, "vessel", VESSEL_DOC_ID);

  try {
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
    if (input.documentUrl !== undefined) {
      payload.documentUrl = input.documentUrl?.trim() || null;
      payload.documentName = input.documentName?.trim() || null;
      payload.documentStoragePath = input.documentStoragePath?.trim() || null;
    }
    if (options?.isNew) {
      payload.createdAt = serverTimestamp();
    }

    await setDoc(ref, payload, { merge: true });

    const text = (value?: string | null) => value?.trim() ?? "";
    queryClient.setQueryData<VesselProfile | null>(
      [...VESSEL_QUERY_KEY, user.uid],
      (current) => ({
        name: text(input.name),
        type: text(input.type),
        length: text(input.length),
        homePort: text(input.homePort),
        mmsi: text(input.mmsi),
        tonnage: text(input.tonnage ?? current?.tonnage),
        flag: text(input.flag ?? current?.flag),
        callSign: text(input.callSign ?? current?.callSign),
        registrationNo: text(input.registrationNo ?? current?.registrationNo),
        usage: text(input.usage ?? current?.usage),
        yearBuilt: text(input.yearBuilt ?? current?.yearBuilt),
        skipper: text(input.skipper ?? current?.skipper),
        engineHours: text(input.engineHours ?? current?.engineHours),
        nextServiceIn: text(input.nextServiceIn ?? current?.nextServiceIn),
        photoUrl: text(input.photoUrl ?? current?.photoUrl),
        photoThumbUrl: text(input.photoThumbUrl ?? current?.photoThumbUrl),
        documentUrl: text(
          input.documentUrl === undefined ? current?.documentUrl : input.documentUrl
        ),
        documentName: text(
          input.documentName === undefined ? current?.documentName : input.documentName
        ),
        documentStoragePath: text(
          input.documentStoragePath === undefined
            ? current?.documentStoragePath
            : input.documentStoragePath
        ),
        checklistIds: current?.checklistIds ?? [],
      })
    );
    void queryClient.invalidateQueries({ queryKey: VESSEL_QUERY_KEY });
    return { path };
  } catch (error) {

    throw error;
  }
}
