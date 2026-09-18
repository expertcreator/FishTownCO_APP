import { StyleSheet, View } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type StatusTone = "ok" | "due" | "overdue" | "info";

type StatusPillProps = {
  label: string;
  tone?: StatusTone;
};

/**
 * Resolves pill colors for a status tone.
 * @param colors - Active theme colors
 * @param tone - Status tone
 * @returns Background and text colors
 */
function toneColors(
  colors: ThemeColors,
  tone: StatusTone
): { bg: string; text: string } {
  switch (tone) {
    case "ok":
      return { bg: colors.statusOkBg, text: colors.statusOkText };
    case "due":
      return { bg: colors.statusDueBg, text: colors.statusDueText };
    case "overdue":
      return { bg: colors.statusOverdueBg, text: colors.statusOverdueText };
    default:
      return { bg: colors.statusInfoBg, text: colors.statusInfoText };
  }
}

/**
 * Small status pill used on inventory and wallet rows.
 * @param props - Pill props
 * @param props.label - Status text
 * @param props.tone - Visual tone
 * @returns Pill element
 */
export function StatusPill({ label, tone = "info" }: StatusPillProps) {
  const colors = useColors();
  const c = toneColors(colors, tone);
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <AppText style={[styles.text, { color: c.text }]}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
  },
});
