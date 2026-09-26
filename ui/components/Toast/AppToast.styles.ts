import { Platform, StyleSheet } from "react-native";

/**
 * Converts a hex color to rgba with the given opacity.
 * @param hex - Six-digit hex color
 * @param opacity - Alpha from 0 to 1
 * @returns rgba() string
 */
function hexToRgba(hex: string, opacity: number): string {
  const cleanHex = hex.replace("#", "");
  const r = Number.parseInt(cleanHex.substring(0, 2), 16);
  const g = Number.parseInt(cleanHex.substring(2, 4), 16);
  const b = Number.parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** Semantic tone colors for toast accents/icons (Foori-style). */
export const TOAST_TONE_COLORS = {
  success: {
    accent: "#1F7A4D",
    icon: "#1F7A4D",
    iconBackground: hexToRgba("#1F7A4D", 0.14),
  },
  error: {
    accent: "#B91C1C",
    icon: "#B91C1C",
    iconBackground: hexToRgba("#B91C1C", 0.12),
  },
  info: {
    accent: "#0F5F73",
    icon: "#0F5F73",
    iconBackground: hexToRgba("#0F5F73", 0.12),
  },
  warn: {
    accent: "#B45309",
    icon: "#B45309",
    iconBackground: hexToRgba("#B45309", 0.14),
  },
} as const;

export const toastStyles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15, 23, 42, 0.06)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 6,
        shadowColor: "#0F172A",
      },
      default: {},
    }),
  },
  accentBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingEnd: 2,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    color: "#0F172A",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748B",
    fontWeight: "400",
  },
});
