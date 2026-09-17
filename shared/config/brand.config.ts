import type { AppBrand } from "@/shared/constants/appConfig.types";

/**
 * Build-time brand for Fishtownco.
 * @returns Always `fishtownco`
 */
export function getBrand(): AppBrand {
  return "fishtownco";
}

/**
 * Whether the app requires live internet for core flows.
 * @returns `true` for Fishtownco (Firebase-backed)
 */
export function requiresPersistentInternet(): boolean {
  return true;
}
