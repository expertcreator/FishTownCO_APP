import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, Modal, Pressable, StyleSheet, View } from "react-native";
import {
  ComplianceTimelineCard,
  ItemHeroCard,
  StatusToneBanner,
  getBannerColors,
} from "@/features/common/components";
import { isImageUpload } from "@/features/common/media/uploadUserFile";
import { getWalletDocTypeIcon } from "@/features/wallet/types/wallet";
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
  useToast,
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
  const toast = useToast();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const { id } = useLocalSearchParams<{ id: string }>();
  const docId = typeof id === "string" ? id : "";

  const { data: doc, isLoading, isFetching, isError } = useQuery({
    queryKey: ["wallet", "doc", docId],
    enabled: Boolean(docId),
    queryFn: () => fetchWalletDoc(docId),
  });

  if (!doc && (isLoading || isFetching || !isError)) {
    return (
      <Screen header={<BackHeader title={t("wallet.detail-title")} />}>
        <ItemDetailSkeleton />
      </Screen>
    );
  }

  if (!doc) {
    return (
      <Screen header={<BackHeader title={t("wallet.detail-title")} />}>
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
  const fileUri =
    doc.downloadURL?.trim() || doc.localUri?.trim() || doc.thumbURL?.trim() || null;
  const imageUri = fileUri && isPreviewImage(fileUri) ? fileUri : null;
  const icon = getWalletDocTypeIcon(doc.docType);

  /**
   * Opens an image in the preview, or a PDF in the device viewer.
   * @param uri - Attachment URI, when one is saved
   * @param asImage - Whether this card expects an image
   * @returns Promise that resolves after the preview opens or a toast is shown
   */
  const onPreviewAttachment = async (uri: string | null, asImage: boolean) => {
    if (!uri || isPreviewImage(uri) !== asImage) {
      toast.info(t("wallet.preview-empty"));
      return;
    }
    if (asImage) {
      setPreviewUri(uri);
      return;
    }
    try {
      await Linking.openURL(uri);
    } catch {
      toast.error(t("wallet.preview-failed"));
    }
  };

  const banner =
    tone === "overdue"
      ? t("wallet.banner-overdue", { date: doc.expires })
      : tone === "due"
        ? t("wallet.banner-due", { date: doc.expires })
        : t("wallet.banner-ok", { date: doc.expires });

  return (
    <Screen
      header={
        <BackHeader title={doc.title} onBack={() => router.back()} />
      }
      contentStyle={styles.content}
    >
      <StatusToneBanner tone={tone} text={banner} />

      <ItemHeroCard
        imageUri={imageUri}
        fallbackIcon={icon}
        topBadge={doc.categoryLabel}
        bottomBadge={doc.detail || undefined}
      />

      {dueDateObj ? (
        <ComplianceTimelineCard
          title={t("safety.compliance-timeline")}
          label={timelineLabel}
          tone={tone}
          daysUntil={days}
          progress={progress}
          nowLabel={t("safety.now")}
          overdueLabel={t("safety.status-overdue").toUpperCase()}
        />
      ) : null}

      <AppText style={styles.certsTitle}>{t("wallet.attachment")}</AppText>
      <View style={styles.certsRow}>
        <Pressable
          style={styles.certPress}
          onPress={() => void onPreviewAttachment(fileUri, false)}
          accessibilityRole="button"
          accessibilityLabel={t("wallet.upload-file-title")}
        >
          <Card style={styles.certCard}>
            <View style={styles.certTop}>
              <View style={[styles.certIcon, { backgroundColor: colors.statusOverdueBg }]}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={colors.statusOverdueText}
                />
              </View>
            </View>
            <AppText style={styles.certName} numberOfLines={1}>
              {fileUri && !imageUri ? t("wallet.upload-file-title") : t("wallet.no-file")}
            </AppText>
            <AppText style={styles.certMeta}>
              {fileUri && !imageUri ? t("wallet.file-on-file") : t("safety.upload-later")}
            </AppText>
          </Card>
        </Pressable>
        <Pressable
          style={styles.certPress}
          onPress={() => void onPreviewAttachment(fileUri, true)}
          accessibilityRole="button"
          accessibilityLabel={t("safety.add-photo")}
        >
          <Card style={styles.certCard}>
            <View style={styles.certTop}>
              <View style={[styles.certIcon, { backgroundColor: colors.softTeal }]}>
                <Ionicons name="image-outline" size={22} color={colors.teal} />
              </View>
            </View>
            <AppText style={styles.certName} numberOfLines={1}>
              {imageUri ? t("safety.add-photo") : t("safety.no-photo")}
            </AppText>
            <AppText style={styles.certMeta}>
              {imageUri ? t("wallet.file-on-file") : t("safety.upload-later")}
            </AppText>
          </Card>
        </Pressable>
      </View>

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

      <Modal
        visible={previewUri != null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUri(null)}
      >
        <View style={styles.viewerBackdrop}>
          <Pressable
            onPress={() => setPreviewUri(null)}
            hitSlop={12}
            style={styles.viewerClose}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          >
            <Ionicons name="close" size={24} color={colors.onInverse} />
          </Pressable>
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={styles.viewerImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}

/**
 * True when the attachment should open in the image preview.
 * @param uri - File URI
 * @returns Whether the file is an image
 */
function isPreviewImage(uri: string): boolean {
  const path = decodeURIComponent(uri.split("?")[0] ?? uri);
  if (/\.pdf$/i.test(path)) return false;
  return isImageUpload(undefined, path) || !/\.[a-z0-9]+$/i.test(path);
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
    certPress: { flex: 1 },
    certCard: { flex: 1, gap: 10, minHeight: 110 },
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
    viewerBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.92)",
      justifyContent: "center",
      padding: 16,
    },
    viewerClose: {
      position: "absolute",
      top: 48,
      right: 16,
      zIndex: 2,
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    viewerImage: {
      width: "100%",
      height: "70%",
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
