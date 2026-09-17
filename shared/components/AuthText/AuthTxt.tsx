import { colors, fonts, fontSizes } from "@/shared/constants";
import { moderateScale } from "@/shared/imports";
import { StyleSheet, View } from "react-native";
import AppText from "../Text";

type AuthTxtProps = {
  title: string;
  description: string;
  dexWidth?: number | `${number}%`;
};

const AuthTxt = ({ title, description, dexWidth }: AuthTxtProps) => (
  <View style={styles.container}>
    <AppText style={styles.title}>{title}</AppText>
    <AppText
      style={[styles.description, dexWidth ? { width: dexWidth } : undefined]}
    >
      {description}
    </AppText>
  </View>
);

export default AuthTxt;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: fontSizes.h2,
    fontFamily: fonts.heading,
    lineHeight: fontSizes.h2 * 1.35,
    textAlign: "center",
    marginBottom: moderateScale(10),
    color: colors.primary,
    includeFontPadding: false,
  },
  description: {
    fontSize: fontSizes.p,
    fontFamily: fonts.title,
    textAlign: "center",
    marginBottom: moderateScale(20),
    color: colors.gray,
    alignSelf: "center",
  },
});
