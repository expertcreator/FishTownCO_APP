import { z } from "zod"
import { MAX_FAVOURITES_LIMIT } from "./limits"
import {
  type LocalizedText,
  optionalLocalizedTextSchema
} from "@/constants/geo-taxonomy/schemas"

/**
 * The favourites boundary (`business-discovery-backend`'s `/favorites` pair),
 * parsed rather than trusted — and the parse IS the sanitiser, exactly as
 * `checkout/schemas.ts` puts it: `z.object` strips every key it does not name,
 * so the upstream's ~35-column tenant projection and its full product row never
 * survive into a body the web proxy hands the browser.
 *
 * **Spelling is split on purpose and stays split** (`mw-3-3`): British in our
 * own identifiers (`parseFavouritesListResponse`, `FavouriteRow`), US at the
 * wire, where the backend spells the field `isFavorite` and the type
 * `"product"`. Renaming across that seam is how a payload silently stops
 * matching `toggleFavoriteBodySchema`.
 */

/** The two things a customer can favourite. The backend's own enum. */
export const FAVOURITE_TYPES = ["product", "tenant"] as const

/** One favouritable kind. */
export type FavouriteType = (typeof FAVOURITE_TYPES)[number]

/**
 * The largest page `GET favorites` accepts (`PAGINATION.MAX_LIMIT`), and the
 * size the catalog hydration asks for.
 *
 * ponytail: one page of 100 is the whole hydration. Past that a heart renders
 * hollow until it is touched — there is no ids-only projection to page cheaply
 * against, so covering it properly means a new backend read, not more loops.
 */
export { MAX_FAVOURITES_LIMIT }

/**
 * The toggle request body: `{ type, tenantId? | productId? }`.
 *
 * The id is `min(1)` rather than `uuid()` even though the upstream refine is
 * `z.string().uuid()`. The web proxy's job here is to make the pairing rule
 * unreachable without spending an upstream call — a `type: "product"` with no
 * `productId` — not to re-derive the upstream's format check. Catalog ids reach
 * this from whichever transport is mounted, and the fixture transport's ids are
 * not UUIDs (`features/catalog/fixtures/restaurants.ts`), so a format check
 * here would reject a page that the real backend would have answered.
 */
export const favouriteTogglePayloadSchema = z
  .object({
    productId: z.string().min(1).optional(),
    tenantId: z.string().min(1).optional(),
    type: z.enum(FAVOURITE_TYPES)
  })
  .refine(
    (value) =>
      value.type === "tenant"
        ? value.tenantId !== undefined && value.productId === undefined
        : value.productId !== undefined && value.tenantId === undefined,
    {
      // EXACTLY the id the type names, never both. The upstream refine only
      // checks that the named one is present, so a body carrying both passes
      // there and the service silently reads whichever its branch looks at —
      // a caller could name `type: "product"` and have a tenant id ride along.
      // This proxy's own callers build the body from `FavouriteEntity`, which
      // is a discriminated union and can only ever produce one.
      message:
        "type 'tenant' takes tenantId alone; type 'product' takes productId alone",
      path: ["type"]
    }
  )

/** A validated toggle body, ready to forward verbatim. */
export type FavouriteTogglePayload = z.infer<
  typeof favouriteTogglePayloadSchema
>

/**
 * Validates a toggle body the browser sent.
 *
 * Answers the parsed payload or the field paths that failed, `parseAddressPayload`'s
 * shape — so the route can name what was wrong instead of forwarding a body the
 * upstream would reject as an opaque 400.
 * @param value - The candidate body
 * @returns `{ ok: true, payload }`, or `{ ok: false, fields }` naming each bad field
 * @example parseFavouriteTogglePayload({ type: "product" }).ok // -> false
 */
export function parseFavouriteTogglePayload(
  value: unknown
):
  | { ok: true; payload: FavouriteTogglePayload }
  | { ok: false; fields: readonly string[] } {
  const parsed = favouriteTogglePayloadSchema.safeParse(value)

  if (parsed.success) {
    return { ok: true, payload: parsed.data }
  }

  return {
    ok: false,
    fields: [
      ...new Set(
        parsed.error.issues.map((issue) => String(issue.path[0] ?? "body"))
      )
    ]
  }
}

/**
 * `GET favorites`' query, mirroring `listFavoritesQuerySchema`
 * (`favoriteValidation.ts:28-55`) — 0-based `page`, `limit` capped at
 * {@link MAX_FAVOURITES_LIMIT}, optional `type`.
 *
 * **`lat`/`lng` are absent on purpose and must stay absent.** The upstream
 * accepts them and then replaces `total` with the post-filter length of the
 * current page (`favoriteService.ts:749`), which is the number hydration pages
 * against. Adding them here breaks paging, and paging is now the safety
 * property rather than a nicety.
 */
export const favouritesListQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_FAVOURITES_LIMIT)
    .catch(MAX_FAVOURITES_LIMIT),
  page: z.coerce.number().int().min(0).catch(0),
  type: z.enum(FAVOURITE_TYPES).optional().catch(undefined)
})

/** A validated list query, safe to forward. */
export type FavouritesListQuery = z.infer<typeof favouritesListQuerySchema>

/**
 * Clamps a browser-supplied list query to what the upstream will accept.
 *
 * **Clamps rather than refuses.** Every value here is a pagination hint, not
 * user data: `?limit=1000` forwarded verbatim earns a `VALIDATION_ERROR` 400
 * that `callUpstream` reduces to `unavailable`, so the visitor is told the
 * service is down and the server logs a proxy failure that never happened.
 * Clamping answers the page they can actually have.
 * @param value - The raw query values, as strings off the URL
 * @returns The clamped query
 * @example parseFavouritesListQuery({ limit: "1000" }).limit // -> 100
 */
export function parseFavouritesListQuery(value: {
  limit?: string | null
  page?: string | null
  type?: string | null
}): FavouritesListQuery {
  return favouritesListQuerySchema.parse({
    limit: value.limit ?? MAX_FAVOURITES_LIMIT,
    page: value.page ?? 0,
    type: value.type ?? undefined
  })
}

/** The one thing a toggle answer tells the caller: which way it landed. */
export const favouriteToggleStateSchema = z.object({
  isFavorite: z.boolean()
})

/** The state a toggle settled on, as the server sees it. */
export type FavouriteToggleState = z.infer<typeof favouriteToggleStateSchema>

/**
 * The upstream's toggle envelope: `{ success: true, data: { isFavorite, code } }`
 * (`favoriteService.ts:245-257,322-334`). `code` is named for the contract and
 * then dropped by the parse — nothing renders it, and `isFavorite` already says
 * which way the row went.
 */
export const favouriteToggleResponseSchema = z.object({
  data: favouriteToggleStateSchema,
  success: z.literal(true)
})

/**
 * Reads a toggle answer out of whichever envelope carries it.
 *
 * Two keys because two hops answer the same shape under different names —
 * `narrowOrdersListPage`'s `"data" | "page"` for the same reason: the upstream
 * wraps it as `data`, the web proxy re-wraps it as `favourite`, and two copies
 * of the unwrap would drift.
 *
 * `success` is deliberately NOT pinned here: the proxy's own envelope carries
 * no such field, and the upstream's error bodies carry no `success` either
 * (`error-handler.ts:24-43`), so its absence proves nothing either way.
 * @param value - The decoded response body
 * @param key - Which property carries the state
 * @returns The settled state, or `null` when the body carries none there
 * @example parseFavouriteToggleResponse({ data: { isFavorite: true } }, "data")
 */
export function parseFavouriteToggleResponse(
  value: unknown,
  key: "data" | "favourite"
): FavouriteToggleState | null {
  if (typeof value !== "object" || value === null) {
    return null
  }

  const parsed = favouriteToggleStateSchema.safeParse(
    (value as Record<string, unknown>)[key]
  )

  return parsed.success ? parsed.data : null
}

/**
 * A wire money field. Product prices come off `product_inventory.price`, a
 * Postgres `decimal`, so they arrive as strings — and as `null` whenever the
 * favourite's product has no visible inventory row left to price it from.
 */
const wirePriceSchema = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((value) => {
    if (typeof value === "string") {
      // `Number("")` and `Number("   ")` are both `0`, and `0` is finite, so a
      // blank price column rendered as "Rs 0" — a dish the customer would read
      // as free. Absent is absent.
      const trimmed = value.trim()

      return trimmed.length > 0 && Number.isFinite(Number(trimmed))
        ? Number(trimmed)
        : null
    }

    return typeof value === "number" && Number.isFinite(value) ? value : null
  })

/**
 * A stored image reference, kept as received or dropped to `null`.
 *
 * Not narrowed to an https URL here: `src/core` holds no opinion about what
 * `next/image` can fetch. The app's `isRenderableImageUrl` is that gate, and it
 * runs at the one place the value becomes an `<Image src>`.
 */
const wireImageSchema = z
  .unknown()
  .transform((value) =>
    typeof value === "string" && value.length > 0 ? value : null
  )

/**
 * The URL slug of the restaurant this row points at — the tenant's own, or the
 * BRANCH that sells the dish.
 *
 * Degradable for `degradableNameSchema`'s reason: `tenants.slug` is nullable,
 * and a favourite with no slug is still a favourite the customer saved. It
 * costs the card its link, never its existence.
 *
 * `.nullish()` is required: `z.unknown()` rejects a missing key (`undefined`),
 * which would drop a dish whose branch only carried a bad name, and every
 * already-narrowed proxy row that omitted `slug`.
 */
const degradableSlugSchema = z
  .unknown()
  .nullish()
  .transform((value) =>
    typeof value === "string" && value.length > 0 ? value : null
  )

/**
 * A display name that DEGRADES to `null` instead of failing the row.
 *
 * `src/core/catalog` uses `localizedTextSchema`, which refines `en.length > 0`
 * and takes the whole record down with it — correct there, where a nameless
 * restaurant would render blank in a public listing that has thousands of
 * others. **It is the wrong trade here.** This page's entire content is records
 * the customer deliberately saved, and a favourite that vanishes because one
 * jsonb column is `{}` is a favourite the customer is told they never made.
 * `degradableImageRefSchema`'s posture, applied to the name: one poisoned
 * column costs the row its name, never its existence.
 *
 * The card renders a stated placeholder for `null` — never an invented name,
 * which would look like real data and hide the fault instead of admitting it.
 * `.catch(null)` covers the shapes the transform itself refuses (a number, an
 * array), so no name value anywhere can drop a row.
 */
const degradableNameSchema = optionalLocalizedTextSchema.catch(null)

/**
 * The nested tenant on a `type: "tenant"` row.
 *
 * Four fields out of `publicTenantColumns`' ~35 plus the stats the service
 * bolts on. The card shows a mark and a name; everything else — coordinates,
 * delivery radius, pause state, commercial terms — is projection the browser
 * has no use for and must not be handed.
 */
const favouriteTenantSchema = z.object({
  coverPicture: wireImageSchema,
  id: z.string().min(1),
  name: degradableNameSchema,
  restaurantPicture: wireImageSchema,
  slug: degradableSlugSchema
})

/** The nested product on a `type: "product"` row, cut to the same card. */
const favouriteProductSchema = z.object({
  branch: z
    .object({
      name: optionalLocalizedTextSchema.catch(null),
      slug: degradableSlugSchema
    })
    .nullish(),
  id: z.string().min(1),
  images: z.array(z.unknown()).nullish(),
  name: degradableNameSchema,
  price: wirePriceSchema
})

/** The favourite row itself, before its nested record is folded in. */
const favouriteRowEnvelopeSchema = z.object({
  id: z.string().min(1),
  product: favouriteProductSchema.nullish(),
  tenant: favouriteTenantSchema.nullish(),
  type: z.enum(FAVOURITE_TYPES)
})

/** One row of `/favourites`, and one heart's worth of state. */
export interface FavouriteRow {
  /** The favourite row's own id — the list key and the de-duplication key. */
  readonly id: string
  /** Which section it belongs in, and which body a toggle sends. */
  readonly type: FavouriteType
  /**
   * The favourited record's id — the product or the tenant, never the
   * favourite row. This is what a heart is keyed on everywhere else in the app,
   * so hydrating the catalog's hearts from this list needs no second lookup.
   */
  readonly entityId: string
  /**
   * Its display name, or `null` when the upstream's jsonb held nothing usable.
   * The card states that rather than inventing one — see
   * {@link degradableNameSchema}.
   */
  readonly name: LocalizedText | null
  /** A stored image reference, or `null`. */
  readonly imageUrl: string | null
  /** The branch that sells it — dishes only, `null` on a restaurant row. */
  readonly branchName: LocalizedText | null
  /** Its price — dishes only, and `null` when no inventory row prices it. */
  readonly price: number | null
  /**
   * The slug of the restaurant page this row opens — the tenant's own slug, or
   * the branch's for a dish. `null` when the upstream stated none, which is the
   * one case the card renders unlinked.
   *
   * **No city rides along, and none can.** No backend response carries a city
   * for a restaurant (`restaurantSummarySchema`); slugs are globally unique and
   * the transport drops `citySlug` before the HTTP call, so the city segment is
   * the caller's to supply and does not scope the lookup.
   */
  readonly slug: string | null
}

/** One page of favourites, narrowed to what the screen renders. */
export interface FavouritesListPage {
  /** The rows that survived narrowing, in the order they were received. */
  readonly items: readonly FavouriteRow[]
  /** How many rows the page asked for, when the answer stated it. */
  readonly limit: number | null
  /** The upstream's total row count, when it stated one. */
  readonly total: number | null
  /**
   * How many rows the page carried BEFORE narrowing dropped any — the has-more
   * input, because `items.length` is what survived rather than what arrived.
   */
  readonly receivedCount: number
  /**
   * Why each dropped row was dropped, as FIELD PATHS ONLY.
   *
   * Never a value: this is logged server-side, and the upstream's content is
   * the customer's own data. A path (`tenant.id`, `type`) says which column
   * tripped without putting a restaurant name or an id in a log line.
   *
   * Empty when nothing was dropped, which is the diagnostic's whole point: an
   * empty page with NO reasons means the upstream returned no rows at all, and
   * the fault is upstream of this parse.
   */
  readonly dropReasons: readonly string[]
}

/**
 * The page body the upstream nests under `data` (`favoriteService.ts:747-752`):
 * `items`, and the three paging numbers. **No `meta`, no `totalPages`, no
 * `hasMore`** — asking for any of them parses nothing.
 */
export const favouritesPageSchema = z.object({
  items: z.array(z.unknown()),
  limit: z.number().nullish(),
  page: z.number().nullish(),
  total: z.number().nullish()
})

/** The upstream's list envelope: `{ success: true, data: { items, … } }`. */
export const favouritesListResponseSchema = z.object({
  data: favouritesPageSchema,
  success: z.literal(true)
})

/** A row that survived narrowing, or the field path that stopped it. */
type NarrowedRow = { readonly row: FavouriteRow } | { readonly reason: string }

/**
 * Folds one raw row into a {@link FavouriteRow}.
 *
 * Answers a REASON rather than a bare `null` for a drop: a withdrawn record and
 * a malformed one used to be indistinguishable, so a customer's favourites
 * disappearing left nothing to look at anywhere. The reason is a field path and
 * never a value — see {@link FavouritesListPage.dropReasons}.
 * @param value - One element of `items`, entirely unvalidated
 * @returns The row, or the path that stopped it
 */
function narrowRow(value: unknown): NarrowedRow {
  const parsed = favouriteRowEnvelopeSchema.safeParse(value)

  if (!parsed.success) {
    return {
      reason: [
        ...new Set(
          parsed.error.issues.map((issue) =>
            issue.path.length > 0 ? issue.path.join(".") : "row"
          )
        )
      ].join("+")
    }
  }

  const row = parsed.data

  if (row.type === "tenant") {
    // `tenant` is genuinely absent whenever the underlying record failed the
    // service's visibility filter (`favoriteService.ts:548`) — a live row
    // pointing at a restaurant the customer may no longer see. There is no
    // name to print and no heart to key, so the row is dropped rather than
    // rendered as a blank card.
    const tenant = row.tenant ?? null

    return tenant === null
      ? { reason: "tenant:absent" }
      : {
          row: {
            branchName: null,
            entityId: tenant.id,
            id: row.id,
            imageUrl: tenant.restaurantPicture ?? tenant.coverPicture,
            name: tenant.name,
            price: null,
            slug: tenant.slug,
            type: "tenant"
          }
        }
  }

  // Same for a withdrawn product (`favoriteService.ts:815-817` answers
  // `{ ...item, product: undefined }`).
  const product = row.product ?? null

  if (product === null) {
    return { reason: "product:absent" }
  }

  const image = product.images?.find(
    (candidate) => typeof candidate === "string" && candidate.length > 0
  )

  return {
    row: {
      branchName: product.branch?.name ?? null,
      entityId: product.id,
      id: row.id,
      imageUrl: typeof image === "string" ? image : null,
      name: product.name,
      price: product.price,
      slug: product.branch?.slug ?? null,
      type: "product"
    }
  }
}

/**
 * Narrows a `{[key]: {items, limit, total}}` envelope to one page of favourites.
 *
 * Two keys for `narrowOrdersListPage`'s reason: the route unwraps the
 * upstream's `data`, the screen unwraps its own proxy's `page`, and two copies
 * of that unwrap would drift apart.
 *
 * **A row whose nested record is absent is dropped, and a repeated favourite id
 * keeps only its first occurrence.** A row with no `tenant`/`product` has no
 * name, no image and no id to toggle — the upstream's own visibility filter
 * produced it, so it is expected rather than exceptional. `receivedCount`
 * reports the pre-narrowing count precisely because those drops are otherwise
 * invisible to the caller.
 * @param value - The decoded response body
 * @param key - Which property carries the page
 * @returns The page, or `null` when the body carries no `items` array there
 * @example parseFavouritesListResponse({ data: { items: [] } }, "data")
 */
export function parseFavouritesListResponse(
  value: unknown,
  key: "data" | "page"
): FavouritesListPage | null {
  if (typeof value !== "object" || value === null) {
    return null
  }

  const parsed = favouritesPageSchema.safeParse(
    (value as Record<string, unknown>)[key]
  )

  if (!parsed.success) {
    return null
  }

  const seen = new Set<string>()
  const items: FavouriteRow[] = []
  const dropReasons: string[] = []

  for (const raw of parsed.data.items) {
    const narrowed = narrowRow(raw)

    if (!("row" in narrowed)) {
      dropReasons.push(narrowed.reason)
      continue
    }

    if (seen.has(narrowed.row.id)) {
      dropReasons.push("id:duplicate")
      continue
    }

    seen.add(narrowed.row.id)
    items.push(narrowed.row)
  }

  return {
    dropReasons,
    items,
    limit: parsed.data.limit ?? null,
    receivedCount: parsed.data.items.length,
    total: parsed.data.total ?? null
  }
}

/**
 * One row as THIS APP'S OWN PROXY answers it — already narrowed.
 *
 * `parseFavouritesListResponse` narrows the upstream's nested
 * `{ tenant | product }` envelope; the route then serialises the result, so the
 * browser receives {@link FavouriteRow}s, not upstream rows. Re-running the
 * upstream narrowing over them dropped every row as `tenant:absent` —
 * the two hops do NOT answer the same shape, and pretending they did is what
 * emptied both the screen and the catalog hydration.
 *
 * Still parsed rather than trusted: the proxy is our own code, but it is across
 * the network and its body is `unknown` here like any other.
 */
const favouriteRowSchema = z.object({
  branchName: optionalLocalizedTextSchema.catch(null),
  entityId: z.string().min(1),
  id: z.string().min(1),
  imageUrl: wireImageSchema,
  name: degradableNameSchema,
  price: wirePriceSchema,
  slug: degradableSlugSchema,
  type: z.enum(FAVOURITE_TYPES)
})

/** The proxy's own list body: `{ page: { items, limit, total, … } }`. */
const favouritesPageBodySchema = z.object({
  items: z.array(z.unknown()),
  limit: z.number().nullish(),
  receivedCount: z.number().nullish(),
  total: z.number().nullish()
})

/**
 * Reads one page of favourites out of this app's own `/api/account/favourites`
 * answer.
 *
 * `receivedCount` is taken from the body when stated — it is the UPSTREAM's
 * pre-narrowing count, which is what has-more must be asked with; falling back
 * to `items.length` would end paging early on a page the proxy shortened.
 * @param value - The decoded proxy response body
 * @returns The page, or `null` when the body carries no `page.items` array
 * @example parseFavouritesPageBody({ page: { items: [] } })
 */
export function parseFavouritesPageBody(
  value: unknown
): FavouritesListPage | null {
  if (typeof value !== "object" || value === null) {
    return null
  }

  const parsed = favouritesPageBodySchema.safeParse(
    (value as Record<string, unknown>).page
  )

  if (!parsed.success) {
    return null
  }

  const seen = new Set<string>()
  const items: FavouriteRow[] = []
  const dropReasons: string[] = []

  for (const raw of parsed.data.items) {
    const row = favouriteRowSchema.safeParse(raw)

    if (!row.success) {
      dropReasons.push(
        [
          ...new Set(
            row.error.issues.map((issue) =>
              issue.path.length > 0 ? issue.path.join(".") : "row"
            )
          )
        ].join("+")
      )
      continue
    }

    if (seen.has(row.data.id)) {
      dropReasons.push("id:duplicate")
      continue
    }

    seen.add(row.data.id)
    items.push(row.data)
  }

  return {
    dropReasons,
    items,
    limit: parsed.data.limit ?? null,
    receivedCount: parsed.data.receivedCount ?? parsed.data.items.length,
    total: parsed.data.total ?? null
  }
}
