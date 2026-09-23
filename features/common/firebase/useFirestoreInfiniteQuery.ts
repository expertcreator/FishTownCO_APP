import {
  useInfiniteQuery,
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";
import type { Query, QueryDocumentSnapshot } from "@react-native-firebase/firestore";
import {
  fetchQueryPage,
  flattenFirestorePages,
  type FirestorePage,
  type FirestorePageParam,
  FIRESTORE_PAGE_SIZE,
} from "./pagination";

type UseFirestoreInfiniteQueryOptions<T> = {
  /** React Query cache key, e.g. `["safety", uid]`. */
  queryKey: QueryKey;
  /** When false, the query does not run (e.g. no auth uid yet). */
  enabled?: boolean;
  /** Docs per page. Defaults to 20. */
  pageSize?: number;
  /**
   * Builds the Firestore query for every page.
   * Must include `orderBy`. Must not include `limit` / `startAfter`.
   */
  getQuery: () => Query;
  /** Maps each document into the feature model. */
  mapDoc: (doc: QueryDocumentSnapshot) => T;
};

type UseFirestoreInfiniteQueryResult<T> = UseInfiniteQueryResult<
  InfiniteData<FirestorePage<T>, FirestorePageParam>,
  Error
> & {
  /** All loaded items flattened for list UIs. */
  items: T[];
};

/**
 * Infinite Firestore list hook — same role as Foori `useInfiniteQuery` lists.
 * Pair with `onEndReached` + `ListFooterLoader` when `isFetchingNextPage`.
 * @param options - Query key, query builder, and mapper
 * @returns Infinite query state plus flattened `items`
 */
export function useFirestoreInfiniteQuery<T>({
  queryKey,
  enabled = true,
  pageSize = FIRESTORE_PAGE_SIZE,
  getQuery,
  mapDoc,
}: UseFirestoreInfiniteQueryOptions<T>): UseFirestoreInfiniteQueryResult<T> {
  const result = useInfiniteQuery<
    FirestorePage<T>,
    Error,
    InfiniteData<FirestorePage<T>, FirestorePageParam>,
    QueryKey,
    FirestorePageParam
  >({
    queryKey,
    enabled,
    initialPageParam: null,
    queryFn: async ({ pageParam }) =>
      fetchQueryPage({
        baseQuery: getQuery(),
        pageSize,
        startAfterDoc: pageParam,
        mapDoc,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastDoc : undefined,
  });

  return {
    ...result,
    items: flattenFirestorePages(result.data?.pages),
  };
}
