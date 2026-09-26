import { doc, getDoc } from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
} from "@/features/common/firebase";
import type { VesselProfile } from "@/features/vessel/types/vessel";

export const VESSEL_DOC_ID = "profile";

/**
 * Builds the Firestore path for the signed-in user's vessel profile doc.
 * @param uid - Firebase Auth uid
 * @returns Path like `users/{uid}/vessel/profile`
 */
export function vesselProfilePath(uid: string): string {
  return `users/${uid}/vessel/${VESSEL_DOC_ID}`;
}

/**
 * Maps a Firestore vessel document into the app model.
 * @param data - Raw Firestore data
 * @returns Normalized vessel profile
 */
export function mapVesselProfile(
  data: Record<string, unknown>
): VesselProfile {
  return {
    name: String(data.name ?? "").trim(),
    type: String(data.type ?? "").trim(),
    length: String(data.length ?? "").trim(),
    homePort: String(data.homePort ?? "").trim(),
    mmsi: String(data.mmsi ?? "").trim(),
    tonnage: String(data.tonnage ?? "").trim(),
    flag: String(data.flag ?? "").trim(),
    callSign: String(data.callSign ?? "").trim(),
    registrationNo: String(
      data.registrationNo ?? data.officialRegistrationNo ?? ""
    ).trim(),
    usage: String(data.usage ?? "").trim(),
    yearBuilt: String(data.yearBuilt ?? "").trim(),
    skipper: String(data.skipper ?? "").trim(),
    engineHours: String(data.engineHours ?? "").trim(),
    nextServiceIn: String(data.nextServiceIn ?? "").trim(),
    checklistIds: Array.isArray(data.checklistIds)
      ? data.checklistIds.map((id) => String(id)).filter(Boolean)
      : [],
  };
}

/**
 * Loads the signed-in user's vessel profile from Firestore.
 * @returns Vessel profile, or null when missing
 * @throws {Error} When signed out or the Firestore read fails
 */
export async function fetchVesselProfile(): Promise<VesselProfile | null> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  console.log("[fetchVesselProfile] start", { uid: user.uid });
  const snap = await getDoc(
    doc(firebaseFirestore, "users", user.uid, "vessel", VESSEL_DOC_ID)
  );

  if (!snap.exists()) {
    console.log("[fetchVesselProfile] missing");
    return null;
  }

  const profile = mapVesselProfile(snap.data() as Record<string, unknown>);
  console.log("[fetchVesselProfile] success", { name: profile.name });
  return profile;
}
