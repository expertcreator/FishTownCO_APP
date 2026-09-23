import { QueryClient } from "@tanstack/react-query";

/**
 * App-wide React Query client. Firestore pages are cached here in memory.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
