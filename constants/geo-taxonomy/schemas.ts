import {
  languageEnum,
  type Locale,
  NUMBER_LIMITS,
  STRING_LIMITS
} from "@/constants"
import { z } from "zod"

// ============================================================================
// PRIMITIVES
// ============================================================================

/**
 * The only shape a catalog slug may take (AGENTS.md Rule 3).
 * Lowercase latin letters, digits and hyphens — never derived from a name.
 */
export const SLUG_REGEX = /^[a-z0-9-]+$/

/**
 * A slug that already exists on a record. Branded so a plain `string` — a
 * display name, a search query, a raw route segment — cannot be passed where a
 * URL is built.
 * @example slugSchema.parse("magnoliya-park") // -> Slug
 */
export const slugSchema = z
  .string()
  .min(1)
  .max(STRING_LIMITS.NAME_MAX)
  .regex(SLUG_REGEX, { message: "slug must match ^[a-z0-9-]+$" })
  .brand<"Slug">()
export type Slug = z.infer<typeof slugSchema>

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

/** Map pin for a city, area or restaurant. */
export const coordinatesSchema = z.object({
  latitude: decimalSchema(
    NUMBER_LIMITS.LATITUDE_MIN,
    NUMBER_LIMITS.LATITUDE_MAX
  ),
  longitude: decimalSchema(
    NUMBER_LIMITS.LONGITUDE_MIN,
    NUMBER_LIMITS.LONGITUDE_MAX
  )
})
export type Coordinates = z.infer<typeof coordinatesSchema>

// ============================================================================
// LOCALIZED TEXT
// ============================================================================

/** Localized jsonb as it leaves the backend: every key optional, or a legacy bare string. */
type LocalizedTextInput = string | Partial<Record<Locale, string>>

/** Normalized display text. `ar` is deliberately absent — Rule 4. */
interface EnUrText {
  en: string
  ur?: string
}

/**
 * Localized jsonb as it leaves the backend: every key optional, or a legacy
 * bare string. Discovery rows use this as input and then pipe through
 * {@link localizedTextSchema}.
 */
export const localizedTextInputSchema = z.union([
  z.string(),
  z.partialRecord(languageEnum, z.string())
])

/**
 * Collapses the three shapes localized text arrives in — full record, partial
 * record, legacy bare string — onto the two locales this app serves.
 * `ar` is dropped rather than rendered; Urdu backfills a missing English value
 * so a record with only Roman-Urdu content is still renderable. Values are
 * trimmed, so a whitespace-only name is indistinguishable from an empty one
 * and fails the emptiness guard rather than rendering (and indexing) blank.
 * @param value - Raw jsonb value or legacy string
 * @returns `{ en }`, plus `ur` when Roman Urdu exists
 */
function toEnUr(value: LocalizedTextInput): EnUrText {
  if (typeof value === "string") {
    return { en: value.trim() }
  }

  const english = (value.en ?? "").trim()
  const urdu = (value.ur ?? "").trim()
  const display = english.length > 0 ? english : urdu

  return urdu.length > 0 ? { en: display, ur: urdu } : { en: display }
}

/**
 * Required display name (restaurant, area, city). A record with no usable
 * en/ur value fails parsing — a nameless restaurant must never render blank.
 * @example localizedTextSchema.parse({ en: "Al Rehman", ar: "..." }) // -> { en: "Al Rehman" }
 */
export const localizedTextSchema = localizedTextInputSchema
  .transform(toEnUr)
  .refine((text) => text.en.length > 0, {
    message: "localized text has no usable en/ur value"
  })
export type LocalizedText = z.infer<typeof localizedTextSchema>

/**
 * Optional prose (description, address). Absent, null and empty-in-every-locale
 * all normalize to `null` rather than failing — only names are mandatory.
 * @example optionalLocalizedTextSchema.parse({}) // -> null
 */
export const optionalLocalizedTextSchema = localizedTextInputSchema
  .nullish()
  .transform((value) => {
    if (value === null || value === undefined) {
      return null
    }

    const text = toEnUr(value)

    return text.en.length > 0 ? text : null
  })

// ============================================================================
// CITY / AREA
// ============================================================================

/**
 * A city the catalog serves. There is no `cities` table and there never will
 * be — `be-1-1` was cancelled and the taxonomy ships as a constant with the
 * website (`mw-0-12`). `coordinates` stays optional: the `/{city}` page lists
 * areas, it never queries by point.
 */
export const citySchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  name: localizedTextSchema,
  description: optionalLocalizedTextSchema,
  coordinates: coordinatesSchema.nullish().default(null),
  isLive: z.boolean(),
  areaCount: z.number().int().min(0).default(0)
})
export type City = z.infer<typeof citySchema>

/**
 * A delivery area inside a city — the SEO surface. `zones.slug` / `zones.cityId`
 * were never added; the taxonomy ships as a constant (`mw-0-12`) and an area
 * page resolves through the existing lat/lng discovery listing.
 *
 * `coordinates` is therefore **required and non-empty**, unlike the city's. An
 * area with no query point cannot be listed at all under this design, so it must
 * fail parsing rather than publish a page that silently shows nothing. It is a
 * list rather than a single pin because one centroid misses restaurants that
 * deliver to one end of a large area but not its middle — the caller queries
 * every point and dedupes the results by restaurant id.
 */
export const areaSchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  citySlug: slugSchema,
  name: localizedTextSchema,
  description: optionalLocalizedTextSchema,
  coordinates: coordinatesSchema.array().min(1),
  isLive: z.boolean(),
  restaurantCount: z.number().int().min(0).default(0)
})
export type Area = z.infer<typeof areaSchema>
