import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { CrewMemberCard } from "@/features/crew/components/CrewMemberCard";
import { useCrewMembers } from "@/features/crew/hooks/useCrewMembers";
import {
  AppText,
  BackHeader,
  CrewListSkeleton,
  EmptyState,
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
  const { data, isLoading, isFetching, refetch, isError } = useCrewMembers();
  const members = data ?? [];
  /**
   * `data` is `undefined` until the first fetch settles.
   * Do not default that to `[]` for UI gates — that flashed EmptyState before the skeleton.
   */
  const isInitialLoad = data === undefined;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  if (isInitialLoad && (isLoading || isFetching || !isError)) {
    return (
      <Screen scroll={false} edges={["top", "left", "right"]}>
        <View style={styles.headerPad}>
          <BackHeader title={t("crew.title")} />
        </View>
        <CrewListSkeleton />
      </Screen>
    );
  }

  if (isInitialLoad && isError) {
    return (
      <Screen
        edges={["top", "left", "right"]}
        header={<BackHeader title={t("crew.title")} />}
      >
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
      <View style={styles.headerPad}>
        <BackHeader
          title={t("crew.title")}
          subtitle={t("crew.registered-aboard", { count: members.length })}
        />
      </View>

      <KeyboardAwareContainer
        useSafeAreaWrapper={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {members.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={t("crew.empty-title")}
            body={t("crew.empty-body")}
            actionLabel={t("crew.add-member")}
            actionIcon="person-add-outline"
            onActionPress={() => router.push("/crew/add")}
          />
        ) : (
          <View style={styles.list}>
            {members.map((member) => (
              <CrewMemberCard key={member.id} member={member} />
            ))}
          </View>
        )}
      </KeyboardAwareContainer>

      <FloatingActionButton
        accessibilityLabel={t("crew.add-member")}
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
      paddingHorizontal: 0,
      paddingBottom: 0,
    },
    headerPad: {
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
    },
    list: {
      gap: 0,
    },
    empty: {
      color: colors.muted,
      textAlign: "center",
      marginVertical: 24,
      paddingHorizontal: 16,
    },
  });
}
