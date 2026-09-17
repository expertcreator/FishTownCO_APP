import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { type StatusTone, toneColors } from "@/features/common/data/demo";

type StatusPillProps = {
  label: string;
  tone?: StatusTone;
};

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
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
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
