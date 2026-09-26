import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/features/common/firebase";
import { fetchSafetyItems } from "@/features/safety/services/fetchSafetyItems";
import type { SafetyItem } from "@/features/safety/types/safetyItem";

export const SAFETY_ITEMS_QUERY_KEY = ["safety", "items"] as const;

/**
 * React Query hook for the signed-in user's Firestore safety inventory.
 * @returns Query result with safety items
 */
export function useSafetyItems() {
  const uid = getCurrentUser()?.uid ?? null;

  return useQuery<SafetyItem[], Error>({
    queryKey: [...SAFETY_ITEMS_QUERY_KEY, uid],
    enabled: Boolean(uid),
    queryFn: fetchSafetyItems,
  });
}
