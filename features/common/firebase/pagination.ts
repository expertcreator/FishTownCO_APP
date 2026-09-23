import {
  getDocs,
  limit,
  query,
  startAfter,
  type Query,
  type QueryDocumentSnapshot,
} from "@react-native-firebase/firestore";

/** Default page size for all Firestore infinite lists (matches product decision). */
export const FIRESTORE_PAGE_SIZE = 20;

/**
 * One page of Firestore results plus the cursor for the next page.
 */
export type FirestorePage<T> = {
  items: T[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
};

/**
 * Cursor passed between React Query infinite pages.
 */
export type FirestorePageParam = QueryDocumentSnapshot | null;

type FetchQueryPageOptions<T> = {
  /**
   * Base Firestore query (collection + filters + orderBy).
   * Do not include `limit` / `startAfter` here — this helper adds them.
   */
  baseQuery: Query;
  /** Max docs per page. Defaults to {@link FIRESTORE_PAGE_SIZE}. */
  pageSize?: number;
  /** Exclusive start cursor from the previous page. */
  startAfterDoc?: FirestorePageParam;
  /** Maps a Firestore doc into the app model. */
  mapDoc: (doc: QueryDocumentSnapshot) => T;
};

/**
 * Fetches one cursor page from Firestore (Foori-style “load more” backend).
 * @param options - Query, page size, cursor, and mapper
 * @returns Items for this page and whether more pages exist
 * @throws {Error} When the Firestore query fails
 */
export async function fetchQueryPage<T>({
  baseQuery,
  pageSize = FIRESTORE_PAGE_SIZE,
  startAfterDoc = null,
  mapDoc,
}: FetchQueryPageOptions<T>): Promise<FirestorePage<T>> {
  const pageQuery = startAfterDoc
    ? query(baseQuery, startAfter(startAfterDoc), limit(pageSize))
    : query(baseQuery, limit(pageSize));

  const snapshot = await getDocs(pageQuery);
  const docs = snapshot.docs;
  const lastDoc = docs.length > 0 ? docs[docs.length - 1] : null;

  return {
    items: docs.map(mapDoc),
    lastDoc,
    hasMore: docs.length === pageSize,
  };
}

/**
 * Flattens all loaded infinite-query pages into one list for FlatList.
 * @param pages - Pages returned from `useFirestoreInfiniteQuery`
 * @returns Combined items in load order
 */
export function flattenFirestorePages<T>(
  pages: FirestorePage<T>[] | undefined
): T[] {
  if (!pages?.length) {
    return [];
  }
  return pages.flatMap((page) => page.items);
}
