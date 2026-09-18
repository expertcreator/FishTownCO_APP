import { Image, StyleSheet, View } from "react-native";

const logo = require("@/assets/branding/fishtownco/logo.png");
const logoArabic = require("@/assets/branding/fishtownco/logoArabic.png");
const splash = require("@/assets/branding/fishtownco/splash.png");

/**
 * Off-screen mount of bundled brand logos so Android decodes them during
 * native splash / first frame.
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
      <Image source={logo} defaultSource={logo} style={styles.pixel} fadeDuration={0} />
      <Image
        source={logoArabic}
        defaultSource={logoArabic}
        style={styles.pixel}
        fadeDuration={0}
      />
      <Image
        source={splash}
        defaultSource={splash}
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
