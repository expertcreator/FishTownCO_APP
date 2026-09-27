import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import {
  ComplianceTimelineCard,
  ItemHeroCard,
  StatusToneBanner,
  getBannerColors,
} from "@/features/common/components";
import { getSafetyCategoryIcon } from "@/features/safety/services/mapSafetyItemDoc";
import {
  daysUntilDue,
  getComplianceProgress,
  getComplianceTimelineLabel,
} from "@/features/safety/utils/safetyStatus";
import { fetchWalletDoc } from "@/features/wallet/services/fetchWalletDoc";
import {
  AppText,
  BackHeader,
  Card,
  ItemDetailSkeleton,
  Screen,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Wallet document detail matching the shared prototype item-detail layout.
 * Loads `users/{uid}/wallet/{id}` from Firestore.
 * @returns Document detail UI
 */
export default function WalletDocDetailScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const docId = typeof id === "string" ? id : "";

  const { data: doc, isLoading, isFetching, isError } = useQuery({
    queryKey: ["wallet", "doc", docId],
    enabled: Boolean(docId),
    queryFn: () => fetchWalletDoc(docId),
  });

  if (!doc && (isLoading || isFetching || !isError)) {
    return (
      <Screen>
        <BackHeader title={t("wallet.detail-title")} />
        <ItemDetailSkeleton />
      </Screen>
    );
  }

  if (!doc) {
    return (
      <Screen>
        <BackHeader title={t("wallet.detail-title")} />
        <AppText style={styles.empty}>{t("wallet.item-missing")}</AppText>
      </Screen>
    );
  }

  const dueDateObj = doc.expiresIso ? new Date(doc.expiresIso) : null;
  const days = dueDateObj ? daysUntilDue(dueDateObj) : 0;
  const progress = getComplianceProgress(days);
  const timelineLabel = getComplianceTimelineLabel(days);
  const tone = doc.tone;
  const bannerColors = getBannerColors(colors, tone);
  const imageUri = doc.thumbURL || doc.downloadURL || doc.localUri || null;
  const icon = getSafetyCategoryIcon(doc.categoryLabel || doc.title);

  const banner =
    tone === "overdue"
      ? t("wallet.banner-overdue", { date: doc.expires })
      : tone === "due"
        ? t("wallet.banner-due", { date: doc.expires })
        : t("wallet.banner-ok", { date: doc.expires });

  return (
    <Screen contentStyle={styles.content}>
      <BackHeader
        title={doc.title}
        onBack={() => router.back()}
      />

      <StatusToneBanner tone={tone} text={banner} />

      <ItemHeroCard
        imageUri={imageUri}
        fallbackIcon={icon}
        topBadge={doc.categoryLabel}
        bottomBadge={doc.detail || undefined}
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

      <AppText style={styles.sectionLabel}>{t("wallet.details-section")}</AppText>
      <Card style={styles.specs}>
        <Spec label={t("wallet.doc-type")} value={doc.docType} />
        <Divider />
        <Spec label={t("wallet.doc-title")} value={doc.title} bold />
        <Divider />
        <Spec
          label={t("wallet.doc-reference")}
          value={doc.reference || "—"}
        />
        <Divider />
        <Spec label={t("wallet.issue-date")} value={doc.issueDate || "—"} />
        <Divider />
        <View style={styles.specBlock}>
          <AppText style={styles.specLabel}>{t("wallet.expiry-date")}</AppText>
          <View style={styles.rowBetween}>
            <AppText
              style={[
                styles.specValueBold,
                {
                  color:
                    tone === "overdue"
                      ? colors.statusOverdueText
                      : tone === "due"
                        ? colors.orange
                        : colors.navy,
                },
              ]}
            >
              {doc.expires}
            </AppText>
            <View
              style={[
                styles.pill,
                {
                  backgroundColor:
                    tone === "ok"
                      ? colors.softTeal
                      : tone === "due"
                        ? colors.softOrange
                        : colors.statusOverdueBg,
                },
              ]}
            >
              <Ionicons
                name={
                  tone === "ok"
                    ? "checkmark"
                    : tone === "due"
                      ? "time"
                      : "warning"
                }
                size={12}
                color={bannerColors.text}
              />
              <AppText style={[styles.pillText, { color: bannerColors.text }]}>
                {doc.status}
              </AppText>
            </View>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

type SpecProps = {
  label: string;
  value: string;
  bold?: boolean;
};

/**
 * Simple label/value row for wallet document specs.
 * @param props - Spec props
 * @returns Spec row
 */
function Spec({ label, value, bold }: SpecProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  return (
    <View style={styles.specBlock}>
      <AppText style={styles.specLabel}>{label}</AppText>
      <AppText style={bold ? styles.specValueBold : styles.specValue}>
        {value}
      </AppText>
    </View>
  );
}

/**
 * Spec list divider.
 * @returns Divider element
 */
function Divider() {
  const colors = useColors();
  return (
    <View
      style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }}
    />
  );
}

/**
 * Builds wallet detail styles.
 * @param colors - Theme colors
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
    sectionLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginBottom: 8,
      marginLeft: 4,
    },
    specs: { gap: 12, marginBottom: 16 },
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
    },
    specValueBold: {
      color: colors.navy,
      fontSize: 16,
      fontWeight: "700",
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    pillText: {
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
    },
  });
}
