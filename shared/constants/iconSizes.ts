import { moderateScale } from "react-native-size-matters";
import APP_CONFIG from "./appConfig";

// Icon sizes - driven by APP_CONFIG
const iconSizes = {
  xs: moderateScale(APP_CONFIG.iconSizes.xs), // 👈 From appConfig
  sm: moderateScale(APP_CONFIG.iconSizes.sm), // 👈 From appConfig
  md: moderateScale(APP_CONFIG.iconSizes.md), // 👈 From appConfig
  lg: moderateScale(APP_CONFIG.iconSizes.lg), // 👈 From appConfig
  xl: moderateScale(APP_CONFIG.iconSizes.xl), // 👈 From appConfig
  xxl: moderateScale(APP_CONFIG.iconSizes.xxl), // 👈 From appConfig
};

export default iconSizes;
