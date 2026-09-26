import type { QueryDocumentSnapshot } from "@react-native-firebase/firestore";
import type { StatusTone } from "@/features/common/data/demo";
import type {
  CrewCertificate,
  CrewMember,
} from "@/features/crew/types/crew";
import {
  formatSafetyDueDateLong,
  parseSafetyDueDate,
} from "@/features/safety/utils/formatSafetyDueDate";
import {
  getSafetyStatusLabel,
  getSafetyTone,
} from "@/features/safety/utils/safetyStatus";

/**
 * Picks the worse of two status tones for list / member rollup.
 * @param a - First tone
 * @param b - Second tone
 * @returns Worse tone (overdue > due > ok)
 */
export function worseTone(a: StatusTone, b: StatusTone): StatusTone {
  const rank = (tone: StatusTone) => {
    if (tone === "overdue") return 3;
    if (tone === "due") return 2;
    if (tone === "ok") return 1;
    return 0;
  };
  return rank(a) >= rank(b) ? a : b;
}

/**
 * Builds the ENG1 / medical line shown on crew list cards.
 * @param certificates - Member certificates
 * @returns Medical label string
 */
export function buildMedicalLabel(certificates: CrewCertificate[]): string {
  const medical =
    certificates.find((c) => {
      const hay = `${c.type ?? ""} ${c.title}`.toLowerCase();
      return hay.includes("medical") || hay.includes("eng1");
    }) ?? certificates[0];

  if (!medical) return "No medical on file";

  const prefix =
    `${medical.type ?? ""} ${medical.title}`.toLowerCase().includes("eng1") ||
    medical.title.toLowerCase().includes("medical")
      ? "ENG1 Medical"
      : medical.title;

  const expired = medical.tone === "overdue";
  return expired
    ? `${prefix}: ${medical.expires} (Expired)`
    : `${prefix}: ${medical.expires}`;
}

/**
 * Maps a raw Firestore certificate object into the app model.
 * @param raw - Raw certificate map from Firestore
 * @param index - Index used when id is missing
 * @returns Normalized certificate
 */
export function mapCrewCertificate(
  raw: Record<string, unknown>,
  index: number
): CrewCertificate {
  const type = String(raw.type ?? "").trim();
  const title =
    String(raw.title ?? "").trim() || type || `Certificate ${index + 1}`;
  const expiryRaw = String(
    raw.expiryDateIso ?? raw.expiryDate ?? raw.expires ?? ""
  );
  const parsed =
    parseSafetyDueDate(expiryRaw) ??
    (typeof raw.expiryDateIso === "string"
      ? new Date(raw.expiryDateIso)
      : null);
  const expiryDate =
    parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  const tone = expiryDate ? getSafetyTone(expiryDate) : "ok";
  const resolvedTone = tone === "info" ? "ok" : tone;

  return {
    id: String(raw.id ?? `cert-${index}`),
    title,
    type: type || title,
    expires: expiryDate
      ? formatSafetyDueDateLong(expiryDate)
      : String(raw.expiryDate ?? raw.expires ?? "—"),
    expiresIso: expiryDate ? expiryDate.toISOString() : null,
    issueDate: raw.issueDate ? String(raw.issueDate) : undefined,
    tone: resolvedTone,
    hasAttachment: Boolean(
      raw.hasAttachment || raw.downloadURL || raw.localUri || raw.thumbURL
    ),
    localUri: raw.localUri ? String(raw.localUri) : null,
    downloadURL: raw.downloadURL ? String(raw.downloadURL) : null,
    thumbURL: raw.thumbURL ? String(raw.thumbURL) : null,
    storagePath: raw.storagePath ? String(raw.storagePath) : null,
    mediaStatus:
      (raw.mediaStatus as CrewCertificate["mediaStatus"]) ??
      (raw.downloadURL ? "ready" : raw.localUri ? "pending" : "none"),
  };
}

/**
 * Maps a Firestore crew document into the list / detail model.
 * @param docSnap - Firestore document snapshot
 * @returns Crew member for UI
 */
export function mapCrewMemberDoc(
  docSnap: QueryDocumentSnapshot
): CrewMember {
  const data = docSnap.data() as Record<string, unknown>;
  const rawCerts = Array.isArray(data.certificates)
    ? (data.certificates as Record<string, unknown>[])
    : [];
  const certificates = rawCerts.map((c, i) => mapCrewCertificate(c, i));

  let tone: StatusTone = "ok";
  for (const cert of certificates) {
    tone = worseTone(tone, cert.tone);
  }

  return {
    id: docSnap.id,
    name: String(data.name ?? "").trim() || "Unnamed crew",
    role: String(data.role ?? "").trim(),
    phone: String(data.phone ?? "").trim(),
    email: String(data.email ?? "").trim(),
    tone,
    medicalLabel: buildMedicalLabel(certificates),
    certificates,
    localUri: data.localUri ? String(data.localUri) : null,
    downloadURL: data.downloadURL ? String(data.downloadURL) : null,
    thumbURL: data.thumbURL ? String(data.thumbURL) : null,
    storagePath: data.storagePath ? String(data.storagePath) : null,
    mediaStatus:
      (data.mediaStatus as CrewMember["mediaStatus"]) ??
      (data.downloadURL ? "ready" : data.localUri ? "pending" : "none"),
  };
}

/**
 * Builds the short status label for a tone (used by tests / helpers).
 * @param tone - Status tone
 * @returns Overdue / Due soon / OK
 */
export function crewToneLabel(tone: StatusTone): string {
  return getSafetyStatusLabel(tone === "info" ? "ok" : tone);
}
