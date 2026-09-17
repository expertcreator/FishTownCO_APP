import type { TaxonomyArea } from "./geo-taxonomy"
import {
  type CategoryEntity,
  type HomeListingQuery,
  homeListingQuerySchema,
  type HomeSectionData
} from "./schemas"

/** The half of a `TaxonomyArea` `home/data` and `categories` actually read. */
export type HomeListingSource = Pick<TaxonomyArea, "coordinates" | "radiusKm">

/**
 * Plans the fan-out one area contributes to a city's home feed.
 *
 * The city page fans this out over **every live area of the city**, not one —
 * `resolveCity("gujranwala").coordinates` is `null` by design (mw-0-12), so
 * there is no single city point to query instead.
 * @param area - One live area's query points and its own search radius
 * @returns One query per coordinate, in coordinate order
 * @throws When a coordinate or the radius does not satisfy `homeListingQuerySchema`
 * @example planHomeListingRequests({ coordinates: [{ latitude: 32.1, longitude: 74.2 }], radiusKm: 5 }).length // -> 1
 */
export function planHomeListingRequests(
  area: HomeListingSource
): HomeListingQuery[] {
  return area.coordinates.map((point) =>
    homeListingQuerySchema.parse({
      lat: point.latitude,
      lng: point.longitude,
      radiusKm: area.radiusKm
    })
  )
}

/**
 * Unions the per-point `home/data` pages into the one section stack a city's
 * home page renders.
 *
 * Section order follows first appearance — the server decides it (design brief
 * §4), so this merge is a union, never a second opinion about ordering.
 * Deduplication is per-section rather than flat: two sections may legitimately
 * repeat an id, and a flat dedupe would drop the second one. `metadata` is
 * taken from a section's first appearance and never merged.
 * @param pages - One parsed `home/data` response per query point, in any order
 * @returns The unioned section stack, each section's `data` deduped by id
 * @example mergeHomeSectionsPages([[]]) // -> []
 */
export function mergeHomeSectionsPages(
  pages: readonly HomeSectionData[][]
): HomeSectionData[] {
  const bySection = new Map<
    string,
    { section: HomeSectionData; seen: Set<string> }
  >()

  for (const page of pages) {
    for (const section of page) {
      let entry = bySection.get(section.section)

      if (entry === undefined) {
        entry = { section: { ...section, data: [] }, seen: new Set() }
        bySection.set(section.section, entry)
      }

      for (const item of section.data) {
        if (!entry.seen.has(item.id)) {
          entry.seen.add(item.id)
          entry.section.data.push(item)
        }
      }
    }
  }

  return [...bySection.values()].map((entry) => entry.section)
}

/**
 * Unions the per-point `categories` pages into one flat, deduped tile list.
 *
 * Sorted by `position` once merged: the fan-out interleaves whichever order
 * each area answered in, and tile order is editorial.
 * @param pages - One parsed `categories` response per query point, in any order
 * @returns The unioned tiles, deduped by id and ordered by `position`
 * @example mergeCategoryPages([[]]) // -> []
 */
export function mergeCategoryPages(
  pages: readonly CategoryEntity[][]
): CategoryEntity[] {
  const merged = new Map<string, CategoryEntity>()

  for (const category of pages.flat()) {
    if (!merged.has(category.id)) {
      merged.set(category.id, category)
    }
  }

  return [...merged.values()].sort((a, b) => a.position - b.position)
}
