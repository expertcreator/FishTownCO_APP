import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/features/common/firebase";
import { fetchCrewMember } from "@/features/crew/services/fetchCrewMember";
import type { CrewMember } from "@/features/crew/types/crew";

/**
 * React Query hook for a single crew member document.
 * @param id - Firestore crew document id
 * @returns Query result with crew member (or null)
 */
export function useCrewMember(id: string) {
  const uid = getCurrentUser()?.uid ?? null;

  return useQuery<CrewMember | null, Error>({
    queryKey: ["crew", "member", id, uid],
    enabled: Boolean(uid && id),
    queryFn: () => fetchCrewMember(id),
  });
}
