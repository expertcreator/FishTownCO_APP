import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/features/common/firebase";
import { fetchWalletDocs } from "@/features/wallet/services/fetchWalletDocs";
import type { WalletDoc } from "@/features/wallet/types/wallet";

export const WALLET_DOCS_QUERY_KEY = ["wallet", "docs"] as const;

/**
 * React Query hook for the signed-in user's Firestore wallet documents.
 * @returns Query result with wallet docs
 */
export function useWalletDocs() {
  const uid = getCurrentUser()?.uid ?? null;

  return useQuery<WalletDoc[], Error>({
    queryKey: [...WALLET_DOCS_QUERY_KEY, uid],
    enabled: Boolean(uid),
    queryFn: fetchWalletDocs,
  });
}
