import type { ViewStyle } from "react-native";

/** Shared Android ripple used on list cards and tappable rows. */
export const CARD_RIPPLE = { color: "rgba(13, 44, 65, 0.08)" } as const;

/** Shared Android ripple for filled orange CTAs. */
export const ORANGE_RIPPLE = { color: "rgba(255, 255, 255, 0.22)" } as const;

/**
 * Visible press feedback for tappable list items and cards.
 * Stronger than a near-invisible opacity tweak so users feel the hit target.
 * @param pressed - Whether the pressable is currently pressed
 * @returns Style applied while pressed, otherwise `undefined`
 */
export function getPressedItemStyle(pressed: boolean): ViewStyle | undefined {
  if (!pressed) return undefined;
  return {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  };
}

/**
 * Press feedback for filled primary/orange action buttons inside cards.
 * @param pressed - Whether the pressable is currently pressed
 * @returns Style applied while pressed, otherwise `undefined`
 */
export function getPressedActionStyle(pressed: boolean): ViewStyle | undefined {
  if (!pressed) return undefined;
  return {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  };
}
