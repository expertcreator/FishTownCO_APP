import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useColors } from "@/ui/theme";

type ListFooterLoaderProps = {
  /** When true, shows the small bottom spinner (Foori load-more footer). */
  loading: boolean;
};

/**
 * Small list footer spinner shown while the next Firestore page loads.
 * @param props - Footer props
 * @param props.loading - Whether more data is fetching
 * @returns Footer element or null
 */
export function ListFooterLoader({ loading }: ListFooterLoaderProps) {
  const colors = useColors();

  if (!loading) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="small" color={colors.teal} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
