import { Platform, type ViewStyle } from "react-native";

/**
 * Default list / profile / wallet / order cards.
 * - iOS: zero offset so blur wraps top/sides/bottom (not only under the card).
 * - Android: elevation still draws mostly below; slightly higher + same offset helps a bit.
 * Set `shadowColor` from theme on each card.
 */
export const CARD_SHADOW: Pick<
  ViewStyle,
  "shadowOffset" | "shadowOpacity" | "shadowRadius" | "elevation"
> =
  Platform.OS === "ios"
    ? {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 0,
      }
    : {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1.2,
      };

/**
 * Home / orders list cards — soft downward shadow per Figma.
 * Set `shadowColor` from theme on each card.
 */
export const ORDER_CARD_SHADOW: Pick<
  ViewStyle,
  "shadowOffset" | "shadowOpacity" | "shadowRadius" | "elevation"
> =
  Platform.OS === "ios"
    ? {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 0,
      }
    : {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      };

/** Overflow menus and floating dropdowns */
export const CARD_SHADOW_POPOVER: Pick<
  ViewStyle,
  "shadowOffset" | "shadowOpacity" | "shadowRadius" | "elevation"
> =
  Platform.OS === "ios"
    ? {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 0,
      }
    : {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
      };
