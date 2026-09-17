import { DAYPART_MENUS_API } from "./constants"
import type { DaypartMenusHttp } from "./http"
import { daypartMenusResponseSchema, daypartMenusUpdateSchema } from "./schemas"
import type { DaypartMenusResponse, DaypartMenusUpdatePayload } from "./types"

/**
 * Loads the four locked dayparts for a branch.
 * @param http - Injected HTTP client
 * @param branchId - Branch whose menu hours to load
 * @returns GET `/daypart-menus/branch/:id` body
 * @throws {ZodError} If the response shape is invalid
 */
export async function getDaypartMenusByBranch(
  http: DaypartMenusHttp,
  branchId: string
): Promise<DaypartMenusResponse> {
  const body = await http.get<unknown>(DAYPART_MENUS_API.byBranch(branchId))
  return daypartMenusResponseSchema.parse(body)
}

/**
 * Replaces all four daypart times for a branch. All-or-nothing.
 * @param http - Injected HTTP client
 * @param branchId - Branch whose menus to save
 * @param payload - Four locked slug + time rows
 * @returns PUT `/daypart-menus/branch/:id` body
 * @throws {ZodError} If the payload or response shape is invalid
 */
export async function updateDaypartMenus(
  http: DaypartMenusHttp,
  branchId: string,
  payload: DaypartMenusUpdatePayload
): Promise<DaypartMenusResponse> {
  const body = daypartMenusUpdateSchema.parse(payload)
  const result = await http.put<unknown, typeof body>(
    DAYPART_MENUS_API.byBranch(branchId),
    body
  )
  return daypartMenusResponseSchema.parse(result)
}
