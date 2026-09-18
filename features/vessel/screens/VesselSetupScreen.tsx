import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import { DEMO_VESSEL } from "@/features/common/data/demo";
import {
  AppText,
  BackHeader,
  Card,
  Field,
  PrimaryButton,
  Screen,
} from "@/ui/components";
import { useTranslation } from "@/ui/translations";

/**
 * Vessel Setup screen matching prototype screen 8.
 * @returns Vessel setup UI
 */
export default function VesselSetupScreen() {
  const colors = useColors();
  const styles = getStyles(colors);

  const { t } = useTranslation();
  const [name, setName] = useState(DEMO_VESSEL.name);
  const [type, setType] = useState(DEMO_VESSEL.type);
  const [length, setLength] = useState(DEMO_VESSEL.length);
  const [homePort, setHomePort] = useState(DEMO_VESSEL.homePort);
  const [mmsi, setMmsi] = useState(DEMO_VESSEL.mmsi);

  return (
    <Screen>
      <BackHeader
        title={t("setup.vessel-title")}
        subtitle={t("setup.vessel-subtitle")}
      />

      <View style={styles.step}>
        <AppText style={styles.stepText}>{t("setup.step-1")}</AppText>
      </View>

      <Card style={styles.card}>
        <Field
          label={t("setup.vessel-name")}
          icon="boat-outline"
          value={name}
          onChangeText={setName}
        />
        <Field
          label={t("setup.vessel-type")}
          icon="compass-outline"
          value={type}
          onChangeText={setType}
        />
        <Field
          label={t("setup.length")}
          icon="resize-outline"
          value={length}
          onChangeText={setLength}
        />
        <Field
          label={t("setup.home-port")}
          icon="location-outline"
          value={homePort}
          onChangeText={setHomePort}
        />
        <Field
          label={t("setup.mmsi")}
          icon="radio-outline"
          value={mmsi}
          onChangeText={setMmsi}
          keyboardType="number-pad"
        />
        <PrimaryButton
          label={t("setup.continue-checklist")}
          onPress={() => router.push("/vessel/build-checklist")}
        />
      </Card>
    </Screen>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
  step: {
    alignSelf: "flex-start",
    backgroundColor: colors.softTeal,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  stepText: { color: colors.teal, fontWeight: "700", fontSize: 12 },
  card: { gap: 14 },
});
}
