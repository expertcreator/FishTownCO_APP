import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type BackHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

/**
 * Prototype-style back header with navy title and optional subtitle.
 * @param props - Header props
 * @param props.title - Screen title
 * @param props.subtitle - Optional supporting line
 * @param props.onBack - Optional back handler
 * @returns Header element
 */
export function BackHeader({ title, subtitle, onBack }: BackHeaderProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        hitSlop={12}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={22} color={colors.navy} />
      </Pressable>
      <AppText style={styles.title}>{title}</AppText>
      {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
  wrap: { marginBottom: 18 },
  back: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -6,
    marginBottom: 8,
  },
  title: {
    color: colors.navy,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
});
}
