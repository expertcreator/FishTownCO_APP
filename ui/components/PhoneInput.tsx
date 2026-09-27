import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { Country, CountryCode } from "@/ui/types/country";
import { getCallingCode, getFlagEmoji } from "@/ui/utils/phone";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";
import {
  CARD_RIPPLE,
  getPressedItemStyle,
} from "./pressableStyles";

type PhoneInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder: string;
  countryCode: CountryCode;
  selectedCountry: Country | null;
  onCountryCodePress: () => void;
  disabled?: boolean;
  maxLength?: number;
  wrapperStyle?: StyleProp<ViewStyle>;
};

/**
 * Mobile number row matching the customer-app PhoneInput layout:
 * country flag + calling code on the left, national number field on the right.
 * Styled with FishTown field tokens (uppercase label, 52px inputs).
 * @param props - Phone input props
 * @param props.control - react-hook-form control
 * @param props.name - National-number field name
 * @param props.label - Uppercase field label
 * @param props.placeholder - National-number placeholder
 * @param props.countryCode - Selected ISO country
 * @param props.selectedCountry - Optional full country from the picker
 * @param props.onCountryCodePress - Opens the country picker
 * @param props.disabled - Disables both controls
 * @param props.maxLength - Optional max national digits
 * @param props.wrapperStyle - Optional outer style
 * @returns Phone input row
 */
export function PhoneInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  countryCode,
  selectedCountry,
  onCountryCodePress,
  disabled = false,
  maxLength,
  wrapperStyle,
}: PhoneInputProps<T>) {
  const colors = useColors();
  const styles = getStyles(colors);
  const callingCode = selectedCountry
    ? selectedCountry.callingCode[0]
    : getCallingCode(countryCode);

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={styles.row}>
        <Pressable
          onPress={onCountryCodePress}
          disabled={disabled}
          android_ripple={CARD_RIPPLE}
          style={({ pressed }) => [
            styles.countryCode,
            disabled && styles.disabled,
            getPressedItemStyle(pressed),
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Country code +${callingCode}`}
        >
          <AppText style={styles.flag}>{getFlagEmoji(countryCode)}</AppText>
          <AppText style={styles.code}>{`+${callingCode}`}</AppText>
        </Pressable>

        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <View style={styles.numberWrap}>
              <View
                style={[
                  styles.inputRow,
                  fieldState.error ? styles.inputError : null,
                  disabled && styles.disabled,
                ]}
              >
                <TextInput
                  value={typeof value === "string" ? value : ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={placeholder}
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                  maxLength={maxLength}
                  editable={!disabled}
                  style={styles.input}
                  accessibilityLabel={label}
                />
              </View>
              {fieldState.error?.message ? (
                <AppText style={styles.error}>{fieldState.error.message}</AppText>
              ) : null}
            </View>
          )}
        />
      </View>
    </View>
  );
}

/**
 * Builds PhoneInput styles matching FishTown Field + customer-app row layout.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      gap: 8,
      width: "100%",
      direction: "ltr",
    },
    label: {
      color: colors.navy,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      width: "100%",
      direction: "ltr",
    },
    countryCode: {
      width: 96,
      minWidth: 88,
      minHeight: 52,
      flexShrink: 0,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 8,
      overflow: "hidden",
    },
    flag: {
      fontSize: 16,
      lineHeight: 20,
    },
    code: {
      color: colors.navy,
      fontSize: 15,
      fontWeight: "700",
      writingDirection: "ltr",
    },
    numberWrap: {
      flex: 1,
      flexShrink: 1,
      minWidth: 0,
      gap: 6,
    },
    inputRow: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      backgroundColor: colors.card,
      paddingHorizontal: 14,
      justifyContent: "center",
    },
    input: {
      color: colors.navy,
      fontSize: 15,
      paddingVertical: 12,
      textAlign: "left",
      writingDirection: "ltr",
    },
    inputError: {
      borderColor: colors.statusOverdueText,
    },
    error: {
      color: colors.statusOverdueText,
      fontSize: 12,
      fontWeight: "600",
    },
    disabled: {
      opacity: 0.55,
    },
  });
}
