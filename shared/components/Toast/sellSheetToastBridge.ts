import type { ShowToastOptions, ToastTone } from "./AppToast.types";

type SellSheetToastPresenter = (
  type: ToastTone | "info",
  message: string,
  options?: ShowToastOptions
) => void;

let sellSheetOpenChecker: (() => boolean) | null = null;
let sellSheetToastPresenter: SellSheetToastPresenter | null = null;

/** Registered by Sell Sheet while mounted — keeps shared Toast free of feature imports. */
export function registerSellSheetToastBridge(
  isOpen: () => boolean,
  present: SellSheetToastPresenter
): void {
  sellSheetOpenChecker = isOpen;
  sellSheetToastPresenter = present;
}

export function unregisterSellSheetToastBridge(): void {
  sellSheetOpenChecker = null;
  sellSheetToastPresenter = null;
}

/**
 * When Sell Sheet is open, show on the in-sheet host (above the modal chrome).
 * Returns true if handled. Pass `presentationLayer: "default"` to force root toast.
 */
export function presentToastWithOptionalSellSheetLayer(
  type: ToastTone | "info",
  message: string,
  options?: ShowToastOptions
): boolean {
  if (options?.presentationLayer === "default") {
    return false;
  }
  if (!(sellSheetOpenChecker?.() && sellSheetToastPresenter)) {
    return false;
  }
  sellSheetToastPresenter(type, message, options);
  return true;
}
