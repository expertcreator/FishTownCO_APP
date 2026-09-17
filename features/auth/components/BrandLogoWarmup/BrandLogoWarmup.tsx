import { Images } from "@/shared/constants";
import { Image, StyleSheet, View } from "react-native";

/**
 * Off-screen mount of bundled brand logos so Android decodes them during
 * native splash / first frame (Foori pattern).
 * @returns Invisible logo pair (no layout impact)
 */
export function BrandLogoWarmup() {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={styles.host}
    >
      <Image
        source={Images.logo}
        defaultSource={Images.logo}
        style={styles.pixel}
        fadeDuration={0}
      />
      <Image
        source={Images.logoArabic}
        defaultSource={Images.logoArabic}
        style={styles.pixel}
        fadeDuration={0}
      />
      <Image
        source={Images.splash}
        defaultSource={Images.splash}
        style={styles.pixel}
        fadeDuration={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
    left: 0,
    top: 0,
  },
  pixel: {
    width: 1,
    height: 1,
  },
});
