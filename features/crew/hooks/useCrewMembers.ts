import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/features/common/firebase";
import { fetchCrewMembers } from "@/features/crew/services/fetchCrewMembers";
import type { CrewMember } from "@/features/crew/types/crew";

export const CREW_MEMBERS_QUERY_KEY = ["crew", "members"] as const;

/**
 * React Query hook for the signed-in user's Firestore crew roster.
 * @returns Query result with crew members
 */
export function useCrewMembers() {
  const uid = getCurrentUser()?.uid ?? null;

  return useQuery<CrewMember[], Error>({
    queryKey: [...CREW_MEMBERS_QUERY_KEY, uid],
    enabled: Boolean(uid),
    queryFn: fetchCrewMembers,
  });
}
