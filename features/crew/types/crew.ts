import type { StatusTone } from "@/features/common/data/demo";
import type { MediaStatus } from "@/features/common/media/mediaStatus";

/**
 * Certificate on a crew member profile.
 */
export type CrewCertificate = {
  id: string;
  title: string;
  expires: string;
  tone: StatusTone;
  hasAttachment?: boolean;
  type?: string;
  issueDate?: string;
  expiresIso?: string | null;
};

/**
 * Crew member row / detail (prototype screens 19–21).
 * Loaded from `users/{uid}/crew/{id}`.
 */
export type CrewMember = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  tone: StatusTone;
  medicalLabel: string;
  certificates: CrewCertificate[];
  localUri?: string | null;
  downloadURL?: string | null;
  thumbURL?: string | null;
  storagePath?: string | null;
  mediaStatus?: MediaStatus;
};

/**
 * Builds two-letter initials for a crew avatar.
 * @param name - Full crew member name
 * @returns Uppercase initials (max 2 chars)
 */
export function getCrewInitials(name: string): string {
  return name
    .replace(/^Capt\.\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
