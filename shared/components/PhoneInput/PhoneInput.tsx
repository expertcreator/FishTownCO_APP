import { useColors } from "@/shared/theme/ThemeContext";
import {
  getCountryCallingCode,
  type CountryCode as LibPhoneCountryCode,
} from "libphonenumber-js";
import type {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import type { Country, CountryCode } from "../../types/country";
import { moderateScale } from "react-native-size-matters";
import { fontSizes, fonts } from "../../constants";
import AppFloatingLabelFormField from "../FloatingLabelFormField";
import AppText from "../Text/AppText";

export type PhoneInputProps<T extends FieldValues = FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  error?: FieldError;
  countryCode: CountryCode;
  selectedCountry: Country | null;
  onCountryCodePress: () => void;
  disabled?: boolean;
  maxLength?: number;
  transparentBackground?: boolean;
  /** Surface the floating label cuts out of — pass the host background when it is not `card`/`background`. */
  labelBackgroundColor?: string;
  /** Merged onto the outer wrapper (e.g. `{ marginBottom: 0 }` when grouped with content below). */
  wrapperStyle?: StyleProp<ViewStyle>;
  gapWhenNoError?: number;
  gapAfterError?: number;
};

// Helper function to get calling code from country code using libphonenumber-js
const getCallingCodeFromCountryCode = (countryCode: CountryCode): string => {
  try {
    return getCountryCallingCode(countryCode as LibPhoneCountryCode);
  } catch {
    return "92"; // Default to Pakistan
  }
};

const getFlagEmoji = (countryCode: CountryCode): string =>
  countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127_397 + char.charCodeAt(0))
    );

export default function PhoneInput<T extends FieldValues = FieldValues>({
  control,
  name,
  label = "Mobile Number",
  error,
  countryCode,
  selectedCountry,
  onCountryCodePress,
  disabled = false,
  maxLength,
  transparentBackground = false,
  labelBackgroundColor,
  wrapperStyle,
  gapWhenNoError,
  gapAfterError,
}: PhoneInputProps<T>) {
  const colors = useColors();
  const styles = getStyles(colors);
  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <View style={styles.mobileInputWrapper}>
        <TouchableOpacity
          style={[
            transparentBackground
              ? styles.transparentCountryCodeContainer
              : styles.countryCodeContainer,
            disabled && styles.disabled,
          ]}
          activeOpacity={0.8}
          onPress={onCountryCodePress}
          disabled={disabled}
        >
          <AppText style={styles.countryFlag}>
            {getFlagEmoji(countryCode)}
          </AppText>
          <AppText style={styles.countryCode}>
            {selectedCountry
              ? `+${selectedCountry.callingCode[0]}`
              : `+${getCallingCodeFromCountryCode(countryCode)}`}
          </AppText>
        </TouchableOpacity>
        <View style={styles.mobileInputContainer}>
          <AppFloatingLabelFormField
            control={control}
            name={name}
            label={label}
            error={error}
            containerStyle={
              transparentBackground
                ? styles.transparentInputContainer
                : styles.inputContainer
            }
            inputStyle={styles.input}
            labelBackgroundColor={
              labelBackgroundColor ??
              (transparentBackground ? colors.background : colors.card)
            }
            keyboardType="phone-pad"
            maxLength={maxLength}
            gapWhenNoError={gapWhenNoError}
            gapAfterError={gapAfterError}
          />
        </View>
      </View>
    </View>
  );
}

export const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: moderateScale(16),
      width: "100%",
      direction: "ltr",
    },
    mobileInputWrapper: {
      flexDirection: "row",
      direction: "ltr",
      gap: moderateScale(10),
      width: "100%",
    },
    countryCodeContainer: {
      width: moderateScale(96),
      minWidth: moderateScale(88),
      flexShrink: 0,
      borderRadius: moderateScale(12),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.black,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      gap: moderateScale(6),
      height: moderateScale(46),
    },
    transparentCountryCodeContainer: {
      width: moderateScale(96),
      minWidth: moderateScale(88),
      flexShrink: 0,
      borderRadius: moderateScale(12),
      borderWidth: moderateScale(0.7),
      borderColor: colors.black,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      gap: moderateScale(6),
      height: moderateScale(46),
    },
    countryFlag: {
      fontSize: moderateScale(16),
      lineHeight: moderateScale(20),
    },
    countryCode: {
      fontSize: fontSizes.p,
      fontFamily: fonts.heading,
      color: colors.text,
      writingDirection: "ltr",
    },
    mobileInputContainer: {
      flex: 1,
      flexShrink: 1,
      minWidth: 0,
    },
    inputContainer: {
      borderRadius: moderateScale(12),
      borderColor: colors.black,
      borderWidth: moderateScale(0.7),
      paddingHorizontal: moderateScale(16),
      backgroundColor: colors.card,
      height: moderateScale(46),
    },
    transparentInputContainer: {
      borderRadius: moderateScale(12),
      borderColor: colors.black,
      borderWidth: moderateScale(0.7),
      paddingHorizontal: moderateScale(16),
      height: moderateScale(46),
    },
    input: {
      fontSize: fontSizes.p,
      fontFamily: fonts.title,
      color: colors.text,
      textAlign: "left",
      writingDirection: "ltr",
    },
    disabled: {
      opacity: 0.6,
    },
  });
