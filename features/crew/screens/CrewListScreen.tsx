import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useInitialSkeleton } from "@/features/common/hooks/useInitialSkeleton";
import { CrewMemberCard } from "@/features/crew/components/CrewMemberCard";
import { useCrewMembers } from "@/features/crew/hooks/useCrewMembers";
import {
  AppText,
  BackHeader,
  CrewListSkeleton,
  FloatingActionButton,
  KeyboardAwareContainer,
  PrimaryButton,
  Screen,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Crew List screen matching prototype screen 19
 * (https://fishtownco.itoasis.co/).
 * Loads members from Firestore `users/{uid}/crew`.
 * @returns Crew list UI
 */
export default function CrewListScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const skeletonPending = useInitialSkeleton();
  const {
    data: members = [],
    isLoading,
    isFetching,
    refetch,
    isError,
  } = useCrewMembers();

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  if ((isLoading || skeletonPending) && members.length === 0 && !isError) {
    return (
      <Screen scroll={false} edges={["top", "left", "right"]}>
        <BackHeader title={t("crew.title")} />
        <CrewListSkeleton />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen edges={["top", "left", "right"]}>
        <BackHeader title={t("crew.title")} />
        <AppText style={styles.empty}>{t("crew.load-failed")}</AppText>
        <PrimaryButton
          label={t("common.try-again")}
          onPress={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      edges={["top", "left", "right"]}
      contentStyle={styles.screen}
    >
      <BackHeader
        title={t("crew.title")}
        subtitle={t("crew.registered-aboard", { count: members.length })}
      />

      <KeyboardAwareContainer
        useSafeAreaWrapper={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
      >
        {members.length === 0 ? (
          <View style={styles.emptyWrap}>
            <AppText style={styles.emptyTitle}>{t("crew.empty-title")}</AppText>
            <AppText style={styles.emptyBody}>{t("crew.empty-body")}</AppText>
          </View>
        ) : (
          <View style={styles.list}>
            {members.map((member) => (
              <CrewMemberCard key={member.id} member={member} />
            ))}
          </View>
        )}
        {isFetching && members.length > 0 ? (
          <ActivityIndicator
            color={colors.teal}
            style={styles.refresh}
            size="small"
          />
        ) : null}
      </KeyboardAwareContainer>

      <FloatingActionButton
        label={t("crew.add-member")}
        icon="person-add-outline"
        onPress={() => router.push("/crew/add")}
      />
    </Screen>
  );
}

/**
 * Builds crew-list styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      paddingBottom: 0,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingBottom: 100,
    },
    list: {
      gap: 0,
    },
    empty: {
      color: colors.muted,
      textAlign: "center",
      marginVertical: 24,
    },
    emptyWrap: {
      paddingVertical: 40,
      alignItems: "center",
      gap: 8,
    },
    emptyTitle: {
      color: colors.navy,
      fontSize: 18,
      fontWeight: "800",
      textAlign: "center",
    },
    emptyBody: {
      color: colors.muted,
      fontSize: 14,
      textAlign: "center",
    },
    refresh: { marginTop: 8 },
  });
}
