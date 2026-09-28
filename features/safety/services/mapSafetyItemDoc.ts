import type { QueryDocumentSnapshot } from "@react-native-firebase/firestore";
import type { SafetyItem } from "@/features/safety/types/safetyItem";
import {
  formatSafetyDueDateLong,
  parseSafetyDueDate,
} from "@/features/safety/utils/formatSafetyDueDate";
import {
  getSafetyStatusLabel,
  getSafetyTone,
} from "@/features/safety/utils/safetyStatus";

/**
 * Maps a Firestore safety document into the Safety list model.
 * @param docSnap - Firestore document snapshot
 * @returns Safety item for list / detail UI
 */
export function mapSafetyItemDoc(
  docSnap: QueryDocumentSnapshot
): SafetyItem {
  const data = docSnap.data() as Record<string, unknown>;
  const name = String(data.name ?? "").trim() || "Untitled item";
  const category = String(data.itemType ?? data.category ?? "").trim();
  const location = String(
    data.locationAboard ?? data.location ?? ""
  ).trim();
  const dueRaw = String(data.dueDateIso ?? data.nextDueDate ?? data.dueDate ?? "");
  const dueParsed =
    parseSafetyDueDate(dueRaw) ??
    (typeof data.dueDateIso === "string"
      ? new Date(data.dueDateIso)
      : null);
  const dueDateObj =
    dueParsed && !Number.isNaN(dueParsed.getTime()) ? dueParsed : null;
  const tone = dueDateObj ? getSafetyTone(dueDateObj) : "info";
  const status = getSafetyStatusLabel(tone === "info" ? "ok" : tone);
  const resolvedTone = tone === "info" ? "ok" : tone;

  return {
    id: docSnap.id,
    name,
    category,
    location,
    dueDate: dueDateObj
      ? formatSafetyDueDateLong(dueDateObj)
      : String(data.nextDueDate ?? data.dueDate ?? "—"),
    dueDateIso: dueDateObj ? dueDateObj.toISOString() : null,
    status,
    tone: resolvedTone,
    serial: data.serial ? String(data.serial) : undefined,
    makeModel: data.makeModel ? String(data.makeModel) : undefined,
    lastServiceDate: data.lastServiceDate
      ? String(data.lastServiceDate)
      : undefined,
    expiryDate: data.expiryDate ? String(data.expiryDate) : undefined,
    latitude:
      typeof data.latitude === "number" && Number.isFinite(data.latitude)
        ? data.latitude
        : null,
    longitude:
      typeof data.longitude === "number" && Number.isFinite(data.longitude)
        ? data.longitude
        : null,
    photoLocalUri: data.photoLocalUri ? String(data.photoLocalUri) : null,
    photoDownloadURL: data.photoDownloadURL
      ? String(data.photoDownloadURL)
      : null,
    photoThumbURL: data.photoThumbURL ? String(data.photoThumbURL) : null,
    photoStoragePath: data.photoStoragePath
      ? String(data.photoStoragePath)
      : null,
    photoMediaStatus:
      (data.photoMediaStatus as SafetyItem["photoMediaStatus"]) ??
      (data.photoDownloadURL
        ? "ready"
        : data.photoLocalUri
          ? "pending"
          : "none"),
    certLocalUri: data.certLocalUri ? String(data.certLocalUri) : null,
    certDownloadURL: data.certDownloadURL
      ? String(data.certDownloadURL)
      : null,
    certThumbURL: data.certThumbURL ? String(data.certThumbURL) : null,
    certStoragePath: data.certStoragePath
      ? String(data.certStoragePath)
      : null,
    certMediaStatus:
      (data.certMediaStatus as SafetyItem["certMediaStatus"]) ??
      (data.certDownloadURL
        ? "ready"
        : data.certLocalUri
          ? "pending"
          : "none"),
  };
}
