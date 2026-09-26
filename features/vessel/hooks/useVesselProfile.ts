import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/features/common/firebase";
import { fetchVesselProfile } from "@/features/vessel/services/fetchVesselProfile";
import type { VesselProfile } from "@/features/vessel/types/vessel";

export const VESSEL_QUERY_KEY = ["vessel", "profile"] as const;

/**
 * React Query hook for the signed-in user's Firestore vessel profile.
 * @returns Query result with vessel profile (or null when not created yet)
 */
export function useVesselProfile() {
  const uid = getCurrentUser()?.uid ?? null;

  return useQuery<VesselProfile | null, Error>({
    queryKey: [...VESSEL_QUERY_KEY, uid],
    enabled: Boolean(uid),
    queryFn: fetchVesselProfile,
  });
}
