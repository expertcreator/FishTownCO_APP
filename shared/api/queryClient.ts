import { QueryClient } from "@tanstack/react-query";

/** Shared across app + feature-flag store so `fetchQuery` / cache stay in sync with hooks. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});
