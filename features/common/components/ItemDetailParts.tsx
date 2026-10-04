import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import type { StatusTone } from "@/features/common/data/demo";
import { AppText, Card } from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";

export type ItemHeroCardProps = {
  imageUri?: string | null;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  topBadge?: string;
  bottomBadge?: string;
};

/**
 * Prototype item-detail hero photo card with optional badges.
 * @param props - Hero props
 * @returns Hero card element
 */
export function ItemHeroCard({
  imageUri,
  fallbackIcon = "cube-outline",
  topBadge,
  bottomBadge,
}: ItemHeroCardProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <Card style={styles.hero}>
      <View style={styles.heroMedia}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.heroImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <Ionicons name={fallbackIcon} size={56} color={colors.white} />
        )}
        <View style={styles.heroGradient} pointerEvents="none" />
        {topBadge ? (
          <View style={styles.heroChipTop}>
            <Ionicons name="boat" size={14} color={colors.teal} />
            <AppText style={styles.heroChipTopText} numberOfLines={1}>
              {topBadge}
            </AppText>
          </View>
        ) : null}
        {bottomBadge ? (
          <View style={styles.heroChipBottom}>
            <Ionicons name="camera-outline" size={13} color={colors.white} />
            <AppText style={styles.heroChipBottomText} numberOfLines={1}>
              {bottomBadge}
            </AppText>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

export type StatusToneBannerProps = {
  tone: StatusTone;
  text: string;
};

/**
 * Overdue / due-soon / ok banner used on item detail screens.
 * @param props - Banner props
 * @returns Banner element
 */
export function StatusToneBanner({ tone, text }: StatusToneBannerProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const tokens = getBannerColors(colors, tone);

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: tokens.bg, borderColor: tokens.border },
      ]}
    >
      <Ionicons name={tokens.icon} size={18} color={tokens.text} />
      <AppText style={[styles.bannerText, { color: tokens.text }]}>{text}</AppText>
    </View>
  );
}

export type ComplianceTimelineCardProps = {
  title: string;
  label: string;
  tone: StatusTone;
  daysUntil: number;
  progress: number;
  nowLabel: string;
  overdueLabel: string;
};

/**
 * Compliance timeline card with progress bar and day markers.
 * @param props - Timeline props
 * @returns Timeline card element
 */
export function ComplianceTimelineCard({
  title,
  label,
  tone,
  daysUntil,
  progress,
  nowLabel,
  overdueLabel,
}: ComplianceTimelineCardProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const tokens = getBannerColors(colors, tone);

  return (
    <Card style={styles.timelineCard}>
      <View style={styles.timelineHeader}>
        <AppText style={styles.sectionTitle}>{title}</AppText>
        <View style={styles.timelineStatus}>
          <Ionicons
            name={tone === "ok" ? "checkmark-circle" : "alert-circle"}
            size={16}
            color={tokens.text}
          />
          <AppText style={[styles.timelineStatusText, { color: tokens.text }]}>
            {label}
          </AppText>
        </View>
      </View>

      <View style={styles.barWrap}>
        {tone === "overdue" ? (
          <View style={styles.nowBadge}>
            <AppText style={styles.nowBadgeText}>{nowLabel}</AppText>
            <View style={styles.nowStem} />
          </View>
        ) : null}
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`,
                backgroundColor:
                  tone === "overdue" ? colors.statusOverdueText : colors.teal,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.markers}>
        {(
          [
            { key: "90", label: "90D", active: daysUntil <= 90, color: colors.teal, large: false },
            { key: "60", label: "60D", active: daysUntil <= 60, color: colors.teal, large: false },
            { key: "30", label: "30D", active: daysUntil <= 30, color: colors.teal, large: false },
            { key: "7", label: "7D", active: daysUntil <= 7, color: colors.orange, large: false },
            {
              key: "overdue",
              label: overdueLabel,
              active: daysUntil < 0,
              color: colors.statusOverdueText,
              large: true,
            },
          ] as const
        ).map((marker) => (
          <View key={marker.key} style={styles.marker}>
            <View
              style={[
                marker.large ? styles.markerDotLarge : styles.markerDot,
                { backgroundColor: marker.active ? marker.color : colors.border },
              ]}
            >
              {marker.large && marker.active ? <View style={styles.markerInner} /> : null}
            </View>
            <AppText
              style={[
                styles.markerLabel,
                { color: marker.active ? marker.color : colors.muted },
              ]}
            >
              {marker.label}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

/**
 * Resolves banner / timeline accent colors for a status tone.
 * @param colors - Theme colors
 * @param tone - Status tone
 * @returns Color tokens
 */
export function getBannerColors(colors: ThemeColors, tone: StatusTone) {
  if (tone === "overdue") {
    return {
      bg: colors.statusOverdueBg,
      border: colors.statusOverdueText,
      text: colors.statusOverdueText,
      icon: "warning" as const,
    };
  }
  if (tone === "due") {
    return {
      bg: colors.softOrange,
      border: colors.orange,
      text: colors.orange,
      icon: "time" as const,
    };
  }
  return {
    bg: colors.softTeal,
    border: colors.teal,
    text: colors.teal,
    icon: "checkmark-circle" as const,
  };
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    hero: {
      padding: 0,
      overflow: "hidden",
      marginBottom: 14,
      borderRadius: 16,
    },
    heroMedia: {
      height: 208,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    heroImage: {
      ...StyleSheet.absoluteFill,
      width: "100%",
      height: "100%",
    },
    heroGradient: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0,0,0,0.22)",
    },
    heroChipTop: {
      position: "absolute",
      top: 12,
      left: 12,
      maxWidth: "72%",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.95)",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroChipTopText: {
      color: colors.navy,
      fontSize: 11,
      fontWeight: "700",
      flexShrink: 1,
    },
    heroChipBottom: {
      position: "absolute",
      right: 12,
      bottom: 12,
      maxWidth: "72%",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(13,44,65,0.85)",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    heroChipBottomText: {
      color: colors.white,
      fontSize: 11,
      fontWeight: "600",
      flexShrink: 1,
    },
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 16,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 14,
    },
    bannerText: {
      flex: 1,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    timelineCard: { marginBottom: 14, gap: 14 },
    timelineHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    sectionTitle: {
      color: colors.navy,
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    timelineStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    timelineStatusText: {
      fontSize: 12,
      fontWeight: "700",
    },
    barWrap: {
      paddingTop: 22,
    },
    nowBadge: {
      position: "absolute",
      top: 0,
      right: 0,
      alignItems: "center",
      zIndex: 2,
    },
    nowBadgeText: {
      backgroundColor: colors.statusOverdueText,
      color: colors.white,
      fontSize: 10,
      fontWeight: "800",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      overflow: "hidden",
    },
    nowStem: {
      width: 2,
      height: 8,
      backgroundColor: colors.statusOverdueText,
    },
    barTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.border,
      overflow: "hidden",
      flexDirection: "row",
    },
    barFill: {
      height: "100%",
      backgroundColor: colors.teal,
    },
    markers: {
      flexDirection: "row",
    },
    marker: { flex: 1, alignItems: "center", gap: 4 },
    markerDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    markerDotLarge: {
      width: 14,
      height: 14,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
    },
    markerInner: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.white,
    },
    markerLabel: {
      fontSize: 10,
      fontWeight: "800",
    },
  });
}
