import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import type { StatusTone } from "@/features/common/data/demo";
import { pickDisplayMediaUri } from "@/features/common/media/mediaStatus";
import { getSafetyCategoryIcon } from "@/features/safety/services/mapSafetyItemDoc";
import type { SafetyItem } from "@/features/safety/types/safetyItem";
import {
  AppText,
  CARD_RIPPLE,
  Card,
  getPressedActionStyle,
  getPressedItemStyle,
  ORANGE_RIPPLE,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/** When to show the replacement CTA (matches prototype SafetyItemCard). */
export type SafetyReplacementMode = "none" | "overdue" | "action";

type SafetyItemCardProps = {
  item: SafetyItem;
  /**
   * `action` = overdue or due soon (Safety tab).
   * `overdue` = overdue only (Home tab).
   * `none` = never.
   */
  showReplacement?: SafetyReplacementMode;
  dateLabelKey?: string;
};

/**
 * Safety inventory card matching https://fishtownco.itoasis.co/ (screens 11–12).
 * Uses live Firestore item fields for name, due date, tone, and photo.
 * Replacement CTA is a sibling pressable (not nested) so it receives taps.
 * @param props - Card props
 * @param props.item - Safety item from Firestore
 * @param props.showReplacement - When to show the replacement CTA
 * @param props.dateLabelKey - Optional i18n key for the due-date prefix
 * @returns Safety item card element
 */
export function SafetyItemCard({
  item,
  showReplacement = "action",
  dateLabelKey = "safety.next-due",
}: SafetyItemCardProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const toneStyle = getToneStyle(colors, item.tone);
  const icon = getSafetyCategoryIcon(item.category || item.name);
  const photoUri = pickDisplayMediaUri({
    thumbURL: item.photoThumbURL,
    downloadURL: item.photoDownloadURL,
    localUri: item.photoLocalUri,
  });

  const showButton =
    showReplacement === "action"
      ? item.tone === "overdue" || item.tone === "due"
      : showReplacement === "overdue"
        ? item.tone === "overdue"
        : false;

  /**
   * Opens the live item detail screen.
   * @returns void
   */
  const onOpenDetail = () => {
    router.push(`/safety/${item.id}`);
  };

  /**
   * Matches prototype: shows a coming-soon toast for replacement options.
   * @returns void
   */
  const onReplace = () => {
    toast.info(t("safety.replacement-coming-soon"));
  };

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={onOpenDetail}
        android_ripple={CARD_RIPPLE}
        style={({ pressed }) => [
          styles.mainPressable,
          !showButton && styles.mainPressableSolo,
          getPressedItemStyle(pressed),
        ]}
        accessibilityRole="button"
        accessibilityLabel={item.name}
      >
        <View style={styles.topRow}>
          <View style={styles.left}>
            <View style={[styles.iconWrap, { backgroundColor: toneStyle.iconBg }]}>
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={styles.thumb}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={150}
                />
              ) : (
                <Ionicons name={icon} size={26} color={toneStyle.icon} />
              )}
            </View>
            <View style={styles.body}>
              <AppText style={styles.name} numberOfLines={1}>
                {item.name}
              </AppText>
              <View style={styles.dueRow}>
                <Ionicons
                  name={item.tone === "ok" ? "calendar-outline" : "calendar"}
                  size={14}
                  color={toneStyle.due}
                />
                <AppText style={[styles.due, { color: toneStyle.due }]}>
                  {t(dateLabelKey, { date: item.dueDate })}
                </AppText>
              </View>
            </View>
          </View>
          <View
            style={[
              styles.pill,
              {
                backgroundColor: toneStyle.pillBg,
                borderColor: toneStyle.pillBorder,
              },
            ]}
          >
            <Ionicons name={toneStyle.pillIcon} size={15} color={toneStyle.pillText} />
            <AppText style={[styles.pillText, { color: toneStyle.pillText }]}>
              {item.status}
            </AppText>
          </View>
        </View>
      </Pressable>

      {showButton ? (
        <Pressable
          onPress={onReplace}
          android_ripple={ORANGE_RIPPLE}
          style={({ pressed }) => [
            styles.replacement,
            getPressedActionStyle(pressed),
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("safety.view-replacement")}
        >
          <AppText style={styles.replacementText}>
            {t("safety.view-replacement")}
          </AppText>
        </Pressable>
      ) : null}
    </Card>
  );
}

type ToneStyle = {
  iconBg: string;
  icon: string;
  due: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  pillIcon: keyof typeof Ionicons.glyphMap;
};

/**
 * Resolves card colors / icons for a status tone.
 * @param colors - Active theme colors
 * @param tone - Safety status tone
 * @returns Tone style tokens
 */
function getToneStyle(colors: ThemeColors, tone: StatusTone): ToneStyle {
  switch (tone) {
    case "overdue":
      return {
        iconBg: colors.statusOverdueBg,
        icon: colors.statusOverdueText,
        due: colors.statusOverdueText,
        pillBg: colors.statusOverdueBg,
        pillText: colors.statusOverdueText,
        pillBorder: colors.statusOverdueText,
        pillIcon: "alert-circle",
      };
    case "due":
      return {
        iconBg: colors.softOrange,
        icon: colors.orange,
        due: colors.orange,
        pillBg: colors.softOrange,
        pillText: colors.orange,
        pillBorder: colors.orange,
        pillIcon: "timer-outline",
      };
    default:
      return {
        iconBg: colors.softTeal,
        icon: colors.teal,
        due: colors.muted,
        pillBg: colors.softTeal,
        pillText: colors.teal,
        pillBorder: colors.teal,
        pillIcon: "checkmark-circle",
      };
  }
}

/**
 * Builds safety-item-card styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: 12,
      marginBottom: 0,
      borderRadius: 16,
      overflow: "hidden",
      padding: 0,
    },
    mainPressable: {
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    mainPressableSolo: {
      paddingBottom: 16,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    left: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      minWidth: 0,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    thumb: {
      width: 48,
      height: 48,
    },
    body: { flex: 1, minWidth: 0, gap: 4 },
    name: {
      color: colors.navy,
      fontWeight: "700",
      fontSize: 14,
    },
    dueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    due: {
      fontSize: 12,
      fontWeight: "600",
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
    },
    pillText: {
      fontSize: 11,
      fontWeight: "700",
    },
    replacement: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.orange,
      borderRadius: 12,
      minHeight: 40,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
      overflow: "hidden",
    },
    replacementText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: "700",
    },
  });
}
