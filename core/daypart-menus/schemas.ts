import { z } from "zod"
import { DAYPART_MENU_SLUGS, ERROR_MESSAGES } from "@/constants"
import { DAYPART_CLOCK_TIME } from "./constants"

/**
 * One locked daypart's clock window on the wire.
 */
export const daypartMenuTimesSchema = z
  .object({
    slug: z.enum(DAYPART_MENU_SLUGS),
    startTime: z.string().regex(DAYPART_CLOCK_TIME),
    endTime: z.string().regex(DAYPART_CLOCK_TIME)
  })
  .strict()

/**
 * PUT body: all four locked dayparts, all-or-nothing.
 */
export const daypartMenusUpdateSchema = z.object({
  menus: z.array(daypartMenuTimesSchema).length(4)
})

/**
 * Single-row edit form: start and end only. Slug stays locked in the UI.
 */
export const daypartMenuFormSchema = z
  .object({
    startTime: z.string().regex(DAYPART_CLOCK_TIME),
    endTime: z.string().regex(DAYPART_CLOCK_TIME)
  })
  .strict()

export type DaypartMenuFormInput = z.infer<typeof daypartMenuFormSchema>

/**
 * One saved daypart as returned by GET/PUT.
 */
export const daypartMenuSchema = z.object({
  slug: z.enum(DAYPART_MENU_SLUGS),
  startTime: z.string().regex(DAYPART_CLOCK_TIME),
  endTime: z.string().regex(DAYPART_CLOCK_TIME),
  usable: z.boolean().optional().default(true)
})

/**
 * GET/PUT `/daypart-menus/branch/:id` body.
 */
export const daypartMenusResponseSchema = z.object({
  data: z.array(daypartMenuSchema).length(4)
})

/**
 * Shared `available` / `menuSlugs` / `liveMenuSlug` fragment on cart lines,
 * orders, product/deal detail, and favorites.
 */
export const menuAvailabilitySchema = z.object({
  available: z.boolean(),
  liveMenuSlug: z.enum(DAYPART_MENU_SLUGS).nullable(),
  menuSlugs: z.array(z.enum(DAYPART_MENU_SLUGS))
})

/**
 * `400 OUTSIDE_MENU_HOURS` params from place-order, reorder, and add-to-cart.
 */
export const outsideMenuHoursParamsSchema = z.object({
  liveMenuSlug: z.enum(DAYPART_MENU_SLUGS).nullable().optional(),
  menuSlugs: z.array(z.enum(DAYPART_MENU_SLUGS)).optional(),
  productName: z.string().optional()
})

/**
 * `400` body when an item exists but is off the live branch menu.
 * Replaces the old `404 PRODUCT_NOT_FOUND` for this case.
 */
export const outsideMenuHoursErrorSchema = z.object({
  code: z.literal(ERROR_MESSAGES.OUTSIDE_MENU_HOURS),
  message: z.string().optional(),
  params: outsideMenuHoursParamsSchema.optional(),
  statusCode: z.number().optional()
})

export type MenuAvailabilityFields = z.infer<typeof menuAvailabilitySchema>
export type OutsideMenuHoursErrorBody = z.infer<
  typeof outsideMenuHoursErrorSchema
>
