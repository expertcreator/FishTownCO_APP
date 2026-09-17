import { fonts, fontSizes } from "@/shared/constants";
import { useColors } from "@/shared/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import AppButton from "../Button";
import AppText from "../Text";
import type { CashBlockedProps } from "./CashBlocked.type";

const CashBlocked = ({
  iconName = "wallet-outline",
  title,
  description,
  subDescription,
  subDescriptionTitle,
  primaryButtonTitle,
  onPrimaryPress,
  secondaryButtonTitle,
  onSecondaryPress,
  secondaryButtonLoading = false,
  secondaryButtonDisabled = false,
}: CashBlockedProps) => {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View
          style={styles.iconContainer}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <MaterialCommunityIcons
            name={iconName}
            size={80}
            color={colors.primary}
          />
        </View>

        <AppText style={styles.title}>{title}</AppText>

        <AppText style={styles.description}>{description}</AppText>

        {subDescriptionTitle ? (
          <AppText style={styles.subDescriptionTitle}>
            {subDescriptionTitle}
          </AppText>
        ) : null}

        <AppText style={styles.subDescription}>{subDescription}</AppText>
      </View>

      <View style={styles.buttonContainer}>
        <AppButton
          title={primaryButtonTitle}
          onPress={onPrimaryPress}
          variant="primary"
          pill
          height={moderateScale(50)}
          style={styles.primaryButton}
        />
        {secondaryButtonTitle && onSecondaryPress ? (
          <AppButton
            title={secondaryButtonTitle}
            onPress={onSecondaryPress}
            variant="outline"
            pill
            height={moderateScale(50)}
            loading={secondaryButtonLoading}
            disabled={secondaryButtonDisabled}
            style={styles.secondaryButton}
          />
        ) : null}
      </View>
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    headerSection: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: moderateScale(24),
      paddingTop: moderateScale(40),
    },
    iconContainer: {
      marginBottom: moderateScale(24),
    },
    title: {
      fontSize: fontSizes.h3,
      fontWeight: "600",
      color: colors.primary,
      fontFamily: fonts.heading,
      textAlign: "center",
      marginBottom: moderateScale(16),
    },
    description: {
      fontSize: fontSizes.p,
      fontWeight: "500",
      color: colors.text,
      fontFamily: fonts.title,
      textAlign: "center",
      marginBottom: moderateScale(12),
      lineHeight: 22,
    },
    subDescription: {
      fontSize: fontSizes.small,
      fontWeight: "400",
      color: colors.lightGray2,
      fontFamily: fonts.title,
      textAlign: "center",
      lineHeight: 20,
    },
    subDescriptionTitle: {
      fontSize: fontSizes.small,
      fontWeight: "600",
      color: colors.text,
      fontFamily: fonts.title,
      textAlign: "center",
      marginBottom: moderateScale(4),
    },
    buttonContainer: {
      paddingHorizontal: moderateScale(20),
      paddingBottom: moderateScale(40),
      paddingTop: moderateScale(20),
    },
    primaryButton: {
      width: "100%",
    },
    secondaryButton: {
      width: "100%",
      marginTop: moderateScale(12),
    },
  });

export default CashBlocked;
