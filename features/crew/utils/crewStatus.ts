import type { StatusTone } from "@/features/common/data/demo";
import { getSafetyStatusLabel } from "@/features/safety/utils/safetyStatus";
import type { Ionicons } from "@expo/vector-icons";

/**
 * Short status label for crew pills (Overdue / Due soon / OK).
 * @param tone - Computed status tone
 * @returns Prototype status label
 */
export function getCrewStatusLabel(tone: StatusTone): string {
  return getSafetyStatusLabel(tone === "info" ? "ok" : tone);
}

/**
 * Resolves pill icon for a crew status tone.
 * @param tone - Status tone
 * @returns Ionicons glyph name
 */
export function getCrewStatusIcon(
  tone: StatusTone
): keyof typeof Ionicons.glyphMap {
  switch (tone) {
    case "overdue":
      return "alert-circle";
    case "due":
      return "time-outline";
    default:
      return "checkmark-circle";
  }
}
