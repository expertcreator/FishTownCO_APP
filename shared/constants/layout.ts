import { moderateScale } from "@/shared/imports";

/** Top spacing before the first screen heading (matches Home tab content). */
export const SCREEN_FIRST_HEADING_TOP_SPACING = moderateScale(16);

/** Bottom spacing below section headings (e.g. Recent Orders on Home). */
export const SECTION_HEADING_BOTTOM_SPACING = moderateScale(8);

/** Base empty-state illustration size before responsive scaling. */
export const EMPTY_STATE_IMAGE_DIMENSION = 180;

/** Default empty-state illustration size for "No Orders Yet" and similar states. */
export const EMPTY_STATE_IMAGE_SIZE = moderateScale(
  EMPTY_STATE_IMAGE_DIMENSION
);
