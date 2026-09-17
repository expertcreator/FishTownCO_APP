import {
  DAY_OF_WEEK,
  type DayOfWeek,
  dayOfWeekEnum,
  HOME_SECTIONS,
  isHomeSection,
  NUMBER_LIMITS,
  orderFulfillmentEnum,
  STRING_LIMITS
} from "@/constants"
import {
  areaSchema,
  citySchema,
  coordinatesSchema,
  localizedTextInputSchema,
  localizedTextSchema,
  optionalLocalizedTextSchema,
  SLUG_REGEX,
  slugSchema
} from "@/constants/geo-taxonomy/schemas"
import { z } from "zod"
import { parsePriceModifier } from "@/constants/geo-taxonomy/item-pricing"

export {
  areaSchema,
  type Area,
  citySchema,
  type City,
  coordinatesSchema,
  type Coordinates,
  localizedTextSchema,
  type LocalizedText,
  optionalLocalizedTextSchema,
  SLUG_REGEX,
  slugSchema,
  type Slug
} from "@/constants/geo-taxonomy/schemas"

// ============================================================================
// PRIMITIVES
// ============================================================================

/** Decimal wire values: `450`, `"450.00"`, `"-1"`. Never `"1e3"`, never `""`. */
const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/

/**
 * Builds a schema that accepts a number or a decimal string and yields a bounded
 * number. Postgres `decimal` columns arrive as strings, so every money and
 * coordinate field on the wire needs this.
 * @param min - Inclusive lower bound
 * @param max - Inclusive upper bound
 * @returns A schema whose output is a `number` within `[min, max]`
 */
function decimalSchema(min: number, max: number) {
  return z
    .union([z.number(), z.string().regex(DECIMAL_REGEX)])
    .transform((value) => Number(value))
    .pipe(z.number().min(min).max(max))
}

/**
 * Product / fee / total money value, bounded by the shared `NUMBER_LIMITS`.
 * No arithmetic happens here — `calculatePricing` in `@/constants` owns that.
 * @example priceSchema.parse("450.00") // -> 450
 */
export const priceSchema = decimalSchema(
  NUMBER_LIMITS.PRICE_MIN,
  NUMBER_LIMITS.PRICE_MAX
)
export type Price = z.infer<typeof priceSchema>

const RATING_MIN = 0
const RATING_MAX = 5

/**
 * Aggregate star rating. Coerced the same way as money: the column behind it is
 * `decimal(10,2)`, and a field projection that stops replacing it with a number
 * would otherwise reject the whole restaurant record.
 * @example ratingSchema.parse("4.50") // -> 4.5
 */
export const ratingSchema = decimalSchema(RATING_MIN, RATING_MAX)

/** Image reference as stored today: a URL or an object key, never empty. */
const imageRefSchema = z.string().min(1).max(STRING_LIMITS.IMAGE_URL_MAX)

/**
 * An optional image reference that answers `null` when the stored value is
 * unusable, instead of failing the record that carries it.
 *
 * **This exists because a single bad column took down a whole indexed page.**
 * Measured against the development database on 2026-08-21: three tenants store
 * a base64 `data:` URI in the column this maps from — 11,282, 11,262 and 10,606
 * characters against an `IMAGE_URL_MAX` of 255. A listing page parses through
 * `z.array(...)`, so one such row failed the entire page and the area page
 * rendered its error boundary rather than sixteen restaurants. Four of the five
 * catalog reads failed the same way.
 *
 * Degrading is the correct answer independently of that incident, because the
 * app already reaches the same verdict one layer later: `isRenderableImageUrl`
 * requires an absolute `https://` URL before handing anything to the image
 * component, so an over-long ref, a `data:` URI and a bare object key are all
 * already "no image" at render time. The only thing a strict parse adds is that
 * the record dies before it can say so.
 *
 * `imageRefSchema` itself stays strict: it is what a write path or a fixture
 * should be validated against, and the tolerance belongs at the boundary where
 * untrusted upstream rows arrive, not in the definition of a valid reference.
 */
const degradableImageRefSchema = z
  .unknown()
  .nullish()
  .transform((value) => {
    const parsed = imageRefSchema.safeParse(value)

    return parsed.success ? parsed.data : null
  })

/**
 * Builds an array schema that keeps the entries it can parse and drops the rest.
 *
 * The companion to {@link degradableImageRefSchema} for a member that cannot be
 * nulled: `photoSchema.url` is required, so an unusable photo has no valid
 * degraded form and the honest answer is that the gallery is one image shorter.
 * A restaurant whose every photo is unusable therefore reports `[]` — it has no
 * gallery — and never `null`, which the transport contract reserves for "the
 * restaurant does not exist".
 *
 * Deliberately not a general-purpose "lenient array". It is applied only to
 * photos, where dropping an element loses nothing the page can act on. Applying
 * this to restaurants would silently shrink a listing, and a listing that
 * quietly omits a paying tenant is a worse failure than one that errors.
 *
 * It does **not** absorb `null`. The photos endpoint answers `null` to mean the
 * restaurant does not exist, and collapsing that to `[]` would report a missing
 * restaurant as an existing one with an empty gallery — turning a 404 into an
 * indexable 200, which is the exact failure the transport contract exists to
 * prevent. Callers that want the nullish-to-empty behaviour opt into it.
 * @param itemSchema - Schema for one element
 * @returns A schema whose output holds only the elements that parsed
 * @example lossyArraySchema(photoSchema).parse([{ url: "" }]) // -> []
 */
function lossyArraySchema<TItem extends z.ZodType>(itemSchema: TItem) {
  return z.array(z.unknown()).transform((value) =>
    value.flatMap((entry) => {
      const parsed = itemSchema.safeParse(entry)

      return parsed.success ? [parsed.data as z.output<TItem>] : []
    })
  )
}

/**
 * Builds an array schema that treats an absent key and a JSON `null` alike.
 * `.default([])` alone only fires on `undefined`, so a `null` on the wire would
 * throw and take the whole record down with it — a single null `cuisines`
 * would drop a restaurant out of an area listing.
 * @param itemSchema - Schema for one element
 * @returns A schema whose output is always an array
 * @example nullishArraySchema(z.string()).parse(null) // -> []
 */
function nullishArraySchema<TItem extends z.ZodType>(itemSchema: TItem) {
  return z
    .array(itemSchema)
    .nullish()
    .transform((value) => value ?? [])
}

/**
 * Builds a schema that treats an absent key and a JSON `null` alike, yielding a
 * value that is never `null`.
 *
 * **`.nullish().default(x)` does not do this**, and the difference is a whole
 * class of downstream `boolean | null`. `.default()` fires on `undefined` only,
 * so a column the backend sends as `null` — which every nullable column here
 * does — parses to `null` and every consumer inherits a third state nobody
 * wanted. `?? fallback` is used rather than a truthiness check so `false` and
 * `0` survive, which matters for `isAvailable` and `minSelections` respectively.
 *
 * Distinct from `.nullish().default(null)`, which is used elsewhere in this file
 * where `null` is the intended, meaningful output.
 * @param schema - Schema for a present value
 * @param fallback - What an absent or null value means
 * @returns A schema whose output is never `null`
 * @example nullishDefault(z.boolean(), true).parse(null) // -> true
 */
function nullishDefault<TSchema extends z.ZodType>(
  schema: TSchema,
  fallback: z.output<TSchema>
) {
  return schema
    .nullish()
    .transform((value) => (value ?? fallback) as z.output<TSchema>)
}

// ============================================================================
// OPENING HOURS
// ============================================================================

/** `HH:MM` on a 24-hour clock; a single-digit hour is tolerated on input. */
const TIME_REGEX = /^([01]?\d|2[0-3]):[0-5]\d$/

const MINUTES_PER_HOUR = 60
const TIME_PAD_WIDTH = 2

/** One day exactly as `businessHoursService` emits it: sparse, three ways to say closed. */
export const openingHoursDayInputSchema = z.object({
  dayOfWeek: dayOfWeekEnum,
  openTime: z.string().regex(TIME_REGEX).nullish(),
  closeTime: z.string().regex(TIME_REGEX).nullish(),
  isClosed: z.boolean().nullish()
})

/** One normalized day. Always present, always for the same seven days. */
interface OpeningHoursDayValue {
  dayOfWeek: DayOfWeek
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
  crossesMidnight: boolean
}

/**
 * Converts `HH:MM` to minutes past midnight so an overnight window can be
 * detected without lexical string comparison.
 * @param time - Validated `HH:MM` value
 * @returns Minutes since midnight
 */
function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":")

  return Number(hours) * MINUTES_PER_HOUR + Number(minutes)
}

/**
 * Renders minutes past midnight back as zero-padded `HH:MM`.
 * @param minutes - Minutes since midnight
 * @returns Padded `HH:MM` string
 */
function padTime(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const rest = minutes % MINUTES_PER_HOUR

  return `${String(hours).padStart(TIME_PAD_WIDTH, "0")}:${String(rest).padStart(TIME_PAD_WIDTH, "0")}`
}

/**
 * Normalizes one weekday, treating an absent entry, `isClosed: true` and a null
 * time as the same thing: closed.
 * @param day - Weekday being filled
 * @param entry - Raw entry for that day, if the backend sent one
 * @returns A fully populated day
 */
function toOpeningHoursDay(
  day: DayOfWeek,
  entry: z.infer<typeof openingHoursDayInputSchema> | undefined
): OpeningHoursDayValue {
  const closed: OpeningHoursDayValue = {
    dayOfWeek: day,
    openTime: null,
    closeTime: null,
    isClosed: true,
    crossesMidnight: false
  }

  if (
    !entry ||
    entry.isClosed === true ||
    !(entry.openTime && entry.closeTime)
  ) {
    return closed
  }

  const open = toMinutes(entry.openTime)
  const close = toMinutes(entry.closeTime)

  return {
    dayOfWeek: day,
    openTime: padTime(open),
    closeTime: padTime(close),
    isClosed: false,
    crossesMidnight: close < open
  }
}

/**
 * Weekly schedule normalized to seven sunday-first days. Overnight windows are
 * preserved and flagged rather than rejected.
 * @example openingHoursSchema.parse([]) // -> seven closed days
 */
export const openingHoursSchema = z
  .array(openingHoursDayInputSchema)
  .nullish()
  .transform((entries) => {
    const byDay = new Map(
      (entries ?? []).map((entry) => [entry.dayOfWeek, entry])
    )

    return DAY_OF_WEEK.map((day) => toOpeningHoursDay(day, byDay.get(day)))
  })
export type OpeningHours = z.infer<typeof openingHoursSchema>
export type OpeningHoursDay = OpeningHours[number]

/**
 * Open/closed state as the backend computes it. Never derived here — `mw-4-12`
 * decides who owns the derivation.
 */
export const businessHoursStatusKeySchema = z.enum([
  "open",
  "opens_at",
  "opens_tomorrow_at",
  "temporarily_unavailable"
])
export type BusinessHoursStatusKey = z.infer<
  typeof businessHoursStatusKeySchema
>

/**
 * Carried straight through from the backend; nothing in core computes it.
 * `nextOpenTime` is validated as a real ISO datetime (with or without an
 * offset) — any non-empty string would otherwise reach `new Date()` and render
 * as "Opens at Invalid Date".
 */
export const openStateSchema = z.object({
  openNow: z.boolean(),
  businessHoursStatusKey: businessHoursStatusKeySchema,
  nextOpenTime: z.iso.datetime({ offset: true }).nullish().default(null)
})
export type OpenState = z.infer<typeof openStateSchema>

// ============================================================================
// ENTITIES
// ============================================================================

/**
 * A gallery image. There is no alt/caption column anywhere today, so a `null`
 * alt is valid data — the app synthesizes alt text from the restaurant name.
 */
export const photoSchema = z.object({
  url: imageRefSchema,
  alt: z.string().max(STRING_LIMITS.NAME_MAX).nullish().default(null)
})
export type Photo = z.infer<typeof photoSchema>

/**
 * A gallery: every photo that could be parsed, and none that could not.
 *
 * Shared by the two reads that return photos — the detail record's embedded
 * `photos` and the dedicated photos endpoint — so a restaurant's gallery cannot
 * be one length on one page and another length on the next. Absence is still
 * the caller's to express: this schema only ever yields an array, and the
 * endpoint wraps it in `.nullable()` to say "no such restaurant".
 * @example photoArraySchema.parse([{ url: "https://x/a.png" }, { url: "" }]).length // -> 1
 */
export const photoArraySchema = lossyArraySchema(photoSchema)

/**
 * Card-sized restaurant record: everything an area or search listing renders.
 *
 * There is deliberately no `citySlug` / `areaSlug`. No backend response carries
 * either — both were withdrawn from the API on 2026-08-19 because a restaurant
 * has no city or area column to derive them from; the city was only ever an
 * echo of the request. A page URL needs a city segment, and the caller already
 * holds it: it rendered the `/{city}/{area}` route from the taxonomy constant
 * (`mw-0-12`). Adding them back here would make every listing parse fail.
 */
export const restaurantSummarySchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  name: localizedTextSchema,
  cuisines: nullishArraySchema(z.string().min(1)),
  // Degrading, not strict: an unusable stored reference becomes "no image"
  // rather than dropping the restaurant out of the listing it belongs in.
  coverImageUrl: degradableImageRefSchema,
  logoUrl: degradableImageRefSchema,
  rating: ratingSchema.nullish().default(null),
  reviewCount: z.number().int().min(0).default(0),
  deliveryFee: priceSchema.nullish().default(null),
  minimumOrder: priceSchema.nullish().default(null),
  prepTimeMinMinutes: z.number().int().min(0).nullish().default(null),
  prepTimeMaxMinutes: z.number().int().min(0).nullish().default(null),
  fulfillment: orderFulfillmentEnum,
  openState: openStateSchema,
  /**
   * The category this restaurant belongs to, when the producer named one.
   *
   * Nullish and degrading, like every other optional field here: a listing that
   * omits it renders a card that simply does not answer the category question,
   * rather than dropping the restaurant. The home page's category tiles filter
   * on it and treat a null as "not a match", which is the only honest reading —
   * an uncategorised record is not evidence of belonging to the tile pressed.
   */
  categoryId: z.string().min(1).nullish().default(null)
})
export type RestaurantSummary = z.infer<typeof restaurantSummarySchema>

/** Everything the restaurant page needs above and below the fold. */
export const restaurantDetailSchema = restaurantSummarySchema.extend({
  description: optionalLocalizedTextSchema,
  address: optionalLocalizedTextSchema,
  phone: z.string().max(STRING_LIMITS.PHONE_MAX).nullish().default(null),
  coordinates: coordinatesSchema.nullish().default(null),
  openingHours: openingHoursSchema,
  // Lossy, and nullish-tolerant here specifically: a photo whose `url` is
  // unusable is dropped (it has no degraded form), and an absent or null key on
  // a restaurant that *does* exist means "no gallery". The endpoint's own
  // null — "no such restaurant" — is expressed by its `.nullable()` wrapper,
  // never here.
  photos: photoArraySchema.nullish().transform((value) => value ?? [])
})
export type RestaurantDetail = z.infer<typeof restaurantDetailSchema>

/**
 * One orderable product, as a menu listing carries it.
 *
 * **`slug` is present and nullable, and both halves of that matter.** The menu
 * projection has always emitted it (`publicCatalogService.ts`, `slug:
 * row.productSlug ?? null`) and this schema silently dropped it, which is why
 * nothing on the menu page could address an item by anything but its UUID. The
 * column is nullable behind a `slug IS NULL OR slug ~ '^[a-z0-9-]+$'` check, so
 * the null is real data rather than a defensive flourish — 111 of 111 live items
 * carry one today, and a caller still has to be able to fall back to the id.
 *
 * It is deliberately **not** `slugSchema`: that brand is for slugs a URL is
 * built from, and an item slug never becomes a path segment (`mw-1-7` puts item
 * detail behind `?item=` rather than a sixth URL shape). Branding it would also
 * make a null impossible to express.
 */
export const menuItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().nullable(),
  name: localizedTextSchema,
  description: optionalLocalizedTextSchema,
  price: priceSchema,
  // Degrading, for the same reason and from the same column class as the
  // restaurant images: a product photo stored as an oversized `data:` URI must
  // cost that item its picture, not cost the restaurant its whole menu. The
  // menu response is a plain `z.array`, so one poisoned product would take the
  // entire read to the error boundary.
  imageUrl: degradableImageRefSchema,
  isAvailable: z.boolean().default(true)
})
export type MenuItem = z.infer<typeof menuItemSchema>

/** A menu section. `categories.slug` is the one slug that exists today. */
export const menuCategorySchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  name: localizedTextSchema,
  description: optionalLocalizedTextSchema,
  items: nullishArraySchema(menuItemSchema)
})
export type MenuCategory = z.infer<typeof menuCategorySchema>

// ============================================================================
// ITEM DETAIL
// ============================================================================

/**
 * One choice inside a picker.
 *
 * `priceModifier` is parsed through {@link parsePriceModifier} rather than
 * `priceSchema`, and the difference is deliberate. A modifier is a **delta**, so
 * the `PRICE_MIN` floor of `0` that `priceSchema` enforces is wrong for it — a
 * "no cheese" option worth `-50` is a legal deal-pricing shape the column
 * allows. And an unreadable modifier must cost that option its surcharge rather
 * than cost the whole item its page, which is the same degrade-don't-die rule
 * `degradableImageRefSchema` applies one field over.
 *
 * Measured on `api-dev` 2026-08-22: `priceModifier` is `"0.00"` on all 111 live
 * options and `isPopular` is `false` on all of them. Both are implemented
 * because they are the contract, and neither earns UI chrome that production
 * never populates.
 */
export const menuItemOptionSchema = z.object({
  id: z.string().min(1),
  name: localizedTextSchema,
  position: nullishDefault(z.number().int().min(0), 0),
  priceModifier: z.unknown().transform(parsePriceModifier),
  isPopular: nullishDefault(z.boolean(), false)
})
export type MenuItemOption = z.infer<typeof menuItemOptionSchema>

/**
 * One picker on an item.
 *
 * **`selectionType` defaults to `"single"`, and every value that is not
 * `"multiple"` means single-select.** That is the one predicate splitting the
 * two kinds of picker apart, ported from mobile's `variantSelection.ts`, and it
 * has to treat `undefined` as single because the column is nullable and a
 * missing value historically rendered as a radio group. `"single"` is the only
 * value in production — 43 of 43 live variants — while `"multiple"` has zero
 * instances and is implemented from the contract alone.
 *
 * `minSelections` and `maxSelections` are carried rather than enforced here: a
 * schema cannot see a selection. `selectionComplete` in `item-selection.ts`
 * owns them, including the `maxSelections` ceiling mobile checks only inside its
 * widget and never at add-to-cart.
 */
export const menuItemVariantSchema = z.object({
  id: z.string().min(1),
  name: localizedTextSchema,
  position: nullishDefault(z.number().int().min(0), 0),
  selectionType: nullishDefault(z.enum(["single", "multiple"]), "single"),
  minSelections: nullishDefault(z.number().int().min(0), 0),
  // The one member here that stays nullable: `null` means "no ceiling", which
  // is a real rule and not an absent value. It is `null` on every live variant.
  maxSelections: z.number().int().min(1).nullish().default(null),
  isRequired: nullishDefault(z.boolean(), false),
  options: nullishArraySchema(menuItemOptionSchema)
})
export type MenuItemVariant = z.infer<typeof menuItemVariantSchema>

/** One option as a combination names it, carrying the variant it belongs to. */
export const menuItemCombinationOptionSchema = z.object({
  id: z.string().min(1),
  variantId: z.string().min(1),
  name: localizedTextSchema
})
export type MenuItemCombinationOption = z.infer<
  typeof menuItemCombinationOptionSchema
>

/**
 * One purchasable price point at this branch.
 *
 * `price` is **required and not nullable**, which is what makes
 * `combinationPrice` able to return a legitimate `0` rather than silently
 * substituting the item's base price the way mobile's `combinationPriceOrBase`
 * does (ledger M-038).
 *
 * `isAvailable` is the field mobile never reads. Measured 2026-08-22: 13 of 160
 * live combinations are `false`, and one item has every combination `false`.
 */
export const menuItemCombinationSchema = z.object({
  id: z.string().min(1),
  price: priceSchema,
  /**
   * The branch `product_inventory` row this combination prices from — the id
   * `POST /orders` identifies a chosen combination by. Dormant until `be-3-1a`
   * projects it (see `docs/features/marketplace-web-variants-addons-backend-handover.md`);
   * `null` until then, and the cart stores it only when present.
   */
  inventoryId: z.string().min(1).nullish().default(null),
  /** Strike-through price, when the branch set one. Dormant until `be-3-1b`. */
  compareAtPrice: priceSchema.nullish().default(null),
  isAvailable: nullishDefault(z.boolean(), true),
  options: nullishArraySchema(menuItemCombinationOptionSchema)
})
export type MenuItemCombination = z.infer<typeof menuItemCombinationSchema>

/**
 * One add-on offered alongside an item.
 *
 * `id` is the **link** id — unique per `(product, addon)` pair, not the add-on
 * product's own id — so two items offering the same add-on carry two different
 * ids here.
 *
 * **`selectedCombinationIds` is `.nullable()` and must never collapse to `[]`.**
 * `null` means the add-on applies to every combination; an empty array would
 * mean it applies to none, and treating the two alike would silently withdraw an
 * add-on from every item that offers one unconditionally. Measured 2026-08-22:
 * non-null on 4 of the 5 live add-ons, all inside one tenant.
 */
export const menuItemAddonSchema = z.object({
  id: z.string().min(1),
  isRequired: nullishDefault(z.boolean(), false),
  position: nullishDefault(z.number().int().min(0), 0),
  selectedCombinationIds: z.array(z.string().min(1)).nullish().default(null),
  product: z.object({
    id: z.string().min(1),
    name: localizedTextSchema,
    description: optionalLocalizedTextSchema,
    imageUrl: degradableImageRefSchema
  }),
  price: priceSchema,
  /** The add-on's branch inventory row id — `be-3-1a`'s half for add-ons. */
  inventoryId: z.string().min(1).nullish().default(null),
  /** Strike-through price, when the branch set one. Dormant until `be-3-1b`. */
  compareAtPrice: priceSchema.nullish().default(null),
  isAvailable: nullishDefault(z.boolean(), true)
})
export type MenuItemAddon = z.infer<typeof menuItemAddonSchema>

/**
 * Everything endpoint 7 projects for one item: the whole variant / option /
 * combination / add-on tree, per-combination price and per-combination
 * availability.
 *
 * **Three quarters of production has none of it.** Measured on `api-dev`
 * 2026-08-22 across 111 items in 28 restaurants: 81 items (73%) carry zero
 * variants, zero combinations and zero add-ons, and every collection here is
 * therefore a `nullishArraySchema` rather than a required key — an item with
 * nothing to configure is the common shape, not the degenerate one.
 *
 * `price` is nullable on the contract even though it is null on 0 of 111 live
 * items: it is documented as "cheapest purchasable price at this branch", which
 * has no value for an item whose combinations were all dropped for want of
 * inventory. `combinations` being empty and `price` being null are the same
 * condition seen from two sides, and a caller has to survive both.
 *
 * `images` is lossy for the reason `photoArraySchema` is: an unusable reference
 * makes the gallery one image shorter, never the item unrenderable. Live
 * lengths are 1 on 108 items, 2 on two and 3 on one — **never 0** — so the
 * empty case is a contract case rather than an observed one.
 */
export const menuItemDetailSchema = z.object({
  id: z.string().min(1),
  slug: z.string().nullable(),
  name: localizedTextSchema,
  description: optionalLocalizedTextSchema,
  imageUrl: degradableImageRefSchema,
  images: lossyArraySchema(imageRefSchema)
    .nullish()
    .transform((value) => value ?? []),
  price: priceSchema.nullish().default(null),
  /** Strike-through price for the item's own price line. Dormant until `be-3-1b`. */
  compareAtPrice: priceSchema.nullish().default(null),
  /**
   * The product's own (non-combination) branch inventory row id — the
   * orderable line for the 73% of items with no combinations at all.
   * `publicCatalogService.ts`'s `directRow`; `null` for an item that only
   * sells through combinations, or with no inventory row at this branch.
   */
  inventoryId: z.string().min(1).nullish().default(null),
  isAvailable: nullishDefault(z.boolean(), true),
  variants: nullishArraySchema(menuItemVariantSchema),
  combinations: nullishArraySchema(menuItemCombinationSchema),
  addons: nullishArraySchema(menuItemAddonSchema)
})
export type MenuItemDetail = z.infer<typeof menuItemDetailSchema>

/** `/search` payload: restaurants and the areas worth suggesting alongside them. */
export const catalogSearchResultsSchema = z.object({
  query: z.string(),
  total: z.number().int().min(0),
  restaurants: nullishArraySchema(restaurantSummarySchema),
  areas: nullishArraySchema(areaSchema)
})
export type CatalogSearchResults = z.infer<typeof catalogSearchResultsSchema>

// ============================================================================
// PAGINATION, ENVELOPES AND LIST PAYLOADS
// ============================================================================

const PAGE_LIMIT_DEFAULT = 20
const PAGE_LIMIT_MAX = 50

/**
 * Pagination members every list response carries.
 *
 * `total` is **required on purpose**, and so is the array key beside it in
 * `discoveryPageSchema`. Defaulted, a key mismatch would parse as a valid empty
 * page and an area with 12 restaurants would render zero cards at 200 OK,
 * indexable. The requirements forbid publishing an empty area page, so this
 * fails loudly instead. `page` and `limit` only describe the window the server
 * chose and are safe to default.
 */
const PAGINATION_SHAPE = {
  total: z.number().int().min(0),
  page: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).default(PAGE_LIMIT_DEFAULT)
}

/** Offset pagination on the way in. `page` is 0-indexed, matching the response. */
export const paginationQuerySchema = z.object({
  page: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(PAGE_LIMIT_MAX).default(PAGE_LIMIT_DEFAULT)
})
export type PaginationQuery = z.infer<typeof paginationQuerySchema>

/**
 * `GET home/section/view-all` query string — the one catalog read that borrows
 * an endpoint that already exists rather than proposing a new one.
 *
 * `lat`/`lng` are the area's query point, taken from `areaSchema.coordinates`;
 * `radiusKm` is the area's `radiusKm` from the `mw-0-12` constant.
 *
 * `radiusKm` is **required**, and that is the whole point. An earlier version of
 * this schema omitted it on the premise that supplying one overrides the
 * per-tenant delivery boundary. It does not: `buildLocationConditions` in
 * `business-discovery-backend` (`home-queries.ts`) combines the two with
 * `and(...)`, so a radius narrows the answer and never replaces the boundary.
 *
 * Omitting it does not mean "unbounded" either — `getDefaultBrowseRadiusKm`
 * substitutes one. On Fishtownco that is `tenant_zone_config.onboardingRadiusKm`, a
 * DB-configured value that can be anything up to the cap; elsewhere it is
 * `GEO_CONSTANTS.DEFAULT_SEARCH_RADIUS_KM` (30). Either way the caller does not
 * choose it. And `buildDeliveryAreaBrowseCondition` skips the per-tenant
 * boundary entirely for any tenant that is not `own_rider` + delivery/hybrid,
 * so for that whole class the radius is the only geographic bound there is —
 * which is how a default makes every area page in one city return the same
 * restaurants.
 *
 * Backend symbols are named rather than line-cited on purpose: that repo is an
 * unpinned sibling and line numbers rot on its first edit.
 *
 * `section` is required by the service, and it is pinned to `topPlaces` — the
 * plain, ungated listing.
 *
 * **It is emphatically not `nearbyPlaces`, whatever that name suggests.** That
 * section is internally "Big Brands Nearby You": on top of the normal visibility
 * rules it requires the branch's parent chain to hold at least one *other*
 * visible marketplace branch. Nothing in the development database satisfies
 * that, so it returns zero rows at **every** geography — measured 2026-08-21 at
 * 1, 5 and 30km across four cities, and against a polygon covering all of
 * Pakistan. The emptiness is data, not code; populating big-brand chains would
 * be seed data, never a fix. `topPlaces` has an identical item shape and
 * identical `lat`/`lng`/`radiusKm` semantics, with no such gate.
 *
 * Taken from `HOME_SECTIONS` rather than written as a string literal. The wrong
 * value survived contract alignment precisely because it was hand-typed here
 * while the backend-shared constant sat one import away — and it was found only
 * after the first page built on it had already merged.
 * @example areaListingQuerySchema.parse({ lat: 32.1877, lng: 74.1945, radiusKm: 5 })
 */
export const areaListingQuerySchema = paginationQuerySchema.extend({
  section: z.literal(HOME_SECTIONS.TopPlaces).default(HOME_SECTIONS.TopPlaces),
  lat: z
    .number()
    .min(NUMBER_LIMITS.LATITUDE_MIN)
    .max(NUMBER_LIMITS.LATITUDE_MAX),
  lng: z
    .number()
    .min(NUMBER_LIMITS.LONGITUDE_MIN)
    .max(NUMBER_LIMITS.LONGITUDE_MAX),
  // Same bound the taxonomy's seed guard uses, so a radius that passes the
  // build cannot fail the request. `0` is rejected because it parses upstream
  // and then matches nothing.
  radiusKm: z.number().positive().max(NUMBER_LIMITS.RADIUS_MAX)
})
export type AreaListingQuery = z.infer<typeof areaListingQuerySchema>

/**
 * Wraps a payload in the discovery-service envelope `{ success, message, data }`.
 * There is no `statusCode` field — do not add one.
 *
 * `success` is `z.literal(true)`, not `z.boolean()`, and that is load-bearing.
 * This backend answers some failures with a 200 and `{ success: false, message,
 * data: null }`. Parsed permissively, that `null` reaches the transport, which
 * reports "absent", and the caller answers `notFound()` — turning an upstream
 * outage into a soft 404 that Google indexes. An envelope that says it failed
 * must fail to parse, so the transport throws instead.
 * @param dataSchema - Schema for the `data` member
 * @returns Envelope schema around `dataSchema`
 * @example catalogEnvelopeSchema(citySchema).parse({ data: city })
 */
export function catalogEnvelopeSchema<TData extends z.ZodType>(
  dataSchema: TData
) {
  return z.object({
    success: z.literal(true).optional(),
    message: z.string().optional(),
    data: dataSchema
  })
}

// ============================================================================
// THE BORROWED DISCOVERY LISTING
// ============================================================================

/**
 * Wraps a page whose array key is `data`, not `items`.
 *
 * `home/section/view-all` is the mobile app's endpoint, borrowed for area
 * pages (`be-2-9`). Its envelope nests a second `data`: `{ success, data: {
 * data: [...], total, page, limit, appliedFilters } }`. That shape cannot be
 * changed to match `catalogPageSchema` without breaking the app, so this domain
 * adapts instead — and normalizes to `items` on the way out, so nothing
 * downstream has to know which endpoint a page came from.
 *
 * `appliedFilters` is dropped: it echoes the request, and this domain never
 * sends filters.
 * @param itemSchema - Schema for one row
 * @returns A page schema that reads `data` and yields `items`
 * @example discoveryPageSchema(z.string()).parse({ data: [], total: 0 })
 */
export function discoveryPageSchema<TItem extends z.ZodType>(
  itemSchema: TItem
) {
  return z
    .object({ data: z.array(itemSchema), ...PAGINATION_SHAPE })
    .transform(({ data, ...pagination }) => ({ items: data, ...pagination }))
}

/** Sentinel open state for a row whose hours the service could not resolve. */
const UNRESOLVED_OPEN_STATE = {
  openNow: false,
  businessHoursStatusKey: "temporarily_unavailable",
  nextOpenTime: null
} as const

/**
 * Normalizes the three flat open-state fields a discovery row carries into the
 * nested `openState` the rest of this domain uses.
 *
 * Every field is treated as untrustworthy on purpose. The service types
 * `businessHoursStatusKey` as a bare string and omits the trio entirely when
 * business-hours resolution is skipped, and a strict parse would drop the whole
 * restaurant card from an indexed area page over a status label. An
 * unrecognized or absent state degrades to "temporarily unavailable", which is
 * literally what it means: we cannot say.
 * @param row - Raw row fields carrying the flat open state
 * @returns A value that satisfies `openStateSchema`
 */
function toOpenState(row: {
  openNow?: boolean | null
  businessHoursStatusKey?: string | null
  nextOpenTime?: string | null
}): z.input<typeof openStateSchema> {
  const key = businessHoursStatusKeySchema.safeParse(row.businessHoursStatusKey)

  if (!key.success) {
    return UNRESOLVED_OPEN_STATE
  }

  const nextOpenTime = z.iso
    .datetime({ offset: true })
    .safeParse(row.nextOpenTime)

  return {
    openNow: row.openNow ?? false,
    businessHoursStatusKey: key.data,
    nextOpenTime: nextOpenTime.success ? nextOpenTime.data : null
  }
}

/** Treats an empty-string image column as absent — `imageRefSchema` rejects `""`. */
const discoveryImageSchema = z
  .string()
  .nullish()
  .transform((value) => (value && value.length > 0 ? value : null))

/** Decimal columns arrive as strings or numbers; `priceSchema` coerces either. */
const discoveryDecimalSchema = z.union([z.number(), z.string()]).nullish()

/**
 * Slug format check without the `Slug` brand. The brand is applied downstream by
 * `restaurantSummarySchema`; branding here too would make this schema's output
 * narrower than that schema's input and break the `.pipe`.
 */
const unbrandedSlugSchema = z
  .string()
  .min(1)
  .max(STRING_LIMITS.NAME_MAX)
  .regex(SLUG_REGEX)

/**
 * One row of the borrowed discovery listing, mapped onto `RestaurantSummary`.
 *
 * The app's row is a tenant record with enrichment bolted on, so almost every
 * name differs from this domain's: `restaurantPicture`/`coverPicture` rather
 * than `logoUrl`/`coverImageUrl`, `totalReviews` rather than `reviewCount`,
 * `timeRange.{min,max}` rather than the two prep-time fields, and a flat
 * open-state trio rather than a nested `openState`. Mapping lives here rather
 * than in a screen so both apps read one shape.
 *
 * `cuisines` is always empty. The listing query selects tenant columns only and
 * never joins `restaurants`, so cuisine tags have no source on this endpoint —
 * unlike `search`, which does return them. A card must not invent one.
 *
 * Unknown keys are dropped, which is load-bearing: this endpoint currently
 * returns whole tenant rows, so its payload includes owner KYC, tax and
 * commission columns. Parsing through this schema is what keeps them out of the
 * rendered page and the ISR cache.
 * @example discoveryRestaurantSchema.parse({ id: "1", slug: "al-rehman", name: { en: "Al Rehman" }, orderFulfillment: "delivery" })
 */
export const discoveryRestaurantSchema = z
  .object({
    id: z.string().min(1),
    slug: unbrandedSlugSchema,
    name: localizedTextInputSchema,
    restaurantPicture: discoveryImageSchema,
    coverPicture: discoveryImageSchema,
    categoryId: z.string().min(1).nullish(),
    rating: discoveryDecimalSchema,
    totalReviews: z.number().int().min(0).nullish(),
    deliveryFee: discoveryDecimalSchema,
    minimumOrderValue: discoveryDecimalSchema,
    timeRange: z
      .object({ min: z.number().int().min(0), max: z.number().int().min(0) })
      .nullish(),
    orderFulfillment: orderFulfillmentEnum,
    openNow: z.boolean().nullish(),
    businessHoursStatusKey: z.string().nullish(),
    nextOpenTime: z.string().nullish()
  })
  .transform(
    (row): z.input<typeof restaurantSummarySchema> => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      categoryId: row.categoryId,
      cuisines: [],
      coverImageUrl: row.coverPicture,
      logoUrl: row.restaurantPicture,
      rating: row.rating,
      reviewCount: row.totalReviews ?? 0,
      deliveryFee: row.deliveryFee,
      minimumOrder: row.minimumOrderValue,
      prepTimeMinMinutes: row.timeRange?.min ?? null,
      prepTimeMaxMinutes: row.timeRange?.max ?? null,
      fulfillment: row.orderFulfillment,
      openState: toOpenState(row)
    })
  )
  .pipe(restaurantSummarySchema)

/**
 * What the `/{city}` page consumes. No endpoint returns this: there is no
 * list-areas read, so a `CatalogTransport` assembles it from the taxonomy
 * constant (`mw-0-12`). It still carries the **city record itself**, so the page
 * has a source for its own name and description, and `total` so a listing can
 * render "N areas" rather than counting a truncated page.
 */
export const cityAreasSchema = z.object({
  city: citySchema,
  areas: nullishArraySchema(areaSchema),
  ...PAGINATION_SHAPE
})
export type CityAreas = z.infer<typeof cityAreasSchema>

/**
 * What the `/{city}/{area}` page consumes. A `CatalogTransport` assembles it:
 * the **area record** comes from the taxonomy constant (`mw-0-12`) and supplies
 * the page heading, intro copy and `BreadcrumbList` JSON-LD, while the
 * restaurants come from `CATALOG_ENDPOINTS.listAreaRestaurants`, queried once
 * per `area.coordinates` entry and deduped by restaurant id. `total` feeds the
 * "N restaurants" line.
 */
export const areaRestaurantsSchema = z.object({
  area: areaSchema,
  restaurants: nullishArraySchema(restaurantSummarySchema),
  ...PAGINATION_SHAPE
})
export type AreaRestaurants = z.infer<typeof areaRestaurantsSchema>

/**
 * `GET public/search` query string. Search is the one catalog read that is
 * entirely query-shaped, so its parameter names are part of the contract, not
 * an implementation detail of whoever writes the fetch call.
 *
 * There is no `city` narrowing. The parameter existed in an earlier draft and
 * was withdrawn on 2026-08-19 — the service ignored it, so sending it bought a
 * false promise of a scoped result set. Search is global; a city-scoped result
 * would have to be filtered by the caller against the taxonomy constant.
 * @example catalogSearchQuerySchema.parse({ q: "biryani" })
 */
export const catalogSearchQuerySchema = paginationQuerySchema.extend({
  q: z.string().min(1).max(STRING_LIMITS.SEARCH_MAX)
})
export type CatalogSearchQuery = z.infer<typeof catalogSearchQuerySchema>
// ============================================================================
// HOME PAGE (mw-1-10)
// ============================================================================

/**
 * `GET home/data` / `GET categories` query string.
 *
 * Both reads take exactly this shape: no `page`/`limit` (`home/data` returns
 * its own per-section window), no `filters`/`rating4Plus`/`categoryId`
 * (visual-only this story), no per-user field (Rule 5b — nothing here may make
 * the response uncacheable).
 *
 * `lat`/`lng`/`radiusKm` are **never derived from a city point.**
 * `resolveCity("gujranwala").coordinates` is `null` by the mw-0-12 decision
 * that `/{city}` never queries by point, so every value comes from one of the
 * city's live areas' own interior points. See `home-listing.ts`.
 * @example homeListingQuerySchema.parse({ lat: 32.102014, lng: 74.20889, radiusKm: 5 })
 */
export const homeListingQuerySchema = z.object({
  lat: z
    .number()
    .min(NUMBER_LIMITS.LATITUDE_MIN)
    .max(NUMBER_LIMITS.LATITUDE_MAX),
  lng: z
    .number()
    .min(NUMBER_LIMITS.LONGITUDE_MIN)
    .max(NUMBER_LIMITS.LONGITUDE_MAX),
  radiusKm: z.number().positive().max(NUMBER_LIMITS.RADIUS_MAX)
})
export type HomeListingQuery = z.infer<typeof homeListingQuerySchema>

/**
 * One restaurant as `home/data`'s tenant-shaped sections carry it.
 *
 * Mapped onto `restaurantSummarySchema` the same way `discoveryRestaurantSchema`
 * is, because these rows feed the identical `RestaurantCard`. The output IS a
 * `RestaurantSummary`, not a parallel shape a component has to learn.
 *
 * `cuisines` is always `[]` — this section selects tenant columns only and has
 * no cuisines field. `fulfillment` has no source field either and is fixed to
 * `"delivery"`: it is the one member `RestaurantCard` never renders, so the
 * default cannot surface as a wrong badge; it exists to satisfy
 * `restaurantSummarySchema`. `minimumOrder` and the prep-time members are
 * absent for the same reason.
 * @example homeTenantItemSchema.parse({ id: "1", slug: "al-rehman", name: { en: "Al Rehman" }, coverPicture: null, restaurantPicture: null, rating: null, totalReviews: 0, deliveryFee: "0", freeDelivery: true, openNow: true, businessHoursStatusKey: "open", nextOpenTime: null }).fulfillment // -> "delivery"
 */
export const homeTenantItemSchema = z
  .object({
    id: z.string().min(1),
    slug: unbrandedSlugSchema,
    name: localizedTextInputSchema,
    coverPicture: discoveryImageSchema,
    restaurantPicture: discoveryImageSchema,
    categoryId: z.string().min(1).nullish(),
    rating: discoveryDecimalSchema,
    totalReviews: z.number().int().min(0).nullish(),
    deliveryFee: discoveryDecimalSchema,
    freeDelivery: z.boolean().nullish(),
    openNow: z.boolean().nullish(),
    businessHoursStatusKey: z.string().nullish(),
    nextOpenTime: z.string().nullish()
  })
  .transform(
    (row): z.input<typeof restaurantSummarySchema> => ({
      categoryId: row.categoryId,
      cuisines: [],
      deliveryFee: row.deliveryFee,
      coverImageUrl: row.coverPicture,
      fulfillment: "delivery",
      id: row.id,
      logoUrl: row.restaurantPicture,
      name: row.name,
      openState: toOpenState(row),
      rating: row.rating,
      reviewCount: row.totalReviews ?? 0,
      slug: row.slug
    })
  )
  .pipe(restaurantSummarySchema)
export type HomeTenantItem = z.infer<typeof homeTenantItemSchema>

/**
 * One dish as every non-tenant-shaped `home/data` section carries it.
 *
 * **No `isAvailable` field, and that is not an oversight.** `home/data`'s
 * inventory join excludes zero-stock rows entirely, so the sold-out dish-card
 * variant the mock shows has no state to render from real data.
 *
 * `compareAtPrice` is the only source of the derived discount badge
 * (`discount.ts`); no promo or "BESTSELLER" badge field exists on this
 * contract and none is invented here.
 *
 * `branch.slug` is nullish — a dish that cannot name its branch's slug renders
 * as a non-linking card (`dish-card.tsx`).
 * @example homeProductItemSchema.parse({ id: "1", slug: "zinger-burger", name: { en: "Zinger Burger" }, images: [], price: "650", branch: { name: { en: "Al Rehman" } } }).price // -> 650
 */
export const homeProductItemSchema = z.object({
  /** The category this dish belongs to; see `RestaurantSummary.categoryId`. */
  categoryId: z.string().min(1).nullish().default(null),
  branch: z.object({
    name: localizedTextSchema,
    slug: z.string().min(1).nullish().default(null)
  }),
  compareAtPrice: priceSchema.nullish().default(null),
  id: z.string().min(1),
  images: lossyArraySchema(imageRefSchema)
    .nullish()
    .transform((value) => value ?? []),
  name: localizedTextSchema,
  price: priceSchema,
  rating: ratingSchema.nullish().default(null),
  slug: z.string().min(1),
  totalReviews: z.number().int().min(0).nullish().default(0)
})
export type HomeProductItem = z.infer<typeof homeProductItemSchema>

/**
 * Title, optional subtitle and the "View all" count, per section.
 *
 * `title`/`description` are localized jsonb on the wire — measured live
 * 2026-08-25 (`{ en, ar, ur }`) — never the bare string the backend's own type
 * comment suggests. `localizedTextSchema` still accepts a bare string, so this
 * is a widening, not a break.
 */
const homeSectionMetadataSchema = z.object({
  description: optionalLocalizedTextSchema,
  /**
   * The backend's card-shape hint: `square` sections carry tenant rows,
   * `rectangle` sections carry dishes. Optional — `home/data` does not send it
   * today — but when present it outranks every client-side guess, which is the
   * same precedence the mobile app's `resolveHomeSectionShape` uses.
   */
  shape: z.enum(["square", "rectangle"]).nullish().default(null),
  title: localizedTextSchema,
  totalCount: z.number().int().min(0).nullish().default(null)
})

/** One section before its `data` array is known to hold tenants or dishes. */
const homeSectionEnvelopeSchema = z.object({
  data: z.array(z.unknown()),
  metadata: homeSectionMetadataSchema,
  // Any non-empty name, deliberately NOT `homeSectionEnum`. The backend adds
  // sections without a client release, and the enum gate meant every addition
  // was invisible on the web until a shared-constants pin bump (`desiFood`,
  // 2026-08-26, first threw and then — once the gate was added — silently
  // never rendered). The name is data; the SHAPE decides how rows parse.
  section: z.string().min(1)
})

/** How a section's rows render: restaurant cards or dish cards. */
export type HomeSectionKind = "product" | "tenant"

/**
 * The tenant-shaped sections on this contract — `data` carries restaurant/branch
 * rows, not dishes.
 *
 * `trendingNow` was added here 2026-08-25: `home/data` measured live returns
 * full tenant rows for it, and parsing it as a dish threw on every non-empty
 * payload.
 */
const TENANT_SHAPED_SECTIONS: ReadonlySet<string> = new Set([
  HOME_SECTIONS.TopPlaces,
  HOME_SECTIONS.TrendingNow
])

/**
 * Row heuristic for a section neither the shape hint nor the name map covers.
 *
 * Mirrors the mobile app's `unmatchedHomeSectionKind` exactly: a row with a
 * logo/cover and no price-like field is a tenant, anything else is a product.
 * Mirroring matters — the two clients must classify a new backend section the
 * same way or the same rail renders as restaurants on one and dishes on the
 * other.
 * @param row - The section's first raw row, or `undefined` when it is empty
 * @returns The inferred kind; `product` when nothing distinguishes the row
 */
function inferSectionKind(row: unknown): HomeSectionKind {
  if (typeof row !== "object" || row === null) {
    return "product"
  }

  const candidate = row as Record<string, unknown>
  const looksLikeTenant = Boolean(
    candidate.logo ?? candidate.restaurantPicture ?? candidate.coverPicture
  )
  const looksLikeProduct =
    candidate.price !== undefined ||
    candidate.inventoryId !== undefined ||
    candidate.compareAtPrice !== undefined

  return looksLikeTenant && !looksLikeProduct ? "tenant" : "product"
}

/**
 * Decides how a section's rows parse and render, in fixed precedence:
 * the server's `metadata.shape` hint, then the known-name map, then the row
 * heuristic. The server always wins when it speaks — that is what makes the
 * stack backend-driven rather than client-curated.
 * @param section - The section's name, exactly as the server sent it
 * @param shape - The server's card-shape hint, when present
 * @param rows - The section's raw rows
 * @returns The kind its rows parse under
 */
function resolveSectionKind(
  section: string,
  shape: "rectangle" | "square" | null | undefined,
  rows: readonly unknown[]
): HomeSectionKind {
  if (shape === "square") {
    return "tenant"
  }
  if (shape === "rectangle") {
    return "product"
  }
  if (TENANT_SHAPED_SECTIONS.has(section)) {
    return "tenant"
  }
  if (isHomeSection(section)) {
    return "product"
  }

  return inferSectionKind(rows[0])
}

/**
 * One entry of `GET home/data`'s ordered section list.
 *
 * **`data`'s item shape is picked from the resolved {@link HomeSectionKind},
 * never guessed per row.** A blind `z.union` would accept `[]` under either
 * schema and would let a malformed tenant row re-parse as a coincidentally
 * matching dish.
 *
 * Strictness follows whether the name is on the pinned contract: a KNOWN
 * section still throws on a malformed row — that is a real contract break and
 * hiding it would un-measure it — while an UNKNOWN section drops rows that do
 * not parse, because a section this build has never heard of must degrade to
 * "rendered without the bad row" rather than take the page down.
 *
 * A section with an empty `data` array still parses — "empty is valid" is the
 * contract — and it is the caller's job to omit it from the rendered stack.
 * @example homeSectionSchema.parse({ section: "topPlaces", metadata: { title: "Nearby top brands", description: null, totalCount: 1 }, data: [] }).kind // -> "tenant"
 */
/**
 * Lossily parses an unknown section's rows under one kind.
 * @param rows - The section's raw rows
 * @param kind - The kind to parse under
 * @returns Every row that parses; failures are dropped
 */
function parseUnknownRows(rows: readonly unknown[], kind: HomeSectionKind) {
  const rowSchema =
    kind === "tenant" ? homeTenantItemSchema : homeProductItemSchema

  return rows.flatMap((item) => {
    const result = rowSchema.safeParse(item)

    return result.success ? [result.data] : []
  })
}

export const homeSectionSchema = homeSectionEnvelopeSchema.transform((raw) => {
  const known = isHomeSection(raw.section)
  let kind = resolveSectionKind(raw.section, raw.metadata.shape, raw.data)
  let data: (HomeProductItem | HomeTenantItem)[]

  if (known) {
    const rowSchema =
      kind === "tenant" ? homeTenantItemSchema : homeProductItemSchema

    data = raw.data.map((item) => rowSchema.parse(item))
  } else {
    data = parseUnknownRows(raw.data, kind)

    // Fall over to the other kind when the declared one parses NOTHING out of
    // a non-empty section. The backend defaults `shape` to `rectangle` for a
    // section missing from its own metadata map, so a new tenant-shaped
    // section whose author forgot that map arrives mis-declared — and "the
    // backend added a section" must never require a frontend change, an
    // authoring slip included. A section whose rows parse under NEITHER kind
    // still degrades to empty and is omitted, never thrown on.
    if (data.length === 0 && raw.data.length > 0) {
      const otherKind: HomeSectionKind =
        kind === "tenant" ? "product" : "tenant"
      const fallover = parseUnknownRows(raw.data, otherKind)

      if (fallover.length > 0) {
        kind = otherKind
        data = fallover
      }
    }
  }

  return {
    // Cast settles the union-of-items array rather than the union OF arrays a
    // ternary would infer: merging per-point pages in `home-listing.ts` pushes
    // a union-typed item, which a union of arrays rejects.
    data,
    kind,
    metadata: raw.metadata,
    section: raw.section
  }
})
export type HomeSectionData = z.infer<typeof homeSectionSchema>

/**
 * The `home/data` payload: every section, in server-decided order.
 *
 * **Every section the backend sends is kept — the name whitelist is gone
 * (2026-08-28).** The backend adds sections without a client release, and the
 * old enum gate meant each addition either threw (`desiFood`, 2026-08-26,
 * before the gate) or silently never rendered (after it). Now an unknown name
 * parses through the shape/heuristic path in {@link homeSectionSchema} and
 * renders with the server's own title, order and kind.
 *
 * Loss is scoped to what cannot be honest: an UNKNOWN section whose envelope
 * does not parse is dropped — one section fewer beats a 500 on the whole home
 * page — while a KNOWN section still throws on a malformed row, because that
 * is a pinned contract breaking and it must be seen.
 * @example homeSectionsResponseSchema.parse([{ section: "somethingNew", metadata: { title: "x" }, data: [] }])[0]?.section // -> "somethingNew"
 */
export const homeSectionsResponseSchema = z
  .array(z.unknown())
  .transform((entries) =>
    entries.flatMap((entry) => {
      const name = (entry as { section?: unknown } | null)?.section

      if (isHomeSection(name)) {
        return [homeSectionSchema.parse(entry)]
      }

      const result = homeSectionSchema.safeParse(entry)

      return result.success ? [result.data] : []
    })
  )

/**
 * `GET /home/data`'s envelope `data` member — measured live 2026-08-25:
 * `{ sections, smartRecommendations, sort, location, metadata }`. Only
 * `sections` is read; the rest describe ranking and geo context this domain
 * does not surface.
 * @example homeDataPayloadSchema.parse({ sections: [] }) // -> []
 */
export const homeDataPayloadSchema = z
  .object({ sections: homeSectionsResponseSchema })
  .transform((payload) => payload.sections)

/**
 * One cuisine/category tile.
 *
 * `parentId`/`rootCategoryId` describe a tree this story does not walk —
 * `category-tiles.tsx` renders every entry flat — but both are on the wire and
 * nullable: measured live 2026-08-25, a root-level tile carries
 * `rootCategoryId: null`, exactly as it carries `parentId: null`.
 *
 * `ar` is dropped from `name` for the same reason it is everywhere else on
 * this site (Rule 4).
 * @example categoryEntitySchema.parse({ id: "1", parentId: null, rootCategoryId: null, name: { en: "Chicken" }, image: null, position: 0 }).name.en // -> "Chicken"
 */
export const categoryEntitySchema = z.object({
  description: optionalLocalizedTextSchema,
  id: z.string().min(1),
  image: degradableImageRefSchema,
  name: localizedTextSchema,
  parentId: z.string().min(1).nullable(),
  position: nullishDefault(z.number().int().min(0), 0),
  rootCategoryId: z.string().min(1).nullable()
})
export type CategoryEntity = z.infer<typeof categoryEntitySchema>

/**
 * `GET /categories`'s envelope `data` member — measured live 2026-08-25: the
 * same nested-`data`-plus-pagination shape `discoveryPageSchema` already
 * adapts, not a bare tile array. Reuses that adapter, then drops the
 * pagination fields the fan-out-and-merge has no use for.
 * @example categoriesPayloadSchema.parse({ data: [], total: 0, page: 1, limit: 20 }) // -> []
 */
export const categoriesPayloadSchema = discoveryPageSchema(
  categoryEntitySchema
).transform((page) => page.items)
