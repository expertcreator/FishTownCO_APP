import { StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { colors, fontSizes } from "../../constants";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: moderateScale(10),
  },
  emptyText: {
    fontSize: fontSizes.p,
    textAlign: "center",
    marginTop: moderateScale(20),
    color: colors.gray,
  },
});

export default styles;
