import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import type { StatusTone } from "@/features/common/data/demo";
import { getCrewStatusIcon } from "@/features/crew/utils/crewStatus";
import {
  getWalletCategoryIcon,
  type WalletDoc,
} from "@/features/wallet/types/wallet";
import {
  AppText,
  CARD_RIPPLE,
  Card,
  getPressedItemStyle,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

type WalletDocCardProps = {
  doc: WalletDoc;
  /** Overrides the default document-viewer coming-soon toast. */
  onPress?: () => void;
};

/**
 * Wallet document card matching prototype screen 14.
 * Prefers thumbURL, then downloadURL, then localUri for the leading image.
 * @param props - Card props
 * @param props.doc - Wallet document to display
 * @param props.onPress - Optional press handler
 * @returns Wallet document card element
 */
export function WalletDocCard({ doc, onPress }: WalletDocCardProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const toneStyle = getToneStyle(colors, doc.tone);
  const statusIcon = getCrewStatusIcon(doc.tone);
  const categoryIcon = getWalletCategoryIcon(doc.category);
  const imageUri = doc.thumbURL || doc.downloadURL || doc.localUri || null;

  const expiresLine = doc.expiresMeta
    ? t("wallet.expires-with-meta", {
        date: doc.expires,
        meta: doc.expiresMeta,
      })
    : t("wallet.expires-on", { date: doc.expires });

  return (
    <Pressable
      onPress={
        onPress ??
        (() =>
          toast.info(t("wallet.viewer-coming-soon", { title: doc.title })))
      }
      android_ripple={CARD_RIPPLE}
      style={({ pressed }) => [getPressedItemStyle(pressed)]}
      accessibilityRole="button"
      accessibilityLabel={doc.title}
    >
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.left}>
            <View
              style={[styles.iconWrap, { backgroundColor: toneStyle.iconBg }]}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.thumb}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={150}
                />
              ) : (
                <Ionicons
                  name={categoryIcon}
                  size={22}
                  color={toneStyle.icon}
                />
              )}
            </View>
            <View style={styles.body}>
              <AppText style={styles.category}>{doc.categoryLabel}</AppText>
              <AppText style={styles.title} numberOfLines={2}>
                {doc.title}
              </AppText>
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
            <Ionicons name={statusIcon} size={14} color={toneStyle.pillText} />
            <AppText style={[styles.pillText, { color: toneStyle.pillText }]}>
              {doc.status}
            </AppText>
          </View>
        </View>

        <View style={styles.detail}>
          <View style={styles.detailText}>
            <AppText style={styles.detailLine} numberOfLines={1}>
              {doc.detail}
            </AppText>
            <AppText
              style={[
                styles.expires,
                doc.tone === "due" || doc.tone === "overdue"
                  ? { color: colors.orange }
                  : null,
              ]}
              numberOfLines={1}
            >
              {expiresLine}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </Card>
    </Pressable>
  );
}

type ToneStyle = {
  iconBg: string;
  icon: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
};

/**
 * Resolves wallet card colors for a status tone.
 * @param colors - Active theme colors
 * @param tone - Document status tone
 * @returns Tone style tokens
 */
function getToneStyle(colors: ThemeColors, tone: StatusTone): ToneStyle {
  switch (tone) {
    case "overdue":
      return {
        iconBg: colors.statusOverdueBg,
        icon: colors.statusOverdueText,
        pillBg: colors.statusOverdueBg,
        pillText: colors.statusOverdueText,
        pillBorder: colors.statusOverdueText,
      };
    case "due":
      return {
        iconBg: colors.softOrange,
        icon: colors.orange,
        pillBg: colors.softOrange,
        pillText: colors.orange,
        pillBorder: colors.orange,
      };
    default:
      return {
        iconBg: colors.softTeal,
        icon: colors.teal,
        pillBg: colors.softTeal,
        pillText: colors.teal,
        pillBorder: colors.teal,
      };
  }
}

/**
 * Builds wallet-doc-card styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: 12,
      marginBottom: 12,
      borderRadius: 16,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
    },
    left: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      minWidth: 0,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    thumb: {
      width: 44,
      height: 44,
    },
    body: { flex: 1, minWidth: 0, gap: 4 },
    category: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    title: {
      color: colors.navy,
      fontSize: 14,
      fontWeight: "700",
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
    detail: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.cardSoft,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    detailText: { flex: 1, minWidth: 0, gap: 4 },
    detailLine: {
      color: colors.navy,
      fontSize: 12,
      fontWeight: "600",
    },
    expires: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
    },
  });
}
