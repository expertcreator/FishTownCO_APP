import type { StatusTone } from "@/features/common/data/demo";
import type { MediaStatus } from "@/features/common/media/mediaStatus";

/**
 * Safety inventory item mapped from Firestore `users/{uid}/safety`.
 */
export type SafetyItem = {
  id: string;
  name: string;
  category: string;
  location: string;
  dueDate: string;
  dueDateIso: string | null;
  status: string;
  tone: StatusTone;
  serial?: string;
  makeModel?: string;
  lastServiceDate?: string;
  expiryDate?: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  photoLocalUri?: string | null;
  photoDownloadURL?: string | null;
  photoThumbURL?: string | null;
  photoStoragePath?: string | null;
  photoMediaStatus?: MediaStatus;
  certLocalUri?: string | null;
  certDownloadURL?: string | null;
  certThumbURL?: string | null;
  certStoragePath?: string | null;
  certMediaStatus?: MediaStatus;
};

/** Filter chips on the Safety inventory screen. */
export type SafetyFilterKey = "all" | "ok" | "due" | "overdue";
