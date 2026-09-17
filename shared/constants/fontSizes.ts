import { moderateScale } from "react-native-size-matters";
import APP_CONFIG from "./appConfig";

// Font sizes - driven by APP_CONFIG
const fontSizes = {
  h1: moderateScale(APP_CONFIG.fontSizes.h1), // 👈 From appConfig
  h2: moderateScale(APP_CONFIG.fontSizes.h2), // 👈 From appConfig
  h3: moderateScale(APP_CONFIG.fontSizes.h3), // 👈 From appConfig
  h4: moderateScale(APP_CONFIG.fontSizes.h4), // 👈 From appConfig
  h5: moderateScale(APP_CONFIG.fontSizes.h5), // 👈 From appConfig
  h6: moderateScale(APP_CONFIG.fontSizes.h6), // 👈 From appConfig
  p: moderateScale(APP_CONFIG.fontSizes.p), // 👈 From appConfig
  small: moderateScale(APP_CONFIG.fontSizes.small), // 👈 From appConfig
  tiny: moderateScale(APP_CONFIG.fontSizes.tiny), // 👈 From appConfig
};

export default fontSizes;
