import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useAccountActions } from "@/features/auth/hooks/useAccountActions";
import { getCurrentUser } from "@/features/common/firebase";
import type { LegalDocument } from "@/features/common/legal/policyLinks";
import { restoreSubscriptionPurchases } from "@/features/subscription/services/restorePurchases";
import {
  AppText,
  BackHeader,
  CARD_RIPPLE,
  Card,
  ConfirmModal,
  getPressedItemStyle,
  LegalPolicyModal,
  LogoutModal,
  Screen,
  SectionHeader,
  useToast,
} from "@/ui/components";
import {
  useColors,
  useTheme,
  type ThemeColors,
  type ThemePreference,
} from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/** Theme choices shown left to right. "system" follows the phone setting. */
const THEME_OPTIONS: ThemePreference[] = ["light", "system", "dark"];

/**
 * Builds up to two initials from a display name, or the first letter of an email.
 * @param name - Firebase display name
 * @param email - Firebase email
 * @returns Uppercase initials, e.g. "SA"
 */
function getInitials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 0) {
    return parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }
  return email.trim().charAt(0).toUpperCase() || "?";
}

/**
 * Settings screen opened from the gear icon in the tab header.
 * Shows the signed-in user, the theme choice, the Privacy Policy and Terms,
 * log out, and delete account.
 * @returns Settings screen
 */
export default function SettingsScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const { themePreference, setThemePreference } = useTheme();
  const account = useAccountActions();
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);
  const [restoring, setRestoring] = useState(false);

  const user = getCurrentUser();
  const name = user?.displayName?.trim() ?? "";
  const email = user?.email?.trim() ?? "";

  const onRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const result = await restoreSubscriptionPurchases();
      if (result === "restored") {
        toast.success(t("subscription.restore-success"));
        router.replace("/(tabs)/home");
        return;
      }
      toast.info(t("subscription.restore-none"));
    } catch (error) {
      toast.error(
        error instanceof Error && error.message === "NOT_SIGNED_IN"
          ? t("subscription.sign-in-required")
          : t("subscription.restore-failed")
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Screen header={<BackHeader title={t("settings.title")} />}>
      {/* Signed-in user */}
      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>{getInitials(name, email)}</AppText>
        </View>
        <View style={styles.profileText}>
          {name ? (
            <AppText style={styles.profileName} numberOfLines={1}>
              {name}
            </AppText>
          ) : null}
          {email ? (
            <AppText style={styles.profileEmail} numberOfLines={1}>
              {email}
            </AppText>
          ) : null}
        </View>
      </Card>

      {/* Appearance: Light / System / Dark */}
      <SectionHeader title={t("settings.appearance")} />
      <Card style={styles.themeCard}>
        <View style={styles.themeLabel}>
          <Ionicons name="moon-outline" size={22} color={colors.navy} />
          <AppText style={styles.rowTitle}>{t("settings.theme")}</AppText>
        </View>
        <View style={styles.segment} accessibilityRole="radiogroup">
          {THEME_OPTIONS.map((option) => {
            const selected = themePreference === option;
            return (
              <Pressable
                key={option}
                onPress={() => setThemePreference(option)}
                style={[styles.segmentItem, selected && styles.segmentItemOn]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <AppText
                  style={[styles.segmentText, selected && styles.segmentTextOn]}
                >
                  {t(`settings.theme-${option}`)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Legal: opens the website pages in the in-app policy viewer */}
      <SectionHeader title={t("settings.legal")} />
      <View style={styles.rowList}>
        <SettingsRow
          icon="shield-checkmark-outline"
          title={t("auth.privacy")}
          subtitle={t("settings.privacy-sub")}
          onPress={() => setLegalDocument("privacy")}
        />
        <SettingsRow
          icon="document-text-outline"
          title={t("auth.terms")}
          subtitle={t("settings.terms-sub")}
          onPress={() => setLegalDocument("terms")}
        />
      </View>

      {/* Account: log out, then delete account last (red) */}
      <SectionHeader title={t("settings.account")} />
      <View style={styles.rowList}>
        <SettingsRow
          icon="refresh-outline"
          title={t("settings.restore")}
          subtitle={
            restoring ? t("common.loading") : t("settings.restore-sub")
          }
          onPress={() => void onRestore()}
        />
        <SettingsRow
          icon="log-out-outline"
          title={t("auth.log-out")}
          subtitle={t("settings.log-out-sub")}
          onPress={() => account.setLogoutOpen(true)}
        />
        <SettingsRow
          icon="trash-outline"
          title={t("auth.delete-account")}
          subtitle={t("settings.delete-account-sub")}
          danger
          onPress={() => account.setDeleteOpen(true)}
        />
      </View>

      <LegalPolicyModal
        document={legalDocument}
        onClose={() => setLegalDocument(null)}
      />
      <LogoutModal
        visible={account.logoutOpen}
        loading={account.loggingOut}
        onClose={() => account.setLogoutOpen(false)}
        onConfirm={() => {
          void account.onConfirmLogout();
        }}
      />
      <ConfirmModal
        visible={account.deleteOpen}
        title={t("auth.delete-account-title")}
        description={t("auth.delete-account-description")}
        confirmLabel={t("auth.delete-account")}
        icon="trash-outline"
        loading={account.deleting}
        onClose={() => account.setDeleteOpen(false)}
        onConfirm={() => {
          void account.onConfirmDelete();
        }}
      />
    </Screen>
  );
}

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  /** Shows the row in red for destructive actions. */
  danger?: boolean;
  onPress: () => void;
};

/**
 * Tappable settings row, styled like the My Vessel menu rows.
 * @param props - Row props
 * @param props.icon - Leading Ionicons name
 * @param props.title - Row title
 * @param props.subtitle - Supporting line
 * @param props.danger - Red styling for destructive actions
 * @param props.onPress - Press handler
 * @returns Settings row element
 */
function SettingsRow({
  icon,
  title,
  subtitle,
  danger = false,
  onPress,
}: SettingsRowProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const tint = danger ? colors.statusOverdueText : colors.navy;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={CARD_RIPPLE}
      style={({ pressed }) => [getPressedItemStyle(pressed)]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Card style={styles.rowCard}>
        <View
          style={[
            styles.rowIcon,
            { backgroundColor: danger ? colors.statusOverdueBg : colors.softTeal },
          ]}
        >
          <Ionicons name={icon} size={22} color={tint} />
        </View>
        <View style={styles.rowText}>
          <AppText style={[styles.rowTitle, { color: tint }]}>{title}</AppText>
          <AppText style={styles.rowSub} numberOfLines={1}>
            {subtitle}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Card>
    </Pressable>
  );
}

/**
 * Builds Settings screen styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderRadius: 16,
      marginBottom: 18,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.softTeal,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: colors.teal,
      fontSize: 18,
      fontWeight: "800",
    },
    profileText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    profileName: {
      color: colors.navy,
      fontSize: 17,
      fontWeight: "700",
    },
    profileEmail: {
      color: colors.muted,
      fontSize: 13,
    },
    themeCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      borderRadius: 16,
      marginTop: 8,
      marginBottom: 18,
    },
    themeLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    segment: {
      flexDirection: "row",
      backgroundColor: colors.chipIdle,
      borderRadius: 10,
      padding: 3,
    },
    segmentItem: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    segmentItemOn: {
      backgroundColor: colors.inverse,
    },
    segmentText: {
      color: colors.navy,
      fontSize: 13,
      fontWeight: "600",
    },
    segmentTextOn: {
      color: colors.onInverse,
    },
    // Stacks the legal and account rows 10px apart, like the My Vessel menu
    rowList: {
      gap: 10,
      marginTop: 8,
      marginBottom: 18,
    },
    rowCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderRadius: 16,
    },
    rowIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    rowTitle: {
      color: colors.navy,
      fontSize: 16,
      fontWeight: "700",
    },
    rowSub: {
      color: colors.muted,
      fontSize: 12,
    },
  });
}
