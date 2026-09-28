import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import { saveVesselProfile } from "@/features/vessel/services/saveVesselProfile";
import {
  createVesselSetupSchema,
  type VesselSetupSchema,
} from "@/features/vessel/validation/vesselSchema";
import {
  AppText,
  BackHeader,
  Card,
  FormField,
  PrimaryButton,
  Screen,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Vessel Setup screen matching prototype screen 8.
 * Saves the vessel profile to Firestore, then continues to the checklist.
 * @returns Vessel setup UI
 */
export default function VesselSetupScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const schema = useMemo(() => createVesselSetupSchema(t), [t]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit } = useForm<VesselSetupSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "",
      length: "",
      homePort: "",
      mmsi: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  /**
   * Saves vessel basics to Firestore and opens the build checklist.
   * @param values - Validated setup form values
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onSubmit = async (values: VesselSetupSchema) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await saveVesselProfile({
        name: values.name,
        type: values.type,
        length: values.length,
        homePort: values.homePort,
        mmsi: values.mmsi,
      });
      toast.success(t("vessel.save-success"));
      router.push("/vessel/build-checklist");
    } catch (error) {

      if (error instanceof Error && error.message === "NOT_SIGNED_IN") {
        toast.error(t("vessel.sign-in-required"));
      } else {
        toast.error(mapAuthError(error, t));
      }
      setIsSubmitting(false);
    }
  };

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
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
      </Card>
    </Screen>
  );
}

/**
 * Builds vessel-setup styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
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
