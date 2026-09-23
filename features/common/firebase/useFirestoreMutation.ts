import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";

type UseFirestoreMutationOptions<TData, TVariables, TContext> = {
  /** Optional cache keys to refresh after a successful write. */
  invalidateKeys?: QueryKey[];
} & UseMutationOptions<TData, Error, TVariables, TContext>;

/**
 * Mutation wrapper that can invalidate Firestore list caches after writes.
 * Same idea as Foori `useApiMutation` invalidation.
 * @param options - Mutation options plus optional invalidate keys
 * @returns React Query mutation result
 */
export function useFirestoreMutation<TData, TVariables, TContext = unknown>({
  invalidateKeys = [],
  onSuccess,
  ...rest
}: UseFirestoreMutationOptions<TData, TVariables, TContext>): UseMutationResult<
  TData,
  Error,
  TVariables,
  TContext
> {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables, TContext>({
    ...rest,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await Promise.all(
        invalidateKeys.map((key) =>
          queryClient.invalidateQueries({ queryKey: key })
        )
      );
      await onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
