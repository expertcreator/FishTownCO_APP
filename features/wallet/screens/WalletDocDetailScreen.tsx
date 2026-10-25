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
import { deleteWalletDoc } from "@/features/wallet/services/deleteWalletDoc";
import {
  AppText,
  BackHeader,
  Card,
  ConfirmModal,
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
  const days = dueDateObj ? daysUntilDue(dueDateObj) : null;
  const progress = days === null ? 0 : getComplianceProgress(days);
  const timelineLabel =
    days === null ? t("common.not-set") : getComplianceTimelineLabel(days);
  const unset = t("common.not-set");
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
    tone === "info"
      ? t("wallet.banner-needs-setup")
      : tone === "overdue"
        ? t("wallet.banner-overdue", { date: doc.expires })
        : tone === "due"
          ? t("wallet.banner-due", { date: doc.expires })
          : t("wallet.banner-ok", { date: doc.expires });

  /**
   * Deletes the wallet document and returns to the previous screen.
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onDeleteDocument = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteWalletDoc(doc.id);
      setDeleteOpen(false);
      toast.success(t("wallet.delete-document-success"));
      router.back();
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_SIGNED_IN") {
        toast.error(t("wallet.sign-in-required"));
      } else {
        toast.error(t("wallet.delete-document-failed"));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Screen
      header={
        <BackHeader
          title={doc.title}
          onBack={() => router.back()}
          right={
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push(`/wallet/edit/${doc.id}`)}
                hitSlop={10}
                style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t("wallet.edit-document")}
              >
                <Ionicons name="create-outline" size={22} color={colors.navy} />
              </Pressable>
              <Pressable
                onPress={() => setDeleteOpen(true)}
                disabled={isDeleting}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.deleteIconBtn,
                  pressed && styles.pressed,
                  isDeleting && styles.disabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("wallet.delete-document")}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.statusOverdueText}
                />
              </Pressable>
            </View>
          }
        />
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

      <ComplianceTimelineCard
        title={t("safety.compliance-timeline")}
        label={timelineLabel}
        tone={tone}
        daysUntil={days ?? Number.POSITIVE_INFINITY}
        progress={progress}
        nowLabel={t("safety.now")}
        overdueLabel={t("safety.status-overdue").toUpperCase()}
      />

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
          value={doc.reference || unset}
        />
        <Divider />
        <Spec label={t("wallet.issue-date")} value={doc.issueDate || unset} />
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
                        : tone === "info"
                          ? colors.cardSoft
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
                      : tone === "info"
                        ? "alert-circle-outline"
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

      <ConfirmModal
        visible={deleteOpen}
        title={t("wallet.delete-document-title")}
        description={t("wallet.delete-document-description")}
        confirmLabel={t("wallet.delete-document")}
        icon="trash-outline"
        loading={isDeleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          void onDeleteDocument();
        }}
      />

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
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    editBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteIconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.statusOverdueBg,
    },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.75 },
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
