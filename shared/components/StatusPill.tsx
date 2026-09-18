import { StyleSheet, View } from "react-native";
import AppText from "./Text";

type StatusTone = "ok" | "due" | "overdue" | "info";

type StatusPillProps = {
  label: string;
  tone?: StatusTone;
};

/**
 * Resolves pill colors for a status tone.
 * @param tone - Status tone
 * @returns Background and text colors
 */
function toneColors(tone: StatusTone): { bg: string; text: string } {
  switch (tone) {
    case "ok":
      return { bg: "#E4F5EC", text: "#1F7A4D" };
    case "due":
      return { bg: "#FFF4E0", text: "#B45309" };
    case "overdue":
      return { bg: "#FDECEC", text: "#B91C1C" };
    default:
      return { bg: "#E2F1F8", text: "#0F5F73" };
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
  const c = toneColors(tone);
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
