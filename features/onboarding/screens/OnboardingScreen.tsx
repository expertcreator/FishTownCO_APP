import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { AppText } from "@/ui/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors, type ThemeColors } from "@/ui/theme";
import { BrandWordmark } from "@/features/onboarding/components/BrandLogo";
import { OnboardingSlideCard } from "@/features/onboarding/components/OnboardingSlideCard";
import {
  ONBOARDING_SLIDES,
  type OnboardingSlideData,
} from "@/features/onboarding/data/slides";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { useTranslation } from "@/ui/translations";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40;

/**
 * Fishtownco onboarding carousel (prototype screens 2–4).
 * @returns Onboarding screen element
 */
export default function OnboardingScreen() {
  const colors = useColors();
  const styles = getStyles(colors);

  const { t } = useTranslation();
  const listRef = useRef<FlatList<OnboardingSlideData>>(null);
  const [index, setIndex] = useState(0);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const isLast = index === ONBOARDING_SLIDES.length - 1;

  /**
   * Finishes onboarding and opens login.
   * @returns void
   */
  const finish = () => {
    completeOnboarding();
    router.replace("/(auth)/login");
  };

  /**
   * Advances to the next slide, or finishes on the last slide.
   * @returns void
   */
  const goNext = () => {
    if (isLast) {
      finish();
      return;
    }
    const next = index + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  /**
   * Syncs the active index from horizontal scroll position.
   * @param event - Native scroll event
   * @returns void
   */
  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
    setIndex(next);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BrandWordmark />
        <Pressable onPress={finish} hitSlop={12}>
          <AppText style={styles.skip}>{t("onboarding.skip")}</AppText>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, i) => ({
          length: CARD_WIDTH,
          offset: CARD_WIDTH * i,
          index: i,
        })}
        renderItem={({ item }) => (
          <View style={{ width: CARD_WIDTH }}>
            <OnboardingSlideCard slide={item} />
          </View>
        )}
      />

      <View style={styles.tabs}>
        {ONBOARDING_SLIDES.map((slide, i) => {
          const active = i === index;
          return (
            <Pressable
              key={slide.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => {
                listRef.current?.scrollToIndex({ index: i, animated: true });
                setIndex(i);
              }}
            >
              <AppText style={[styles.tabLabel, active && styles.tabLabelActive]}>
                SLIDE {String(i + 1).padStart(2, "0")}
              </AppText>
              <AppText style={styles.tabTitle}>{t(slide.tabKey)}</AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.dots}>
        {ONBOARDING_SLIDES.map((slide, i) => (
          <View
            key={slide.id}
            style={[styles.dot, i === index ? styles.dotActive : null]}
          />
        ))}
      </View>

      <Pressable style={styles.cta} onPress={goNext}>
        <AppText style={styles.ctaText}>
          {isLast ? t("onboarding.get-started") : t("onboarding.next")}
        </AppText>
        <Ionicons name="arrow-forward" size={18} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  skip: {
    color: colors.teal,
    fontSize: 15,
    fontWeight: "600",
  },
  listContent: {
    paddingTop: 8,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tabActive: {
    backgroundColor: colors.chipIdle,
  },
  tabLabel: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  tabLabelActive: {
    color: colors.orange,
  },
  tabTitle: {
    marginTop: 2,
    color: colors.navy,
    fontSize: 12,
    fontWeight: "700",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dotInactive,
  },
  dotActive: {
    width: 22,
    borderRadius: 5,
    backgroundColor: colors.orange,
  },
  cta: {
    marginTop: 18,
    marginBottom: 8,
    backgroundColor: colors.orange,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
});
}
