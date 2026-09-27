import { Ionicons } from "@expo/vector-icons";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { ENGLISH_COUNTRY_NAMES } from "@/ui/data/englishCountryNames";
import { type ThemeColors, useColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";
import type { Country, CountryCode } from "@/ui/types/country";
import { getFlagEmoji } from "@/ui/utils/phone";
import { CARD_RIPPLE, getPressedItemStyle } from "./pressableStyles";
import AppText from "./Text";

type CountryPickerSheetProps = {
  visible: boolean;
  selectedCountryCode?: CountryCode;
  onClose: () => void;
  onSelectCountry: (country: Country) => void;
};

/**
 * Country picker bottom sheet matching the customer-app CountryPickerSheet.
 * Uses `libphonenumber-js` for codes and bundled English names so search
 * matches "Pakistan" as well as "PK" or "+92".
 * The sheet stays open above the keyboard while searching and closes on select.
 * @param props - Sheet props
 * @param props.visible - Whether the sheet is shown
 * @param props.selectedCountryCode - Currently selected ISO code
 * @param props.onClose - Dismiss handler
 * @param props.onSelectCountry - Selection handler
 * @returns Country picker modal
 */
export function CountryPickerSheet({
  visible,
  selectedCountryCode = "GB",
  onClose,
  onSelectCountry,
}: CountryPickerSheetProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (visible) setQuery("");
  }, [visible]);

  const countries = useMemo<Country[]>(() => {
    const list: Country[] = [];
    for (const cca2 of getCountries()) {
      let callingCode: string;
      try {
        callingCode = getCountryCallingCode(cca2);
      } catch {
        continue;
      }
      list.push({
        cca2: cca2 as CountryCode,
        callingCode: [callingCode],
        name: ENGLISH_COUNTRY_NAMES[cca2] ?? cca2,
      });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    const digits = q.replace(/^\+/, "");
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.cca2.toLowerCase().includes(q) ||
        c.callingCode[0].includes(digits),
    );
  }, [countries, query]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior="padding"
        automaticOffset
        style={styles.fill}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <AppText style={styles.title}>
                {t("common.country-picker-title")}
              </AppText>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => [getPressedItemStyle(pressed)]}
                accessibilityRole="button"
                accessibilityLabel={t("common.close")}
              >
                <Ionicons name="close" size={22} color={colors.navy} />
              </Pressable>
            </View>

            <TextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder={t("common.country-picker-search")}
              placeholderTextColor={colors.muted}
              autoCorrect={false}
              autoCapitalize="none"
              blurOnSubmit={false}
              returnKeyType="search"
            />

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.cca2}
              style={styles.list}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator={false}
              initialNumToRender={16}
              renderItem={({ item }) => {
                const selected = item.cca2 === selectedCountryCode;
                return (
                  <Pressable
                    onPress={() => {
                      onSelectCountry(item);
                      onClose();
                    }}
                    android_ripple={CARD_RIPPLE}
                    style={({ pressed }) => [
                      styles.row,
                      selected && styles.rowSelected,
                      getPressedItemStyle(pressed),
                    ]}
                  >
                    <AppText style={styles.flag}>
                      {getFlagEmoji(item.cca2)}
                    </AppText>
                    <AppText style={styles.name} numberOfLines={1}>
                      {item.name}
                    </AppText>
                    <AppText
                      style={styles.calling}
                    >{`+${item.callingCode[0]}`}</AppText>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <AppText style={styles.empty}>
                  {t("common.country-picker-empty")}
                </AppText>
              }
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Builds country-picker styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    fill: {
      flex: 1,
    },
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "70%",
      flexShrink: 1,
      paddingBottom: 24,
      paddingHorizontal: 16,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginTop: 10,
      marginBottom: 6,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
    },
    title: {
      color: colors.navy,
      fontSize: 17,
      fontWeight: "800",
    },
    search: {
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardSoft,
      paddingHorizontal: 14,
      fontSize: 15,
      color: colors.navy,
      marginBottom: 8,
    },
    list: {
      flexGrow: 0,
      flexShrink: 1,
      maxHeight: 280,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 10,
      overflow: "hidden",
    },
    rowSelected: {
      backgroundColor: colors.softTeal,
    },
    flag: {
      fontSize: 20,
      lineHeight: 24,
    },
    name: {
      flex: 1,
      color: colors.navy,
      fontSize: 15,
      fontWeight: "600",
    },
    calling: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "700",
      writingDirection: "ltr",
    },
    empty: {
      textAlign: "center",
      color: colors.muted,
      paddingVertical: 24,
    },
  });
}
