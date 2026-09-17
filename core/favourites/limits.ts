/**
 * Page size the favourites list is fetched with. Its own zod-free module so
 * the app's store can build the first request without loading `schemas.ts`
 * (zod plus the constants barrel) onto a catalog route's first load.
 */
export const MAX_FAVOURITES_LIMIT = 100
