import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import {
  ComplianceTimelineCard,
  ItemHeroCard,
  StatusToneBanner,
} from "@/features/common/components";
import type { StatusTone } from "@/features/common/data/demo";
import { pickDisplayMediaUri } from "@/features/common/media/mediaStatus";
import { fetchSafetyItem } from "@/features/safety/services/fetchSafetyItem";
import { getSafetyCategoryIcon } from "@/features/safety/services/mapSafetyItemDoc";
import { markSafetyItemServiced } from "@/features/safety/services/markSafetyItemServiced";
import {
  formatSafetyDueDateLong,
  parseSafetyDueDate,
} from "@/features/safety/utils/formatSafetyDueDate";
import {
  daysUntilDue,
  getComplianceProgress,
  getComplianceTimelineLabel,
} from "@/features/safety/utils/safetyStatus";
import {
  AppText,
  BackHeader,
  Card,
  ItemDetailSkeleton,
  PrimaryButton,
  Screen,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Safety item detail matching prototype screen 15
 * (https://fishtownco.itoasis.co/).
 * Loads the item from Firestore `users/{uid}/safety/{id}`.
 * @returns Item detail UI
 */
export default function SafetyItemDetailScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = typeof id === "string" ? id : "";
  const [isServicing, setIsServicing] = useState(false);

  const { data: item, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["safety", "item", itemId],
    enabled: Boolean(itemId),
    queryFn: () => fetchSafetyItem(itemId),
  });

  if (!item && (isLoading || isFetching || !isError)) {
    return (
      <Screen>
        <BackHeader title={t("safety.detail-title")} />
        <ItemDetailSkeleton />
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen>
        <BackHeader title={t("safety.detail-title")} />
        <AppText style={styles.empty}>{t("safety.item-missing")}</AppText>
      </Screen>
    );
  }

  const dueDateObj = item.dueDateIso
    ? new Date(item.dueDateIso)
    : parseSafetyDueDate(item.dueDate);
  const days = dueDateObj ? daysUntilDue(dueDateObj) : 0;
  const tone = item.tone;
  const icon = getSafetyCategoryIcon(item.category || item.name);
  const progress = getComplianceProgress(days);
  const timelineLabel = getComplianceTimelineLabel(days);
  const banner = getBannerCopy(tone, item.dueDate, t);
  const bannerColors = getBannerColors(colors, tone);
  const nextDueColors = getNextDueColors(colors, tone);
  const photoUri = pickDisplayMediaUri({
    thumbURL: item.photoThumbURL,
    downloadURL: item.photoDownloadURL,
    localUri: item.photoLocalUri,
  });
  const certUri = pickDisplayMediaUri({
    thumbURL: item.certThumbURL,
    downloadURL: item.certDownloadURL,
    localUri: item.certLocalUri,
  });

  /**
   * Copies the serial number to the clipboard when present.
   * @returns Promise that resolves when the toast is shown
   */
  const onCopySerial = async () => {
    if (!item.serial) return;
    try {
      await Clipboard.setStringAsync(item.serial);
      toast.success(t("safety.serial-copied"));
    } catch {
      toast.error(t("safety.serial-copy-failed"));
    }
  };

  /**
   * Marks the item as serviced and advances the next due date.
   * @returns Promise that resolves when the update finishes or a toast is shown
   */
  const onMarkServiced = async () => {
    if (isServicing) return;
    setIsServicing(true);
    try {
      const result = await markSafetyItemServiced(item.id);
      await refetch();
      toast.success(
        t("safety.mark-serviced-success", {
          date: formatSafetyDueDateLong(new Date(result.nextDueDateIso)),
        })
      );
    } catch (error) {
      console.error("[SafetyItemDetailScreen] mark serviced failed", error);
      if (error instanceof Error && error.message === "NOT_SIGNED_IN") {
        toast.error(t("safety.sign-in-required"));
      } else {
        toast.error(mapAuthError(error, t));
      }
    } finally {
      setIsServicing(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <BackHeader
        title={item.name}
        right={
          <Pressable
            onPress={() => router.push(`/safety/edit/${item.id}`)}
            hitSlop={10}
            style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t("safety.edit-item")}
          >
            <Ionicons name="create-outline" size={22} color={colors.navy} />
          </Pressable>
        }
      />

      <StatusToneBanner tone={tone} text={banner} />

      <ItemHeroCard
        imageUri={photoUri}
        fallbackIcon={icon}
        topBadge={item.category || undefined}
        bottomBadge={item.location || undefined}
      />

      <ComplianceTimelineCard
        title={t("safety.compliance-timeline")}
        label={timelineLabel}
        tone={tone}
        daysUntil={days}
        progress={progress}
        nowLabel={t("safety.now")}
        overdueLabel={t("safety.status-overdue").toUpperCase()}
      />

      <Card style={styles.specs}>
        <SpecRow
          label={t("safety.make-model")}
          value={item.makeModel || "—"}
        />
        <Divider />
        <View style={styles.specBlock}>
          <AppText style={styles.specLabel}>{t("safety.serial")}</AppText>
          <View style={styles.serialRow}>
            <AppText style={styles.serialValue}>{item.serial || "—"}</AppText>
            {item.serial ? (
              <Pressable
                onPress={onCopySerial}
                style={({ pressed }) => [
                  styles.copyBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="copy-outline" size={16} color={colors.teal} />
                <AppText style={styles.copyText}>{t("safety.copy")}</AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
        <Divider />
        <View style={styles.specBlock}>
          <AppText style={styles.specLabel}>{t("safety.location-aboard")}</AppText>
          <View style={styles.locationRow}>
            <Ionicons name="compass-outline" size={20} color={colors.teal} />
            <AppText style={styles.specValue}>{item.location || "—"}</AppText>
          </View>
        </View>
        <Divider />
        <SpecRow
          label={t("safety.last-service-date")}
          value={item.lastServiceDate || "—"}
        />
        <Divider />
        <View style={styles.specBlock}>
          <AppText style={styles.specLabel}>{t("safety.next-service-due")}</AppText>
          <View style={styles.nextDueRow}>
            <AppText style={[styles.nextDueValue, { color: nextDueColors.text }]}>
              {item.dueDate}
            </AppText>
            <View
              style={[
                styles.actionPill,
                { backgroundColor: nextDueColors.bg },
              ]}
            >
              <AppText
                style={[styles.actionPillText, { color: nextDueColors.text }]}
              >
                {tone === "ok"
                  ? t("safety.valid")
                  : t("safety.action-needed")}
              </AppText>
            </View>
          </View>
        </View>
        {item.expiryDate ? (
          <>
            <Divider />
            <View style={styles.specBlock}>
              <AppText style={styles.specLabel}>{t("safety.expiry-date")}</AppText>
              <View style={styles.nextDueRow}>
                <AppText style={styles.specValue}>{item.expiryDate}</AppText>
                <View style={[styles.actionPill, { backgroundColor: colors.softTeal }]}>
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color={colors.teal}
                  />
                  <AppText style={[styles.actionPillText, { color: colors.teal }]}>
                    {t("safety.valid")}
                  </AppText>
                </View>
              </View>
            </View>
          </>
        ) : null}
      </Card>

      <AppText style={styles.certsTitle}>{t("safety.certificates-logs")}</AppText>
      <View style={styles.certsRow}>
        <Card style={styles.certCard}>
          <View style={styles.certTop}>
            <View style={[styles.certIcon, { backgroundColor: colors.statusOverdueBg }]}>
              {certUri ? (
                <Image
                  source={{ uri: certUri }}
                  style={styles.certThumb}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={150}
                />
              ) : (
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={colors.statusOverdueText}
                />
              )}
            </View>
            <Ionicons name="arrow-up-outline" size={18} color={colors.muted} />
          </View>
          <AppText style={styles.certName} numberOfLines={1}>
            {certUri ? t("safety.add-certificate") : t("safety.no-certificate")}
          </AppText>
          <AppText style={styles.certMeta}>
            {certUri ? t("safety.file-on-file") : t("safety.upload-later")}
          </AppText>
        </Card>
        <Card style={styles.certCard}>
          <View style={styles.certTop}>
            <View style={[styles.certIcon, { backgroundColor: colors.softTeal }]}>
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={styles.certThumb}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={150}
                />
              ) : (
                <Ionicons name="image-outline" size={22} color={colors.teal} />
              )}
            </View>
            <Ionicons name="arrow-up-outline" size={18} color={colors.muted} />
          </View>
          <AppText style={styles.certName} numberOfLines={1}>
            {photoUri ? t("safety.add-photo") : t("safety.no-photo")}
          </AppText>
          <AppText style={styles.certMeta}>
            {photoUri ? t("safety.file-on-file") : t("safety.upload-later")}
          </AppText>
        </Card>
      </View>

      <PrimaryButton
        label={t("safety.mark-serviced")}
        icon="checkmark-circle-outline"
        loading={isServicing}
        onPress={() => void onMarkServiced()}
        style={styles.servicedBtn}
      />
    </Screen>
  );
}

type SpecRowProps = { label: string; value: string };

/**
 * Simple label/value row inside the specs card.
 * @param props - Row props
 * @param props.label - Field label
 * @param props.value - Field value
 * @returns Spec row element
 */
function SpecRow({ label, value }: SpecRowProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  return (
    <View style={styles.specBlock}>
      <AppText style={styles.specLabel}>{label}</AppText>
      <AppText style={styles.specValueBold}>{value}</AppText>
    </View>
  );
}

/**
 * Thin divider between spec rows.
 * @returns Divider element
 */
function Divider() {
  const colors = useColors();
  return (
    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
  );
}

/**
 * Builds the overdue / due-soon / ok banner copy.
 * @param tone - Status tone
 * @param dueDate - Formatted due date
 * @param t - Translation function
 * @returns Banner text
 */
function getBannerCopy(
  tone: StatusTone,
  dueDate: string,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  if (tone === "overdue") {
    return t("safety.banner-overdue", { date: dueDate });
  }
  if (tone === "due") {
    return t("safety.banner-due", { date: dueDate });
  }
  return t("safety.banner-ok", { date: dueDate });
}

/**
 * Resolves banner colors for a status tone.
 * @param colors - Theme colors
 * @param tone - Status tone
 * @returns Banner color tokens
 */
function getBannerColors(colors: ThemeColors, tone: StatusTone) {
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

/**
 * Resolves next-due row colors for a status tone.
 * @param colors - Theme colors
 * @param tone - Status tone
 * @returns Next-due color tokens
 */
function getNextDueColors(colors: ThemeColors, tone: StatusTone) {
  if (tone === "overdue") {
    return { text: colors.statusOverdueText, bg: colors.statusOverdueBg };
  }
  if (tone === "due") {
    return { text: colors.orange, bg: colors.softOrange };
  }
  return { text: colors.navy, bg: colors.softTeal };
}

/**
 * Builds detail-screen styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { paddingBottom: 36 },
    loader: { marginTop: 40 },
    empty: {
      color: colors.muted,
      textAlign: "center",
      marginTop: 32,
    },
    editBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: { opacity: 0.75 },
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
    heroChipTop: {
      position: "absolute",
      top: 12,
      left: 12,
      maxWidth: "70%",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.card,
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
      maxWidth: "70%",
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
      paddingHorizontal: 4,
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
    barDanger: {
      flex: 1,
      height: "100%",
      backgroundColor: colors.statusOverdueText,
    },
    markers: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 2,
    },
    marker: { alignItems: "center", gap: 4 },
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
    specs: { marginBottom: 16, gap: 12 },
    specBlock: { gap: 4 },
    specLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    specValue: {
      color: colors.navy,
      fontSize: 14,
      fontWeight: "600",
      flexShrink: 1,
    },
    specValueBold: {
      color: colors.navy,
      fontSize: 16,
      fontWeight: "700",
    },
    serialRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    serialValue: {
      color: colors.navy,
      fontSize: 13,
      fontWeight: "600",
      fontFamily: "monospace",
      backgroundColor: colors.cardSoft,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      overflow: "hidden",
    },
    copyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    copyText: {
      color: colors.teal,
      fontSize: 12,
      fontWeight: "700",
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    nextDueRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    nextDueValue: {
      fontSize: 14,
      fontWeight: "800",
    },
    actionPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    actionPillText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    certsTitle: {
      color: colors.navy,
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 0.6,
      marginBottom: 10,
    },
    certsRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 18,
    },
    certCard: {
      flex: 1,
      gap: 10,
      minHeight: 110,
    },
    certTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    certIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    certThumb: {
      width: 40,
      height: 40,
    },
    certName: {
      color: colors.navy,
      fontSize: 12,
      fontWeight: "700",
    },
    certMeta: {
      color: colors.muted,
      fontSize: 11,
    },
    servicedBtn: {
      marginTop: 4,
    },
  });
}
