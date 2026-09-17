import { Platform, StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { APP_CONFIG, fonts, fontSizes } from "@/shared/constants";

const hexToRgba = (hex: string, opacity: number): string => {
  const cleanHex = hex.replace("#", "");
  const r = Number.parseInt(cleanHex.substring(0, 2), 16);
  const g = Number.parseInt(cleanHex.substring(2, 4), 16);
  const b = Number.parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/** Brand-neutral semantic tones — uses each brand’s success/error/warning/info tokens. */
export const TOAST_TONE_COLORS = {
  success: {
    accent: APP_CONFIG.colors.success,
    icon: APP_CONFIG.colors.success,
    iconBackground: hexToRgba(APP_CONFIG.colors.success, 0.14),
  },
  error: {
    accent: APP_CONFIG.colors.error,
    icon: APP_CONFIG.colors.error,
    iconBackground: hexToRgba(APP_CONFIG.colors.error, 0.12),
  },
  info: {
    accent: APP_CONFIG.colors.info,
    icon: APP_CONFIG.colors.info,
    iconBackground: hexToRgba(APP_CONFIG.colors.info, 0.12),
  },
  warn: {
    accent: APP_CONFIG.colors.warning,
    icon: APP_CONFIG.colors.warning,
    iconBackground: hexToRgba(APP_CONFIG.colors.warning, 0.14),
  },
} as const;

export const toastStyles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: moderateScale(14),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: moderateScale(56),
    borderRadius: moderateScale(16),
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15, 23, 42, 0.06)",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    gap: moderateScale(10),
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
    width: moderateScale(4),
  },
  accentBarStart: {
    left: 0,
    borderTopLeftRadius: moderateScale(16),
    borderBottomLeftRadius: moderateScale(16),
  },
  accentBarEnd: {
    right: 0,
    borderTopRightRadius: moderateScale(16),
    borderBottomRightRadius: moderateScale(16),
  },
  iconWrap: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: moderateScale(2),
    paddingEnd: moderateScale(2),
  },
  title: {
    fontFamily: fonts.title,
    fontSize: fontSizes.small,
    lineHeight: moderateScale(20),
    color: "#0F172A",
    fontWeight: "600",
  },
  subtitle: {
    fontFamily: fonts.subTitle,
    fontSize: fontSizes.tiny,
    lineHeight: moderateScale(16),
    color: "#64748B",
    fontWeight: "400",
  },
  /** @deprecated Kept for callers that imported legacy keys. */
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
  },
  /** @deprecated Kept for callers that imported legacy keys. */
  text: {
    color: "#0F172A",
    fontSize: fontSizes.small,
    fontFamily: fonts.title,
    fontWeight: "600",
  },
});
