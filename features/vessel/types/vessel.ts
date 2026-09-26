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
