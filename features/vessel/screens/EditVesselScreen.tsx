import { zodResolver } from "@hookform/resolvers/zod";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, StyleSheet } from "react-native";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import { useVesselProfile } from "@/features/vessel/hooks/useVesselProfile";
import { saveVesselProfile } from "@/features/vessel/services/saveVesselProfile";
import {
  createEditVesselSchema,
  type EditVesselSchema,
} from "@/features/vessel/validation/vesselSchema";
import {
  AppText,
  BackHeader,
  FormCard,
  FormField,
  KeyboardAwareContainer,
  PrimaryButton,
  Screen,
  StickyFormFooter,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Edit Vessel screen matching prototype screen 18
 * (https://fishtownco.itoasis.co/).
 * Loads and saves `users/{uid}/vessel/profile` in Firestore.
 * @returns Edit vessel form
 */
export default function EditVesselScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const colors = useColors();
  const styles = getStyles(colors);
  const schema = useMemo(() => createEditVesselSchema(t), [t]);
  const { data: vessel, isLoading, refetch } = useVesselProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const { control, handleSubmit, reset } = useForm<EditVesselSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "",
      length: "",
      homePort: "",
      mmsi: "",
      registrationNo: "",
      engineHours: "",
      usage: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
      setHydrated(false);
    }, [refetch])
  );

  useEffect(() => {
    if (isLoading || hydrated) return;
    if (vessel) {
      reset({
        name: vessel.name,
        type: vessel.type,
        length: vessel.length,
        homePort: vessel.homePort,
        mmsi: vessel.mmsi,
        registrationNo: vessel.registrationNo,
        engineHours: vessel.engineHours,
        usage: vessel.usage,
      });
    }
    setHydrated(true);
  }, [vessel, isLoading, hydrated, reset]);

  /**
   * Saves the vessel profile to Firestore and returns to My Vessel.
   * @param values - Validated form values
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onSubmit = async (values: EditVesselSchema) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await saveVesselProfile({
        name: values.name,
        type: values.type,
        length: values.length,
        homePort: values.homePort,
        mmsi: values.mmsi,
        registrationNo: values.registrationNo,
        engineHours: values.engineHours,
        usage: values.usage,
        tonnage: vessel?.tonnage,
        flag: vessel?.flag,
        callSign: vessel?.callSign,
        yearBuilt: vessel?.yearBuilt,
        skipper: vessel?.skipper,
        nextServiceIn: vessel?.nextServiceIn,
      });
      toast.success(t("vessel.save-success"));
      router.back();
    } catch (error) {
      console.error("[EditVesselScreen] save failed", error);
      if (error instanceof Error && error.message === "NOT_SIGNED_IN") {
        toast.error(t("vessel.sign-in-required"));
      } else {
        toast.error(mapAuthError(error, t));
      }
      setIsSubmitting(false);
    }
  };

  if (isLoading || !hydrated) {
    return (
      <Screen>
        <BackHeader title={t("vessel.edit-title")} />
        <ActivityIndicator color={colors.teal} style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      edges={["top", "left", "right"]}
      contentStyle={styles.screen}
    >
      <BackHeader title={t("vessel.edit-title")} />
      <KeyboardAwareContainer
        useSafeAreaWrapper={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
      >
        <FormCard style={styles.card}>
          <FormField
            control={control}
            name="name"
            label={t("setup.vessel-name")}
            placeholder={t("vessel.name-placeholder")}
          />
          <FormField
            control={control}
            name="type"
            label={t("setup.vessel-type")}
            placeholder={t("vessel.type-placeholder")}
          />
          <FormField
            control={control}
            name="length"
            label={t("vessel.length-loa")}
            placeholder={t("vessel.length-placeholder")}
          />
          <FormField
            control={control}
            name="homePort"
            label={t("vessel.home-port-harbour")}
            placeholder={t("vessel.home-port-placeholder")}
          />
          <FormField
            control={control}
            name="mmsi"
            label={t("vessel.mmsi-number")}
            keyboardType="number-pad"
            placeholder={t("vessel.mmsi-placeholder")}
          />
          <FormField
            control={control}
            name="registrationNo"
            label={t("vessel.registration-no")}
            placeholder={t("vessel.registration-placeholder")}
          />
          <FormField
            control={control}
            name="engineHours"
            label={t("vessel.engine-hours")}
            keyboardType="number-pad"
            placeholder={t("vessel.engine-hours-placeholder")}
          />
          <FormField
            control={control}
            name="usage"
            label={t("vessel.vessel-use")}
            placeholder={t("vessel.usage-placeholder")}
          />
        </FormCard>

        {!vessel ? (
          <AppText style={styles.hint}>{t("vessel.create-hint")}</AppText>
        ) : null}
      </KeyboardAwareContainer>

      <StickyFormFooter>
        <PrimaryButton
          label={t("vessel.save-profile")}
          icon="save-outline"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
      </StickyFormFooter>
    </Screen>
  );
}

/**
 * Builds edit-vessel styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      paddingHorizontal: 0,
      paddingBottom: 0,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    card: {
      marginBottom: 12,
      gap: 14,
    },
    loader: { marginTop: 40 },
    hint: {
      color: colors.muted,
      fontSize: 13,
      textAlign: "center",
    },
  });
}
