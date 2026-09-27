import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import type { StatusTone } from "@/features/common/data/demo";
import { pickDisplayMediaUri } from "@/features/common/media/mediaStatus";
import type { CrewMember } from "@/features/crew/types/crew";
import { getCrewInitials } from "@/features/crew/types/crew";
import {
  getCrewStatusIcon,
  getCrewStatusLabel,
} from "@/features/crew/utils/crewStatus";
import {
  AppText,
  CARD_RIPPLE,
  Card,
  getPressedItemStyle,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";

type CrewMemberCardProps = {
  member: CrewMember;
};

/**
 * Crew list card matching prototype screen 19.
 * Photo thumb (or initials), role, status pill, and ENG1 medical row.
 * @param props - Card props
 * @param props.member - Crew member to display
 * @returns Crew member card element
 */
export function CrewMemberCard({ member }: CrewMemberCardProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const toneStyle = getToneStyle(colors, member.tone);
  const status = getCrewStatusLabel(member.tone);
  const statusIcon = getCrewStatusIcon(member.tone);
  const photoUri = pickDisplayMediaUri({
    thumbURL: member.thumbURL,
    downloadURL: member.downloadURL,
    localUri: member.localUri,
  });

  return (
    <Pressable
      onPress={() => router.push(`/crew/${member.id}`)}
      android_ripple={CARD_RIPPLE}
      style={({ pressed }) => [getPressedItemStyle(pressed)]}
      accessibilityRole="button"
      accessibilityLabel={member.name}
    >
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.left}>
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
            <View style={styles.body}>
              <AppText style={styles.name} numberOfLines={1}>
                {member.name}
              </AppText>
              <AppText style={styles.role} numberOfLines={1}>
                {member.role}
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
              {status}
            </AppText>
          </View>
        </View>

        <View style={styles.medical}>
          <Ionicons
            name="medkit-outline"
            size={18}
            color={colors.teal}
          />
          <AppText
            style={[
              styles.medicalText,
              member.tone === "overdue" && styles.medicalExpired,
            ]}
            numberOfLines={1}
          >
            {member.medicalLabel}
          </AppText>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </Card>
    </Pressable>
  );
}

type ToneStyle = {
  pillBg: string;
  pillText: string;
  pillBorder: string;
};

/**
 * Resolves status pill colors for a crew tone.
 * @param colors - Active theme colors
 * @param tone - Crew status tone
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
 * Builds crew-member-card styles for the active palette.
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
      alignItems: "center",
      gap: 12,
      minWidth: 0,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.softTeal,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImage: {
      width: 48,
      height: 48,
    },
    avatarText: {
      color: colors.navy,
      fontSize: 15,
      fontWeight: "800",
    },
    body: { flex: 1, minWidth: 0, gap: 2 },
    name: {
      color: colors.navy,
      fontWeight: "800",
      fontSize: 16,
    },
    role: {
      color: colors.muted,
      fontSize: 13,
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
    medical: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.cardSoft,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    medicalText: {
      flex: 1,
      color: colors.navy,
      fontSize: 13,
      fontWeight: "600",
    },
    medicalExpired: {
      color: colors.statusOverdueText,
    },
  });
}
