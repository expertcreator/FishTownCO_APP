import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import { DEMO_VESSEL } from "@/features/common/data/demo";
import {
  AppText,
  BackHeader,
  Card,
  FormField,
  PrimaryButton,
  Screen,
} from "@/ui/components";
import { useTranslation } from "@/ui/translations";
import {
  createVesselSetupSchema,
  type VesselSetupSchema,
} from "@/features/vessel/validation/vesselSchema";

/**
 * Vessel Setup screen matching prototype screen 8.
 * @returns Vessel setup UI
 */
export default function VesselSetupScreen() {
  const colors = useColors();
  const styles = getStyles(colors);

  const { t } = useTranslation();
  const schema = useMemo(() => createVesselSetupSchema(t), [t]);
  const { control, handleSubmit } = useForm<VesselSetupSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: DEMO_VESSEL.name,
      type: DEMO_VESSEL.type,
      length: DEMO_VESSEL.length,
      homePort: DEMO_VESSEL.homePort,
      mmsi: DEMO_VESSEL.mmsi,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

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
        <FormField
          control={control}
          name="name"
          label={t("setup.vessel-name")}
          icon="boat-outline"
        />
        <FormField
          control={control}
          name="type"
          label={t("setup.vessel-type")}
          icon="compass-outline"
        />
        <FormField
          control={control}
          name="length"
          label={t("setup.length")}
          icon="resize-outline"
        />
        <FormField
          control={control}
          name="homePort"
          label={t("setup.home-port")}
          icon="location-outline"
        />
        <FormField
          control={control}
          name="mmsi"
          label={t("setup.mmsi")}
          icon="radio-outline"
          keyboardType="number-pad"
        />
        <PrimaryButton
          label={t("setup.continue-checklist")}
          onPress={handleSubmit(() => router.push("/vessel/build-checklist"))}
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
