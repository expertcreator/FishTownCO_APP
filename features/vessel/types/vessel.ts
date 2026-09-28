/**
 * Vessel profile stored at `users/{uid}/vessel/profile`.
 */
export type VesselProfile = {
  name: string;
  type: string;
  length: string;
  homePort: string;
  mmsi: string;
  tonnage: string;
  flag: string;
  callSign: string;
  registrationNo: string;
  usage: string;
  yearBuilt: string;
  skipper: string;
  engineHours: string;
  nextServiceIn: string;
  /** Firebase Storage download URL for the vessel hero photo. */
  photoUrl: string;
  /** Optional compressed thumb URL for lists. */
  photoThumbUrl: string;
  /** Uploaded vessel document download URL. */
  documentUrl: string;
  /** Original file name for the vessel document. */
  documentName: string;
  /** Storage path for the vessel document. */
  documentStoragePath: string;
  /** Selected build-checklist item ids from prototype screen 9. */
  checklistIds: string[];
};

/**
 * Payload accepted when creating or updating a vessel profile.
 */
export type VesselProfileInput = {
  name: string;
  type: string;
  length: string;
  homePort: string;
  mmsi: string;
  tonnage?: string;
  flag?: string;
  callSign?: string;
  registrationNo?: string;
  usage?: string;
  yearBuilt?: string;
  skipper?: string;
  engineHours?: string;
  nextServiceIn?: string;
  photoUrl?: string;
  photoThumbUrl?: string;
  documentUrl?: string | null;
  documentName?: string | null;
  documentStoragePath?: string | null;
};

/**
 * Builds a display chip like `42 ft / 12.8 m Fishing Vessel`.
 * @param vessel - Vessel profile
 * @returns Length + type label
 */
export function getVesselLengthLabel(vessel: VesselProfile): string {
  const length = vessel.length.trim();
  const type = vessel.type.trim();
  if (length && type) return `${length} ${type}`;
  return length || type || "—";
}
