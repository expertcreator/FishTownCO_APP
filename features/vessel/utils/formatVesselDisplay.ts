import type { ImageSourcePropType } from "react-native";
import type { VesselProfile } from "@/features/vessel/types/vessel";

const DEFAULT_VESSEL_HERO = require("@/assets/from-design/onboarding/01-central-log.jpg");

/**
 * Formats engine hours for My Vessel / maintenance rows (e.g. `1,420 hrs`).
 * @param raw - Stored engine-hours value (digits or already labeled)
 * @returns Display string, or `—` when empty
 */
export function formatEngineHours(raw: string | undefined | null): string {
  const value = String(raw ?? "").trim();
  if (!value) return "—";
  if (/hrs/i.test(value)) {
    const digits = value.replace(/[^\d.]/g, "");
    if (!digits) return value;
    const n = Number(digits);
    if (!Number.isFinite(n)) return value;
    return `${n.toLocaleString("en-US")} hrs`;
  }
  const digits = value.replace(/[^\d.]/g, "");
  if (!digits) return value;
  const n = Number(digits);
  if (!Number.isFinite(n)) return value;
  return `${n.toLocaleString("en-US")} hrs`;
}

/**
 * Formats “next service in” for My Vessel (e.g. `80 hrs`).
 * @param raw - Stored next-service interval
 * @returns Display string, or `—` when empty
 */
export function formatNextServiceIn(raw: string | undefined | null): string {
  const value = String(raw ?? "").trim();
  if (!value) return "—";
  if (/hrs/i.test(value)) {
    const digits = value.replace(/[^\d.]/g, "");
    if (!digits) return value;
    const n = Number(digits);
    if (!Number.isFinite(n)) return value;
    return `${n.toLocaleString("en-US")} hrs`;
  }
  const digits = value.replace(/[^\d.]/g, "");
  if (!digits) return value;
  const n = Number(digits);
  if (!Number.isFinite(n)) return value;
  return `${n.toLocaleString("en-US")} hrs`;
}

/**
 * Resolves the hero image for Home / My Vessel from the vessel profile.
 * Prefers the uploaded photo URL; falls back to the onboarding vessel image.
 * @param vessel - Vessel profile or null
 * @returns React Native image source
 */
export function getVesselHeroSource(
  vessel: Pick<VesselProfile, "photoUrl" | "photoThumbUrl"> | null | undefined
): ImageSourcePropType {
  const uri = vessel?.photoUrl?.trim() || vessel?.photoThumbUrl?.trim();
  if (uri) {
    return { uri };
  }
  return DEFAULT_VESSEL_HERO;
}
