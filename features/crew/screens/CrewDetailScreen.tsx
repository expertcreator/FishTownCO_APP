import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import type { StatusTone } from "@/features/common/data/demo";
import { pickDisplayMediaUri } from "@/features/common/media/mediaStatus";
import { useCrewMember } from "@/features/crew/hooks/useCrewMember";
import { getCrewInitials } from "@/features/crew/types/crew";
import { getCrewStatusLabel } from "@/features/crew/utils/crewStatus";
import { useVesselProfile } from "@/features/vessel/hooks/useVesselProfile";
import {
  AppText,
  BackHeader,
  Card,
  PrimaryButton,
  Screen,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Crew Detail screen matching prototype screen 21
 * (https://fishtownco.itoasis.co/).
 * Loads `users/{uid}/crew/{id}` from Firestore.
 * @returns Crew member detail UI
 */
export default function CrewDetailScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const memberId = typeof id === "string" ? id : "";
  const {
    data: member,
    isLoading,
    isError,
    refetch,
  } = useCrewMember(memberId);
  const { data: vessel } = useVesselProfile();
  const vesselName = vessel?.name?.trim() || t("crew.vessel-fallback");
  const photoUri = member
    ? pickDisplayMediaUri({
        thumbURL: member.thumbURL,
        downloadURL: member.downloadURL,
        localUri: member.localUri,
      })
    : null;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  if (isLoading && !member) {
    return (
      <Screen>
        <BackHeader title={t("crew.detail-title")} />
        <ActivityIndicator color={colors.teal} style={styles.loader} />
      </Screen>
    );
  }

  if (isError || !member) {
    return (
      <Screen>
        <BackHeader title={t("crew.detail-title")} />
        <AppText style={styles.empty}>{t("crew.load-member-failed")}</AppText>
        <PrimaryButton
          label={t("common.try-again")}
          onPress={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <BackHeader title={t("crew.detail-title")} />

      <Card style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View style={styles.avatar}>
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={styles.avatarImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
            ) : (
              <AppText style={styles.avatarText}>
                {getCrewInitials(member.name)}
              </AppText>
            )}
          </View>
          <View style={styles.profileText}>
            <AppText style={styles.name}>{member.name.toUpperCase()}</AppText>
            <AppText style={styles.role}>{member.role}</AppText>
            <AppText style={styles.vessel}>
              {t("crew.vessel-label", { name: vesselName })}
            </AppText>
          </View>
        </View>

        <View style={styles.divider} />

        <Pressable
          onPress={() => void Linking.openURL(`tel:${member.phone}`)}
          style={styles.contactRow}
        >
          <Ionicons name="call-outline" size={18} color={colors.teal} />
          <AppText style={styles.contactLabel}>{t("crew.mobile-label")}</AppText>
          <AppText style={styles.contactValue}>{member.phone}</AppText>
        </Pressable>

        <Pressable
          onPress={() => void Linking.openURL(`mailto:${member.email}`)}
          style={styles.contactRow}
        >
          <Ionicons name="mail-outline" size={18} color={colors.navy} />
          <AppText style={styles.contactLabel}>{t("crew.email-label")}</AppText>
          <AppText style={styles.contactValue} numberOfLines={1}>
            {member.email}
          </AppText>
        </Pressable>
      </Card>

      <Card style={styles.certsCard}>
        <AppText style={styles.sectionTitle}>
          {t("crew.certificates-section")}
        </AppText>

        {member.certificates.length === 0 ? (
          <AppText style={styles.noCerts}>{t("crew.no-certificates")}</AppText>
        ) : (
          member.certificates.map((cert, index) => {
            const toneStyle = getToneStyle(colors, cert.tone);
            const expired = cert.tone === "overdue";
            return (
              <Pressable
                key={cert.id}
                onPress={() => toast.info(t("common.coming-soon"))}
                style={[
                  styles.certRow,
                  index < member.certificates.length - 1 && styles.certBorder,
                ]}
              >
                <View style={styles.certBody}>
                  <View style={styles.certTitleRow}>
                    <AppText style={styles.certTitle}>{cert.title}</AppText>
                    {cert.hasAttachment ? (
                      <Ionicons
                        name="attach-outline"
                        size={16}
                        color={colors.muted}
                      />
                    ) : null}
                  </View>
                  <AppText
                    style={[
                      styles.certExpires,
                      expired && { color: colors.statusOverdueText },
                    ]}
                  >
                    {expired
                      ? t("crew.expires-expired", { date: cert.expires })
                      : t("crew.expires-on", { date: cert.expires })}
                  </AppText>
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
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: toneStyle.pillText },
                    ]}
                  />
                  <AppText
                    style={[styles.pillText, { color: toneStyle.pillText }]}
                  >
                    {getCrewStatusLabel(cert.tone)}
                  </AppText>
                </View>
              </Pressable>
            );
          })
        )}
      </Card>

      <PrimaryButton
        label={t("crew.edit-member")}
        icon="create-outline"
        onPress={() => router.push(`/crew/edit/${member.id}`)}
        style={styles.editBtn}
      />
    </Screen>
  );
}

type ToneStyle = {
  pillBg: string;
  pillText: string;
  pillBorder: string;
};

/**
 * Resolves certificate pill colors for a status tone.
 * @param colors - Active theme colors
 * @param tone - Certificate status tone
 * @returns Pill color tokens
 */
function getToneStyle(colors: ThemeColors, tone: StatusTone): ToneStyle {
  switch (tone) {
    case "overdue":
      return {
        pillBg: colors.statusOverdueBg,
        pillText: colors.statusOverdueText,
        pillBorder: colors.statusOverdueText,
      };
    case "due":
      return {
        pillBg: colors.softOrange,
        pillText: colors.orange,
        pillBorder: colors.orange,
      };
    default:
      return {
        pillBg: colors.softTeal,
        pillText: colors.teal,
        pillBorder: colors.teal,
      };
  }
}

/**
 * Builds crew-detail styles for the active palette.
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
      marginVertical: 24,
    },
    profileCard: {
      borderRadius: 16,
      marginBottom: 14,
      gap: 14,
    },
    profileTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.cardSoft,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImage: {
      width: 64,
      height: 64,
    },
    avatarText: {
      color: colors.navy,
      fontSize: 20,
      fontWeight: "800",
    },
    profileText: { flex: 1, minWidth: 0, gap: 4 },
    name: {
      color: colors.navy,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: 0.4,
    },
    role: {
      color: colors.navy,
      fontSize: 14,
      fontWeight: "600",
    },
    vessel: {
      color: colors.muted,
      fontSize: 13,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    contactRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    contactLabel: {
      color: colors.muted,
      fontSize: 13,
    },
    contactValue: {
      flex: 1,
      color: colors.navy,
      fontSize: 14,
      fontWeight: "700",
    },
    certsCard: {
      borderRadius: 16,
      marginBottom: 18,
      gap: 4,
    },
    sectionTitle: {
      color: colors.navy,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.6,
      marginBottom: 8,
    },
    noCerts: {
      color: colors.muted,
      fontSize: 13,
      paddingVertical: 8,
    },
    certRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
    },
    certBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    certBody: { flex: 1, minWidth: 0, gap: 4 },
    certTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    certTitle: {
      color: colors.navy,
      fontSize: 14,
      fontWeight: "700",
    },
    certExpires: {
      color: colors.muted,
      fontSize: 12,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    pillText: {
      fontSize: 11,
      fontWeight: "700",
    },
    editBtn: {
      borderRadius: 16,
      minHeight: 56,
    },
  });
}
