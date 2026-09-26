import { StyleSheet } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type SectionHeaderProps = {
  title: string;
};

/**
 * Uppercase section label used inside form cards (e.g. Certificates & Photos).
 * @param props - Section header props
 * @param props.title - Section title text
 * @returns Section header element
 */
export function SectionHeader({ title }: SectionHeaderProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return <AppText style={styles.title}>{title}</AppText>;
}

/**
 * Builds section-header styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    title: {
      color: colors.navy,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.6,
      marginTop: 4,
    },
  });
}
