import type { DaypartMenuSlug } from "@/constants"

export type { DaypartMenuSlug }

export interface DaypartMenu {
  slug: DaypartMenuSlug
  startTime: string
  endTime: string
  usable: boolean
}

export interface DaypartMenusResponse {
  data: DaypartMenu[]
}

export interface DaypartMenuTimesInput {
  slug: DaypartMenuSlug
  startTime: string
  endTime: string
}

export interface DaypartMenusUpdatePayload {
  menus: DaypartMenuTimesInput[]
}

export type DaypartSaveAlert =
  | { kind: "overlap"; slugA: string; slugB: string }
  | { kind: "invalid" }

export type { MenuAvailability, ReorderBlockReason } from "./availability"
export type { MenuHoursNotice, MenuHoursTranslateFn } from "./copy"
export type { OutsideMenuHoursError } from "./errors"
