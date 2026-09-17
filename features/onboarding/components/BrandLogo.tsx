import { StyleSheet, Text, View, Image } from "react-native";
import { colors } from "@/constants/theme";

type BrandLogoProps = {
  /** Visual size of the mark */
  size?: "sm" | "md" | "lg";
};

/**
 * Renders the Fishtownco logo image.
 * @param props - Logo display options
 * @param props.size - Icon size preset
 * @returns Brand logo element
 */
export function BrandLogo({ size = "md" }: BrandLogoProps) {
  const height = size === "sm" ? 40 : size === "lg" ? 72 : 56;
  const width = height * 3.2;

  return (
    <View style={styles.row}>
      <Image
        source={require("@/assets/branding/fishtownco/logo.png")}
        style={{ width, height }}
        resizeMode="contain"
        accessibilityLabel="Fishtown Co logo"
      />
    </View>
  );
}

/**
 * Compact header wordmark used on onboarding screens.
 * @returns Header brand text
 */
export function BrandWordmark() {
  return (
    <Text style={styles.wordmark}>
      FISHTOWN <Text style={styles.wordmarkAccent}>CO.</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  wordmarkAccent: {
    color: colors.orange,
  },
});
